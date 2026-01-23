import OpenAI from "openai";
import { UserProfile, AnalysisResponse, ChatMessage } from "../types";
import { SYSTEM_PROMPT } from "../constants";

// Get API key from Vite environment
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const analyzeReports = async (
  images: string[], 
  profile: UserProfile
): Promise<AnalysisResponse> => {
  const openai = new OpenAI({ 
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });
  
  const imageContents = images.map(img => ({
    type: "image_url" as const,
    image_url: { url: img }
  }));

  const userPrompt = `
    Analyze these Evony TKR battle reports. Focus on extracting defender data and calculating the perfect counter-march.
    
    USER MILITARY SPECS:
    - March Size: ${profile.marchSize}
    - Embassy Capacity: ${profile.embassyCapacity}
    - Max Tiers: Ground T${profile.highestTiers.Ground}, Ranged T${profile.highestTiers.Ranged}, Mounted T${profile.highestTiers.Mounted}, Siege T${profile.highestTiers.Siege}

    IMPORTANT: If you encounter any of the following, use the web search tool to get current information:
    - Unusual buffs or items
    - Recent game updates or patches
    - New game mechanics you're unsure about
    - Conflicting information in reports
    - Meta changes or balance updates
    - New strategies or tactics

    After analysis, you MUST output using these headers exactly:
    ### ENEMY_INTEL
    ### RECOMMENDED_MARCH
    ### TACTICAL_SUMMARY
    ### DATA_EXTRACTION
    ### SOURCES_USED (list any web sources you referenced with citations)
  `;

  try {
    // Using Responses API for built-in web search
    const response = await openai.responses.create({
      model: 'gpt-5', // Or 'gpt-4o-search-preview' for web search optimized
      tools: [{ type: "web_search" }],
      tool_choice: "auto",
      input: [
        { type: "input_text", text: SYSTEM_PROMPT + "\n\n" + userPrompt },
        ...imageContents.map(content => ({
          type: "input_image",
          image_url: { url: content.image_url.url }
        }))
      ],
      reasoning: { effort: "low" }, // For faster responses, can be "medium" or "high"
      include: ["web_search_call", "message.content.annotations"]
    });

    // Extract text from response
    const message = response.output.find(item => item.type === "message");
    const text = message?.type === "message" ? 
      (message.content?.[0]?.type === "output_text" ? message.content[0].text : "") : "";
    
    // Extract sources from annotations
    const sources: { title: string; uri: string }[] = [];
    
    if (message?.type === "message" && message.content?.[0]?.type === "output_text") {
      const annotations = message.content[0].annotations || [];
      annotations.forEach((annotation: any) => {
        if (annotation.type === "url_citation") {
          sources.push({
            title: annotation.title || "Source",
            uri: annotation.url
          });
        }
      });
    }

    // Extract web search sources if available
    const webSearchCall = response.output.find(item => item.type === "web_search_call");
    if (webSearchCall?.type === "web_search_call" && webSearchCall.action?.sources) {
      webSearchCall.action.sources.forEach((source: any) => {
        if (source.url) {
          sources.push({
            title: source.title || "Web Search Result",
            uri: source.url
          });
        }
      });
    }

    const extractSection = (header: string) => {
      const regex = new RegExp(`${header}[\\s\\S]*?(?=###|$)`, 'i');
      const match = text.match(regex);
      if (!match) return "";
      return match[0].replace(new RegExp(header, 'i'), "").trim();
    };

    const enemyIntel = extractSection("### ENEMY_INTEL");
    const march = extractSection("### RECOMMENDED_MARCH");
    const tactical = extractSection("### TACTICAL_SUMMARY");
    const dataExt = extractSection("### DATA_EXTRACTION");

    return {
      reportType: text.toLowerCase().includes('monster') ? 'Monster' : 'Attack',
      summary: (enemyIntel || tactical) ? `**Enemy Intel:**\n${enemyIntel || 'No intel detected.'}\n\n**Tactical Logic:**\n${tactical || 'Standard strategy applied.'}` : "Summary unavailable.",
      recommendations: march || "Tactical configuration failed to generate.",
      anonymizedData: dataExt,
      sources: Array.from(new Map(sources.map(s => [s.uri, s])).values()) // Remove duplicates
    };
  } catch (err: any) {
    console.error("Analysis error:", err);
    
    // Fallback to Chat Completions API if Responses API fails
    if (err.code === 'model_not_found' || err.message.includes('gpt-5')) {
      console.log("Falling back to Chat Completions API with gpt-4o");
      
      // Fallback implementation using Chat Completions
      try {
        const fallbackResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT
            },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                ...imageContents
              ]
            }
          ],
          max_tokens: 2000
        });

        const text = fallbackResponse.choices[0]?.message?.content || "";
        
        const extractSection = (header: string) => {
          const regex = new RegExp(`${header}[\\s\\S]*?(?=###|$)`, 'i');
          const match = text.match(regex);
          if (!match) return "";
          return match[0].replace(new RegExp(header, 'i'), "").trim();
        };

        const enemyIntel = extractSection("### ENEMY_INTEL");
        const march = extractSection("### RECOMMENDED_MARCH");
        const tactical = extractSection("### TACTICAL_SUMMARY");
        const dataExt = extractSection("### DATA_EXTRACTION");

        return {
          reportType: text.toLowerCase().includes('monster') ? 'Monster' : 'Attack',
          summary: (enemyIntel || tactical) ? `**Enemy Intel:**\n${enemyIntel || 'No intel detected.'}\n\n**Tactical Logic:**\n${tactical || 'Standard strategy applied.'}` : "Summary unavailable.",
          recommendations: march || "Tactical configuration failed to generate.",
          anonymizedData: dataExt,
          sources: [] // No sources in fallback
        };
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr.message || "Fallback analysis failed.");
      }
    }
    
    if (err.message?.includes('429')) {
      throw new Error("Tactical Overload: Quota exceeded. Please wait 60 seconds and try again.");
    } else if (err.message?.includes('401')) {
      throw new Error("Authentication Error: Invalid API key. Please check your OpenAI API key.");
    } else if (err.message?.includes('rate limit')) {
      throw new Error("Rate Limit Exceeded: Please wait a moment before trying again.");
    }
    throw new Error(err.message || "Uplink Error: Failed to analyze battle reports.");
  }
};

