import OpenAI from "openai";
import { UserProfile, AnalysisResponse, ChatMessage } from "../types";
import { SYSTEM_PROMPT } from "../constants";

// IMPORTANT: Vercel injects environment variables differently
// For Vite projects, use process.env in vite.config.ts and import.meta.env in frontend
// But for server-side/API-like code, we need to handle both

// Try to get API key from different possible locations
const getApiKey = (): string => {
  // Method 1: Vite's import.meta.env (frontend build time)
  if (import.meta.env?.VITE_OPENAI_API_KEY) {
    return import.meta.env.VITE_OPENAI_API_KEY;
  }
  
  // Method 2: process.env (Node.js/backend, what Vercel injects)
  if (typeof process !== 'undefined' && process.env?.VITE_OPENAI_API_KEY) {
    return process.env.VITE_OPENAI_API_KEY;
  }
  
  // Method 3: Legacy/fallback
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  
  throw new Error("OpenAI API key not found in environment variables");
};

const OPENAI_API_KEY = getApiKey();

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

  const prompt = `
    Analyze these Evony TKR battle reports. Focus on extracting defender data and calculating the perfect counter-march.

    USER MILITARY SPECS:
    - March Size: ${profile.marchSize}
    - Embassy Capacity: ${profile.embassyCapacity}
    - Max Tiers: Ground T${profile.highestTiers.Ground}, Ranged T${profile.highestTiers.Ranged}, Mounted T${profile.highestTiers.Mounted}, Siege T${profile.highestTiers.Siege}

    You MUST output using these headers exactly:
    ### ENEMY_INTEL
    ### RECOMMENDED_MARCH
    ### TACTICAL_SUMMARY
    ### DATA_EXTRACTION
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageContents
          ]
        }
      ],
      max_tokens: 2000
    });

    const text = response.choices[0]?.message?.content || "";
    
    const sources: { title: string; uri: string }[] = [];

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
      sources
    };
  } catch (err: any) {
    if (err.message?.includes('429')) {
      throw new Error("Tactical Overload: Quota exceeded. Please wait 60 seconds and try again.");
    }
    throw new Error(err.message || "Uplink Error: Failed to fetch data from OpenAI.");
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

  // Handle attachments
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

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
    stream: true,
    max_tokens: 1000
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    yield content;
  }
}
