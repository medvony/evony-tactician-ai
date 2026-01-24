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
  private readonly delay = 2000;
  private readonly cacheDuration = 24 * 60 * 60 * 1000;
  private readonly userAgent = 'EvonyTacticianBot/1.0';

  async scrapeEvonyStrategy(url: string): Promise<ScrapedContent> {
    const cacheKey = `scrape:${url}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const allowed = await this.checkRobotsTxt(url);
    if (!allowed) throw new Error('Blocked by robots.txt');

    await this.enforceRateLimit();

    const response = await fetch(url, {
      headers: { 'User-Agent': this.userAgent },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const result = this.extractContent(html, url);
    cache.set(cacheKey, result);
    return result;
  }

  private extractContent(html: string, url: string): ScrapedContent {
    const $ = cheerio.load(html);
    $('script, style, nav, footer').remove();

    const title = $('h1').first().text().trim() || $('title').text().trim() || 'Evony Strategy';
    let content = $('article, main, .content').first().text().trim() || $('body').text().trim();
    content = content.replace(/\s+/g, ' ').substring(0, 5000);

    const tips: string[] = [];
    $('ul li, ol li').each((_, elem) => {
      const tip = $(elem).text().trim();
      if (tip.length > 20 && tip.length < 500) tips.push(tip);
    });

    return { title, content, tips: tips.slice(0, 15), url };
  }

  private async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      const response = await fetch(robotsUrl);
      if (!response.ok) return true;
      const robotsTxt = await response.text();
      return !robotsTxt.toLowerCase().includes('disallow: /');
    } catch {
      return true;
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const wait = this.delay - (now - this.lastRequestTime);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this.lastRequestTime = Date.now();
  }
}

export const scraper = new WebScraper();
