import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

export interface CrawledItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  category?: string;
  source: string;
  imageUrl?: string;
  type: 'news' | 'event' | 'release';
}

interface CrawlTarget {
  name: string;
  url: string;
  type: 'news' | 'event' | 'release';
  selector?: string;
  active: boolean;
}

const CRAWL_TARGETS: CrawlTarget[] = [
  // Music News Sites (HTML scraping)
  {
    name: 'Beatport News',
    url: 'https://www.beatport.com/news',
    type: 'news',
    active: true
  },
  {
    name: 'Traxsource News',
    url: 'https://www.traxsource.com/news',
    type: 'news', 
    active: true
  },
  {
    name: 'Juno Download News',
    url: 'https://www.junodownload.com/news/',
    type: 'news',
    active: true
  },
  
  // Event Discovery
  {
    name: 'Eventbrite Electronic',
    url: 'https://www.eventbrite.com/d/online/electronic-music/',
    type: 'event',
    active: true
  },
  {
    name: 'RA Events',
    url: 'https://ra.co/events',
    type: 'event',
    active: true
  },
  
  // Music Release Platforms
  {
    name: 'Bandcamp Electronic',
    url: 'https://bandcamp.com/discover/electronic',
    type: 'release',
    active: true
  }
];

class WebCrawlerService {
  private cache: Map<string, { items: CrawledItem[], lastFetch: Date }>;
  private cacheDuration = 45 * 60 * 1000; // 45 minutes
  private parser: XMLParser;

  constructor() {
    this.cache = new Map();
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
  }

  private generateId(title: string, link: string): string {
    return Buffer.from(`${title}-${link}`).toString('base64').slice(0, 16);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  private async crawlBeatportNews(): Promise<CrawledItem[]> {
    try {
      const response = await fetch('https://www.beatport.com/news', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      const items: CrawledItem[] = [];
      
      // Simple pattern matching for Beatport news articles
      const articlePattern = /<article[^>]*>[\s\S]*?<\/article>/g;
      const titlePattern = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/;
      const linkPattern = /href="([^"]*beatport\.com[^"]*)"/;
      
      let match;
      let count = 0;
      while ((match = articlePattern.exec(html)) !== null && count < 3) {
        const articleHtml = match[0];
        const titleMatch = titlePattern.exec(articleHtml);
        const linkMatch = linkPattern.exec(articleHtml);
        
        if (titleMatch && linkMatch) {
          const title = this.stripHtml(titleMatch[1]);
          const link = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.beatport.com${linkMatch[1]}`;
          
          if (title && link) {
            items.push({
              id: this.generateId(title, link),
              title,
              description: `Latest news from Beatport`,
              link,
              pubDate: new Date(),
              source: 'Beatport News',
              type: 'news',
              category: 'Music Industry'
            });
            count++;
          }
        }
      }
      
      return items;
    } catch (error) {
      console.error('❌ Error crawling Beatport:', error);
      return [];
    }
  }

  private async crawlTraxsourceNews(): Promise<CrawledItem[]> {
    try {
      const response = await fetch('https://www.traxsource.com/news', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      const items: CrawledItem[] = [];
      
      // Pattern matching for Traxsource news
      const newsPattern = /<div[^>]*class="[^"]*news[^"]*"[^>]*>[\s\S]*?<\/div>/g;
      const titlePattern = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/;
      const linkPattern = /href="([^"]*traxsource\.com[^"]*)"/;
      
      let match;
      let count = 0;
      while ((match = newsPattern.exec(html)) !== null && count < 8) {
        const newsHtml = match[0];
        const titleMatch = titlePattern.exec(newsHtml);
        const linkMatch = linkPattern.exec(newsHtml);
        
        if (titleMatch && linkMatch) {
          const title = this.stripHtml(titleMatch[1]);
          const link = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.traxsource.com${linkMatch[1]}`;
          
          if (title && link) {
            items.push({
              id: this.generateId(title, link),
              title,
              description: `House and soulful music news from Traxsource`,
              link,
              pubDate: new Date(),
              source: 'Traxsource News',
              type: 'news',
              category: 'House Music'
            });
            count++;
          }
        }
      }
      
      return items;
    } catch (error) {
      console.error('❌ Error crawling Traxsource:', error);
      return [];
    }
  }

  private async crawlMusicNews(): Promise<CrawledItem[]> {
    const allItems: CrawledItem[] = [];
    
    // Crawl Beatport
    console.log('🕷️ Crawling Beatport news...');
    const beatportItems = await this.crawlBeatportNews();
    allItems.push(...beatportItems);
    
    // Crawl Traxsource  
    console.log('🕷️ Crawling Traxsource news...');
    const traxsourceItems = await this.crawlTraxsourceNews();
    allItems.push(...traxsourceItems);
    
    return allItems;
  }

  async getAllCrawledItems(): Promise<CrawledItem[]> {
    const cacheKey = 'all_crawled';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.lastFetch.getTime() < this.cacheDuration) {
      console.log('📋 Using cached crawled data');
      return cached.items;
    }
    
    try {
      const items = await this.crawlMusicNews();
      
      // Cache the results
      this.cache.set(cacheKey, {
        items,
        lastFetch: new Date()
      });
      
      console.log(`✅ Crawled ${items.length} items from web sources`);
      return items;
      
    } catch (error) {
      console.error('❌ Error in web crawling:', error);
      
      // Return cached data if available, even if expired
      const cached = this.cache.get(cacheKey);
      return cached ? cached.items : [];
    }
  }

  async getNewsByType(type: 'news' | 'event' | 'release', limit: number = 10): Promise<CrawledItem[]> {
    const allItems = await this.getAllCrawledItems();
    return allItems
      .filter(item => item.type === type)
      .slice(0, limit);
  }

  getActiveSources(): string[] {
    return CRAWL_TARGETS
      .filter(target => target.active)
      .map(target => target.name);
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Web crawler cache cleared');
  }
}

export const webCrawlerService = new WebCrawlerService();