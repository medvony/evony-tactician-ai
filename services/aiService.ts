import { ocrService } from './ocrService';
import { battleHistoryService } from './battleHistoryService';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserProfile, AnalysisResponse } from '../types';
import { SYSTEM_PROMPT } from '../constants';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const groq = new Groq({ 
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export const analyzeReports = async (
  images: string[], 
  profile: UserProfile,
  ocrTexts?: string[],
  userEmail?: string
): Promise<AnalysisResponse> => {
  console.log('🎯 Starting battle report analysis...');
  
  try {
    // Validate API key
    if (!GROQ_API_KEY) {
      console.error('❌ Missing GROQ_API_KEY');
      throw new Error('Groq API key not configured. Please check Vercel environment variables.');
    }
    
    console.log('✅ API key validated');
    
    // Step 1: Use provided OCR texts or extract new ones
    let extractedText = '';
    
    if (ocrTexts && ocrTexts.length > 0) {
      console.log('✅ Using pre-extracted OCR text');
      extractedText = ocrTexts.join('\n\n--- NEXT REPORT ---\n\n');
    } else {
      // Fallback: extract text from images
      console.log('📸 Extracting text from images...');
      const ocrResults: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error(`Failed to load image ${i + 1}`));
            img.src = images[i];
          });
          
          const result = await ocrService.recognizeText(img);
          ocrResults.push(result.text);
          console.log(`✅ OCR completed for image ${i + 1}`);
        } catch (error) {
          console.error(`❌ OCR failed for image ${i + 1}:`, error);
          ocrResults.push('[OCR extraction failed for this image]');
        }
      }
      
      extractedText = ocrResults.join('\n\n--- NEXT REPORT ---\n\n');
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from any of the images.');
    }
    
    console.log('✅ Text extracted successfully');
    console.log('📝 Extracted text length:', extractedText.length);
    
    // Step 2: Prepare the analysis prompt
    console.log('📝 Preparing analysis prompt...');
    const prompt = createAnalysisPrompt(extractedText, profile);
    
    // Step 3: Use Groq (Llama 3.1) for analysis
    console.log('🤖 Analyzing with AI...');
    const analysis = await analyzeWithGroq(prompt);
    
    // Step 4: Parse and structure the response
    console.log('📊 Structuring response...');
    const result = parseAnalysisResponse(analysis, extractedText);
    
    // Step 5: Save battle to history (both personal and community)
    if (userEmail && ocrTexts) {
      try {
        await battleHistoryService.saveBattle(
          userEmail,
          result,
          ocrTexts,
          profile,
          true // shareAnalysis = true (helps community)
        );
        console.log('✅ Battle saved to personal history and shared with community');
      } catch (error) {
        console.error('Failed to save battle history:', error);
        // Continue even if save fails
      }
    }
    
    console.log('✅ Analysis complete!');
    return result;
    
  } catch (error: any) {
    console.error('❌ Analysis pipeline failed:', error);
    
    // Fallback to Gemini if Groq fails
    if (genAI && (error.message.includes('Groq') || error.message.includes('API key'))) {
      console.log('🔄 Falling back to Gemini...');
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
    console.log('📡 Sending request to Groq API...');
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an expert Evony TKR battle analyst.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('AI returned empty response');
    }
    
    console.log('✅ Received AI response');
    return content;
  } catch (error: any) {
    console.error('❌ Groq API error:', error);
    throw new Error(`Groq API error: ${error.message}`);
  }
}

async function analyzeWithGeminiFallback(images: string[], profile: UserProfile): Promise<AnalysisResponse> {
  if (!genAI) throw new Error('No fallback AI available');
  
  console.log('🤖 Using Gemini fallback...');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Analyze these Evony battle reports for player: ${JSON.stringify(profile)}`;
  
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

// Streaming chat function with collective learning
export async function* chatWithAIStream(
  history: any[], 
  message: string, 
  battleContext?: string,
  userEmail?: string
) {
  try {
    // Convert chat message format: 'model' -> 'assistant'
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: msg.text
    }));

    // Build smart context from personal + community battles
    let combinedContext = '';
    if (userEmail) {
      const keywords = message.toLowerCase().split(' ').filter(w => w.length > 3);
      combinedContext = await battleHistoryService.buildSmartContext(userEmail, keywords);
    }

    const systemPrompt = `You are an expert Evony: The King's Return (TKR) battle analyst with access to a collective knowledge base.

${battleContext ? `CURRENT BATTLE REPORT:\n${battleContext}\n\n` : ''}

${combinedContext}

Your capabilities:
- Analyze Evony TKR battle reports with tactical precision
- Draw insights from community battle analyses (anonymous AI summaries)
- Provide counter-strategies based on proven successful tactics
- Reference specific past battles when relevant
- Use Evony terminology (T14, T15, ground/ranged/mounted/siege, debuffs, general pairings, etc.)

IMPORTANT Guidelines:
- When referencing community knowledge, say: "Based on similar community battles..."
- When referencing user's personal history, say: "In your past battles..."
- Never ask for march size, troop tiers, or profile info - you already have it
- Be tactical, concise, and data-driven
- Focus on actionable counter-strategies

Remember: Community data is AI analysis only - no player identities or raw screenshots are shared.`;

    const stream = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: message }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1200,
    });
    
    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  } catch (error: any) {
    console.error('Chat stream error:', error);
    yield `❌ Error: ${error.message}`;
  }
                }
