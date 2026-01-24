import { scraper, ScrapedContent } from './scraper';
import { aiService } from './deepseekservices'; // or './geminiservices' if you kept the name

const TRUSTED_SOURCES = [
  'evonyguidewiki.com',
  'gamerempire.net',
  'mrguider.org',
  'pockettactics.com',
];

export async function searchStrategy(query: string, sourceUrl?: string) {
  try {
    let scrapedContent: ScrapedContent | undefined;

    if (sourceUrl) {
      const url = new URL(sourceUrl);
      const isTrusted = TRUSTED_SOURCES.some(d => url.hostname.includes(d));
      if (!isTrusted) throw new Error('Untrusted source');

      try {
        scrapedContent = await scraper.scrapeEvonyStrategy(sourceUrl);
      } catch (error) {
        console.error('Scraping failed:', error);
      }
    }

    const response = await aiService.analyzeStrategy(query, scrapedContent);
    return { response, source: scrapedContent };
  } catch (error) {
    throw error;
  }
}
