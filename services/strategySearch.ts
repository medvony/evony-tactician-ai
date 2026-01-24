import { scraper, ScrapedContent } from './scraper';
import { deepseek } from './deepseek';

// Trusted Evony strategy sources
const TRUSTED_SOURCES = [
  'evonyguidewiki.com',
  'gamerempire.net',
  'mrguider.org',
  'pockettactics.com',
  'levelskip.com',
];

export interface StrategySearchOptions {
  query: string;
  searchWeb?: boolean;
  sourceUrl?: string;
}

export interface StrategySearchResult {
  response: string;
  source?: {
    title: string;
    url: string;
  } | null;
  error?: string;
}

export async function searchStrategy(
  options: StrategySearchOptions
): Promise<StrategySearchResult> {
  const { query, searchWeb, sourceUrl } = options;

  try {
    let scrapedContent: ScrapedContent | undefined;

    if (searchWeb && sourceUrl) {
      // Validate trusted source
      const url = new URL(sourceUrl);
      const isTrusted = TRUSTED_SOURCES.some(domain => 
        url.hostname.includes(domain)
      );

      if (!isTrusted) {
        return {
          response: '',
          error: 'URL is not from a trusted Evony strategy source',
        };
      }

      try {
        scrapedContent = await scraper.scrapeEvonyStrategy(sourceUrl);
      } catch (error) {
        console.error('Scraping failed, continuing without web data:', error);
      }
    }

    const response = await deepseek.analyzeStrategy(query, scrapedContent);

    return {
      response,
      source: scrapedContent ? {
        title: scrapedContent.title,
        url: scrapedContent.url,
      } : null,
    };
  } catch (error) {
    console.error('Strategy search error:', error);
    return {
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function isTrustedSource(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return TRUSTED_SOURCES.some(domain => 
      urlObj.hostname.includes(domain)
    );
  } catch {
    return false;
  }
}
