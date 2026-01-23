import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile, AnalysisResponse, ChatMessage } from "../types";
import { SYSTEM_PROMPT } from "../constants";

export const analyzeReports = async (images: string[], profile: UserProfile): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imageParts = images.map(img => {
    const [header, data] = img.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    return { inlineData: { mimeType, data } };
  });

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
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [...imageParts, { text: prompt }] },
      config: { systemInstruction: SYSTEM_PROMPT, tools: [{ googleSearch: {} }] }
    });

    const text = response.text || "";
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = rawChunks.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null).filter(Boolean);

    const extractSection = (header: string) => {
      const regex = new RegExp(`${header}[\\s\\S]*?(?=###|$)`, 'i');
      const match = text.match(regex);
      return match ? match[0].replace(new RegExp(header, 'i'), "").trim() : "";
    };

    return {
      reportType: text.toLowerCase().includes('monster') ? 'Monster' : 'Attack',
      summary: extractSection("### ENEMY_INTEL") || extractSection("### TACTICAL_SUMMARY"),
      recommendations: extractSection("### RECOMMENDED_MARCH"),
      anonymizedData: extractSection("### DATA_EXTRACTION"),
      sources
    };
  } catch (err: any) { throw new Error(err.message); }
};

export async function* chatWithAIStream(history: ChatMessage[], message: string, profile: UserProfile, currentAnalysis: AnalysisResponse | null) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction: SYSTEM_PROMPT, tools: [{ googleSearch: {} }] }
  });
  const stream = await chat.sendMessageStream({ message });
  for await (const chunk of stream) yield (chunk as GenerateContentResponse).text || "";
}
