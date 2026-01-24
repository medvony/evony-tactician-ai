import * as cheerio from 'cheerio';
import { cache } from './cache';

export interface ScrapedContent {
  title: string;
  content: string;
  tips: string[];
  url: string;
}

class WebScraper {
  private lastRequestTime = 0;
  private readonly delay = 2000; // 2 seconds
  private readonly cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
  private readonly userAgent = 'EvonyTacticianBot/1.0 (Strategy Research; +https://evony-tactician-ai.vercel.app)';

  async scrapeEvonyStrategy(url: string): Promise<ScrapedContent> {
    const cacheKey = `scrape:${url}`;
    const cached = cache.get(cacheKey, this.cacheDuration);
    if (cached) {
      console.log('✅ Cache hit:', url);
      return cached;
    }

    const allowed = await this.checkRobotsTxt(url);
    if (!allowed) {
      throw new Error('Scraping not allowed by robots.txt');
    }

    await this.enforceRateLimit();

    try {
      console.log('🔍 Scraping:', url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const result = this.extractContent(html, url);

      cache.set(cacheKey, result, this.cacheDuration);

      return result;
    } catch (error) {
      console.error('❌ Scraping error:', error);
      throw error;
    }
  }

  private extractContent(html: string, url: string): ScrapedContent {
    const $ = cheerio.load(html);

    $('script, style, nav, footer, aside, iframe').remove();

    const title = $('h1').first().text().trim() || 
                  $('title').text().trim() || 
                  'Evony Strategy';

    const contentSelectors = [
      'article',
      'main',
      '.post-content',
      '.entry-content',
      '.content',
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const text = $(selector).text().trim();
      if (text.length > 200) {
        content = text;
        break;
      }
    }

    if (!content) {
      content = $('body').text().trim();
    }

    content = content
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);

    const tips: string[] = [];
    $('ul li, ol li').each((_, elem) => {
      const tip = $(elem).text().trim();
      if (tip.length > 20 && tip.length < 500) {
        tips.push(tip);
      }
    });

    return {
      title,
      content,
      tips: tips.slice(0, 15),
      url,
    };
  }

  private async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      
      const cacheKey = `robots:${urlObj.host}`;
      const cached = cache.get(cacheKey, 60 * 60 * 1000);
      
      if (cached !== null) return cached;

      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!response.ok) {
        cache.set(cacheKey, true, 60 * 60 * 1000);
        return true;
      }

      const robotsTxt
