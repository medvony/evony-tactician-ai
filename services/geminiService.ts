// services/deepseekservices.tsx
import { ScrapedContent } from './scraper';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class DeepSeekService {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1';

  constructor() {
    // Use process.env just like your OpenAI setup
    this.apiKey = process.env.VITE_DEEPSEEK_API_KEY || "";
    
    if (!this.apiKey) {
      console.error('VITE_DEEPSEEK_API_KEY not found in environment variables');
    }
  }

  async chat(
    messages: Message[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const {
      model = 'deepseek-chat',
      temperature = 0.7,
      maxTokens = 2000,
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
      }

      const data: DeepSeekResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from DeepSeek API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('❌ DeepSeek API error:', error);
      throw error;
    }
  }

  async analyzeStrategy(
    query: string,
    scrapedContent?: ScrapedContent
  ): Promise<string> {
    const systemPrompt = `You are an expert Evony: The King's Return strategy advisor. Provide detailed, actionable advice on:

- Troop compositions and counter strategies
- Building priorities and resource management
- PvP and PvE tactics
- Event optimization
- Alliance warfare
- General and equipment recommendations

Be specific, practical, and use bullet points for clarity.`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (scrapedContent) {
      const context = `Reference from ${scrapedContent.title}:

${scrapedContent.content.substring(0, 2000)}

${scrapedContent.tips.length > 0 ? `Key Tips:\n${scrapedContent.tips.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join('\n')}` : ''}

Source: ${scrapedContent.url}

---

Question: ${query}`;

      messages.push({ role: 'user', content: context });
    } else {
      messages.push({ role: 'user', content: query });
    }

    return this.chat(messages, {
      temperature: 0.7,
      maxTokens: 2500,
    });
  }

  async analyzeBattleReport(
    reportData: string,
    context?: string
  ): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are an Evony battle analyst. Analyze battle reports and provide strategic insights.',
      },
      {
        role: 'user',
        content: `Battle Report:
${reportData}

${context ? `Additional Context: ${context}` : ''}

Please analyze this battle and provide:
1. What went right/wrong
2. Suggested troop composition improvements
3. General and equipment recommendations
4. Strategy adjustments for next time`,
      },
    ];

    return this.chat(messages);
  }
}

export const deepseekService = new DeepSeekService();
