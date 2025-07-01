import { XMLParser } from 'fast-xml-parser';
import fetch from 'node-fetch';

export interface RSSItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  category?: string;
  source: string;
  imageUrl?: string;
}

export interface RSSFeed {
  name: string;
  url: string;
  category: string;
  active: boolean;
}

const RSS_FEEDS: RSSFeed[] = [
  // Working Electronic Music Publications
  {
    name: 'Mixmag',
    url: 'https://www.mixmag.net/rss.xml',
    category: 'Dance Music News',
    active: true
  },
  {
    name: 'DJ Mag',
    url: 'https://djmag.com/content/rss.xml',
    category: 'DJ & Festival News',
    active: true
  },
  {
    name: 'Resident Advisor News',
    url: 'https://ra.co/news.xml',
    category: 'Electronic Music News',
    active: true
  },
  {
    name: 'Attack Magazine',
    url: 'https://attackmagazine.com/feed',
    category: 'Electronic Music Production',
    active: true
  },
  {
    name: 'Dancing Astronaut',
    url: 'https://dancingastronaut.com/feed/',
    category: 'Electronic Music News',
    active: true
  },
  
  // Additional Electronic Music Sources
  {
    name: 'Your EDM',
    url: 'https://www.youredm.com/feed/',
    category: 'Electronic Dance Music',
    active: true
  },
  {
    name: 'We Rave You',
    url: 'https://weraveyou.com/feed/',
    category: 'Electronic Music Events',
    active: true
  },
  {
    name: 'Electronic Groove',
    url: 'https://electronicgroove.com/feed/',
    category: 'Techno & House',
    active: true
  },
  {
    name: 'DJ Times',
    url: 'https://djtimes.com/feed/',
    category: 'DJ Industry News',
    active: true
  },
  {
    name: 'Magnetic Magazine',
    url: 'https://magneticmag.com/feed/',
    category: 'Electronic Music Culture',
    active: true
  },
  {
    name: 'Deep House Blog',
    url: 'https://deephouseblog.com/feed/',
    category: 'Deep House',
    active: true
  }
];

class RSSService {
  private parser: XMLParser;
  private cache: Map<string, { items: RSSItem[], lastFetch: Date }>;
  private cacheDuration = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    this.cache = new Map();
  }

  private extractImageUrl(item: any): string | undefined {
    // Try different common RSS image fields
    if (item['media:thumbnail']?.['@_url']) {
      return item['media:thumbnail']['@_url'];
    }
    if (item['media:content']?.['@_url']) {
      return item['media:content']['@_url'];
    }
    if (item.enclosure?.['@_type']?.includes('image')) {
      return item.enclosure['@_url'];
    }
    
    // Try to extract from description
    const description = item.description || item['content:encoded'] || '';
    const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) {
      return imgMatch[1];
    }
    
    return undefined;
  }

  private generateId(title: string, link: string): string {
    return Buffer.from(`${title}-${link}`).toString('base64').slice(0, 16);
  }

  private parseRSSItem(item: any, sourceName: string): RSSItem {
    const title = item.title || 'Untitled';
    const link = item.link || item.guid || '';
    const description = this.stripHtml(item.description || item['content:encoded'] || '');
    const pubDate = new Date(item.pubDate || item.published || Date.now());
    const category = item.category || undefined;
    const imageUrl = this.extractImageUrl(item);

    return {
      id: this.generateId(title, link),
      title,
      description: description.slice(0, 300) + (description.length > 300 ? '...' : ''),
      link,
      pubDate,
      category,
      source: sourceName,
      imageUrl
    };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  }

  async fetchFeed(feed: RSSFeed): Promise<RSSItem[]> {
    try {
      console.log(`📡 Fetching RSS feed: ${feed.name}`);
      
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Deep House Radio RSS Reader/1.0'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlData = await response.text();
      const parsed = this.parser.parse(xmlData);
      
      let items = [];
      
      // Handle different RSS structures
      if (parsed.rss?.channel?.item) {
        items = Array.isArray(parsed.rss.channel.item) 
          ? parsed.rss.channel.item 
          : [parsed.rss.channel.item];
      } else if (parsed.feed?.entry) {
        items = Array.isArray(parsed.feed.entry) 
          ? parsed.feed.entry 
          : [parsed.feed.entry];
      }

      const rssItems = items
        .sort((a, b) => {
          const dateA = new Date(a.pubDate || a.published || 0);
          const dateB = new Date(b.pubDate || b.published || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 3) // Take only 3 newest items per feed
        .map(item => this.parseRSSItem(item, feed.name))
        .filter(item => item.title && item.link);

      console.log(`✅ Fetched ${rssItems.length} items from ${feed.name}`);
      return rssItems;
    } catch (error) {
      console.error(`❌ Error fetching ${feed.name}:`, error.message);
      return [];
    }
  }

  async getAllFeeds(): Promise<RSSItem[]> {
    const allItems: RSSItem[] = [];
    
    for (const feed of RSS_FEEDS.filter(f => f.active)) {
      const cacheKey = feed.url;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.lastFetch.getTime()) < this.cacheDuration) {
        console.log(`📋 Using cached data for ${feed.name}`);
        allItems.push(...cached.items);
        continue;
      }

      const items = await this.fetchFeed(feed);
      if (items.length > 0) {
        this.cache.set(cacheKey, { items, lastFetch: new Date() });
        allItems.push(...items);
      }
    }

    // Remove duplicates based on title and link
    const uniqueItems = allItems.reduce((acc, current) => {
      const isDuplicate = acc.some(item => 
        item.title === current.title || item.link === current.link
      );
      if (!isDuplicate) {
        acc.push(current);
      }
      return acc;
    }, [] as RSSItem[]);

    // Sort by publication date (newest first) and limit to 100 items
    return uniqueItems
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, 100);
  }

  async getLatestNews(limit: number = 20): Promise<RSSItem[]> {
    const allItems = await this.getAllFeeds();
    return allItems.slice(0, limit);
  }

  async getNewsByCategory(category: string, limit: number = 10): Promise<RSSItem[]> {
    const allItems = await this.getAllFeeds();
    return allItems
      .filter(item => item.source.toLowerCase().includes(category.toLowerCase()) || 
                     item.category?.toLowerCase().includes(category.toLowerCase()))
      .slice(0, limit);
  }

  getAvailableFeeds(): RSSFeed[] {
    return RSS_FEEDS;
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ RSS cache cleared');
  }
}

export const rssService = new RSSService();