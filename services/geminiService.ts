import OpenAI from "openai";
import { UserProfile, AnalysisResponse, ChatMessage } from "../types";
import { SYSTEM_PROMPT } from "../constants";

// Simple API key access
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || "";

export const analyzeReports = async (
  images: string[], 
  profile: UserProfile
): Promise<AnalysisResponse> => {
  try {
    const openai = new OpenAI({ 
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: "Analyze this battle report"
        }
      ]
    });

    const text = response.choices[0]?.message?.content || "No response";
    
    return {
      reportType: "Attack",
      summary: text.substring(0, 200),
      recommendations: "Test recommendations",
      anonymizedData: "Test data",
      sources: []
    };
  } catch (error: any) {
    console.error("Analysis error:", error);
    throw new Error("Failed to analyze: " + error.message);
  }
};

export async function* chatWithAIStream(
  history: ChatMessage[],
  message: string,
  profile: UserProfile,
  currentAnalysis: AnalysisResponse | null
) {
  yield "Test streaming response";
}