export async function* chatWithAIStream(
  history: ChatMessage[],
  message: string,
  profile: UserProfile,
  currentAnalysis: AnalysisResponse | null,
  attachments: string[] = []
) {
  const openai = new OpenAI({ 
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });
  
  const analysisContext = currentAnalysis 
    ? `CONTEXT: Report ${currentAnalysis.reportType}, Data: ${currentAnalysis.anonymizedData}`
    : "";

  const messages = [
    {
      role: "system" as const,
      content: SYSTEM_PROMPT + `\n\nUSER PROFILE: ${JSON.stringify(profile)}\n\n${analysisContext}`
    },
    ...history.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    })),
    {
      role: "user" as const,
      content: message
    }
  ];

  // Handle attachments if any
  if (attachments.length > 0) {
    const lastMessage = messages[messages.length - 1];
    if (typeof lastMessage.content === 'string') {
      lastMessage.content = [
        { type: "text", text: lastMessage.content },
        ...attachments.map(img => ({
          type: "image_url" as const,
          image_url: { url: img }
        }))
      ];
    }
  }

  // Try Responses API first for web search
  try {
    const response = await openai.responses.create({
      model: 'gpt-5',
      tools: [{ type: "web_search" }],
      tool_choice: "auto",
      input: messages.map(msg => ({
        type: "input_text",
        text: typeof msg.content === 'string' ? msg.content : 
              Array.isArray(msg.content) ? 
                msg.content.map(c => c.type === 'text' ? c.text : '[Image]').join(' ') : 
                JSON.stringify(msg.content)
      })),
      stream: true
    });

    // Note: Responses API streaming is different from Chat Completions
    // This is a simplified implementation
    for await (const chunk of response as any) {
      if (chunk.type === 'message.delta' && chunk.delta?.content?.[0]?.text) {
        yield chunk.delta.content[0].text;
      }
    }
  } catch (err) {
    console.log("Falling back to Chat Completions for streaming");
    
    // Fallback to regular Chat Completions
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })) as any,
      stream: true,
      temperature: 0.7
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      yield content;
    }
  }
}
