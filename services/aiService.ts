import { processBattleReports } from './ocrService';
import Groq from 'groq-sdk';
import { UserProfile, AnalysisResponse } from '../types';
import { SYSTEM_PROMPT } from '../constants';

// Configuration
const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Backup: Google Gemini (if needed)
import { GoogleGenerativeAI } from '@google/generative-ai';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export const analyzeReports = async (
  images: string[], 
  profile: UserProfile
): Promise<AnalysisResponse> => {
  console.log('Starting battle report analysis...');
  
  try {
    // Step 1: Extract text from images using OCR
    const extractedText = await processBattleReports(images);
    
    // Step 2: Prepare the analysis prompt
    const prompt = createAnalysisPrompt(extractedText, profile);
    
    // Step 3: Use Groq (Llama 3.1) for analysis
    const analysis = await analyzeWithGroq(prompt);
    
    // Step 4: Parse and structure the response
    return parseAnalysisResponse(analysis, extractedText);
    
  } catch (error: any) {
    console.error('Analysis pipeline failed:', error);
    
    // Fallback to Gemini if Groq fails
    if (genAI && (error.message.includes('Groq') || error.message.includes('Llama'))) {
      console.log('Falling back to Gemini...');
      return await analyzeWithGeminiFallback(images, profile);
    }
    
    throw new Error(`Tactical Error: ${error.message}`);
  }
};

// Helper Functions
function createAnalysisPrompt(extractedText: string, profile: UserProfile): string {
  return `
${SYSTEM_PROMPT}

EXTRACTED BATTLE REPORT DATA:
${extractedText}

PLAYER PROFILE:
- March Size: ${profile.marchSize}
- Embassy: ${profile.embassyCapacity}
- Max Tiers: Ground T${profile.highestTiers?.Ground}, Ranged T${profile.highestTiers?.Ranged}, Mounted T${profile.highestTiers?.Mounted}, Siege T${profile.highestTiers?.Siege}

ANALYSIS REQUEST:
1. Analyze the extracted battle report text
2. Identify troop compositions, losses, and results
3. Provide counter-strategy recommendations
4. Estimate enemy strength and weaknesses

FORMAT YOUR RESPONSE WITH THESE EXACT HEADERS:
### ENEMY_INTEL
### RECOMMENDED_MARCH
### TACTICAL_SUMMARY
### DATA_EXTRACTION
`;
}

async function analyzeWithGroq(prompt: string): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an expert Evony TKR battle analyst.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    
    return response.choices[0]?.message?.content || 'No analysis generated.';
  } catch (error: any) {
    console.error('Groq API error:', error);
    throw new Error(`Groq API error: ${error.message}`);
  }
}

async function analyzeWithGeminiFallback(images: string[], profile: UserProfile): Promise<AnalysisResponse> {
  if (!genAI) throw new Error('No fallback AI available');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Analyze these Evony battle reports for player: ${JSON.stringify(profile)}`;
  
  // Gemini can handle images directly
  const imageParts = images.map(img => ({
    inlineData: {
      data: img.split(',')[1],
      mimeType: img.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png'
    }
  }));
  
  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  
  return {
    reportType: 'Analysis',
    summary: text.substring(0, 500),
    recommendations: 'See summary for details',
    anonymizedData: text,
    sources: []
  };
}

function parseAnalysisResponse(text: string, originalText: string): AnalysisResponse {
  const extractSection = (header: string) => {
    const regex = new RegExp(`${header}[\\s\\S]*?(?=###|$)`, 'i');
    const match = text.match(regex);
    return match ? match[0].replace(header, '').trim() : '';
  };
  
  return {
    reportType: text.toLowerCase().includes('monster') ? 'Monster' : 'PvP',
    summary: extractSection('### ENEMY_INTEL') || 'No intel extracted.',
    recommendations: extractSection('### RECOMMENDED_MARCH') || 'No specific recommendations.',
    anonymizedData: originalText.substring(0, 1000),
    sources: []
  };
}

// Streaming chat function (optional)
export async function* chatWithAIStream(history: any[], message: string) {
  const stream = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [...history, { role: 'user', content: message }],
    stream: true,
  });
  
  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || '';
  }
}
