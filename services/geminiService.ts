import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile, AnalysisResponse } from "../types";
import { SYSTEM_PROMPT } from "../constants";

export const analyzeReports = async (
  images: string[], 
  profile: UserProfile
): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  
  const imageParts = images.map(img => {
    const [header, data] = img.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    return {
      inlineData: {
        mimeType,
        data
      }
    };
  });

  const prompt = `
    Analyze these Evony TKR battle reports. Focus on extracting defender data and calculating the perfect counter-march.
    Use your research tool to verify current game mechanics if the report contains unusual buffs or items.

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

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...imageParts, { text: prompt }] },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ googleSearch: {} }],
    }
  });

  const text = response.text || "";
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => ({
      title: chunk.web?.title || "Tactical Reference",
      uri: chunk.web?.uri || "#"
    }))
    .filter((s: any) => s.uri !== "#") || [];

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

  if (!enemyIntel && !march && !text) {
    throw new Error("The AI failed to generate a structured response. Please try again.");
  }

  return {
    reportType: text.toLowerCase().includes('monster') ? 'Monster' : 'Attack',
    summary: enemyIntel || tactical ? `**Enemy Intel:**\n${enemyIntel || 'No intel detected.'}\n\n**Tactical Logic:**\n${tactical || 'Standard strategy applied.'}` : "Summary unavailable.",
    recommendations: march || "Tactical configuration failed to generate.",
    anonymizedData: dataExt,
    sources
  };
};

export async function* chatWithAIStream(
  history: { role: 'user' | 'model', text: string }[],
  message: string,
  profile: UserProfile,
  currentAnalysis: AnalysisResponse | null,
  attachments: string[] = []
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview'; 

  const analysisContext = currentAnalysis 
    ? `CONTEXT: Report ${currentAnalysis.reportType}, Data: ${currentAnalysis.anonymizedData}`
    : "";

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: SYSTEM_PROMPT + `\n\nUSER PROFILE: ${JSON.stringify(profile)}\n\n${analysisContext}`,
      tools: [{ googleSearch: {} }]
    }
  });

  const imageParts = attachments.map(img => {
    const [header, data] = img.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    return {
      inlineData: { mimeType, data }
    };
  });

  const stream = await chat.sendMessageStream({ 
    message: [{ text: message }, ...imageParts]
  });

  for await (const chunk of stream) {
    const c = chunk as GenerateContentResponse;
    yield c.text || "";
  }
}
