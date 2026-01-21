import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile, AnalysisResponse } from "../types";
import { SYSTEM_PROMPT } from "../constants";

export const analyzeReports = async (
  images: string[], 
  profile: UserProfile
): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  
  const imageParts = images.map(img => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: img.split(',')[1]
    }
  }));

  const prompt = `
    Analyze these Evony TKR battle reports. Focus on extracting defender data and calculating the perfect counter-march.

    USER MILITARY SPECS:
    - March Size: ${profile.marchSize}
    - Embassy Capacity: ${profile.embassyCapacity}
    - Max Tiers: Ground T${profile.highestTiers.Ground}, Ranged T${profile.highestTiers.Ranged}, Mounted T${profile.highestTiers.Mounted}, Siege T${profile.highestTiers.Siege}

    You MUST output using these headers:
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
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  const text = response.text || "Failed to analyze.";
  
  const extractSection = (header: string, nextHeader?: string) => {
    const start = text.indexOf(header);
    if (start === -1) return "";
    const end = nextHeader ? text.indexOf(nextHeader) : text.length;
    return text.substring(start + header.length, end).trim();
  };

  const enemyIntel = extractSection("### ENEMY_INTEL", "### RECOMMENDED_MARCH");
  const march = extractSection("### RECOMMENDED_MARCH", "### TACTICAL_SUMMARY");
  const tactical = extractSection("### TACTICAL_SUMMARY", "### DATA_EXTRACTION");
  const dataExt = extractSection("### DATA_EXTRACTION");

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || "Reference",
    uri: chunk.web?.uri || ""
  })).filter((s: any) => s.uri) || [];

  return {
    reportType: text.toLowerCase().includes('monster') ? 'Monster' : 'Attack',
    summary: `**Enemy Intel:**\n${enemyIntel}\n\n**Tactical Logic:**\n${tactical}`,
    recommendations: march || "Analysis failed.",
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

  const imageParts = attachments.map(img => ({
    inlineData: { mimeType: "image/jpeg", data: img.split(',')[1] }
  }));

  const stream = await chat.sendMessageStream({ 
    message: [{ text: message }, ...imageParts]
  });

  for await (const chunk of stream) {
    const c = chunk as GenerateContentResponse;
    yield c.text || "";
  }
}
