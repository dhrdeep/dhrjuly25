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
  // Major Electronic Music Publications
  {
    name: 'Resident Advisor',
    url: 'https://ra.co/feed.xml',
    category: 'Electronic Music News',
    active: true
  },
  {
    name: 'DJ Mag',
    url: 'https://djmag.com/rss.xml',
    category: 'DJ & Festival News',
    active: true
  },
  {
    name: 'Decoded Magazine',
    url: 'https://decodedmagazine.com/feed/',
    category: 'Underground Music',
    active: true
  },
  {
    name: 'Electronic Beats',
    url: 'https://www.electronicbeats.net/feed/',
    category: 'Electronic Culture',
    active: true
  },
  {
    name: 'Mixmag',
    url: 'https://mixmag.net/feed',
    category: 'Dance Music News',
    active: true
  },
  
  // Specialized House Music Sources
  {
    name: 'FreshNewTracks House',
    url: 'https://freshnewtracks.com/category/house-music/feed/',
    category: 'House Music',
    active: true
  },
  {
    name: '5 Magazine',
    url: 'https://5mag.net/category/news/feed/',
    category: 'Chicago House',
    active: true
  },
  {
    name: 'Deep House Amsterdam',
    url: 'https://deephouseamsterdam.com/feed/',
    category: 'Deep House',
    active: true
  },
  {
    name: 'Soundplate',
    url: 'https://soundplate.com/feed/',
    category: 'House & Electronic',
    active: true
  },
  {
    name: 'HAUS Mag',
    url: 'https://haushaus.org/feed/',
    category: 'House Music News',
    active: true
  },
  {
    name: 'Bolo House Music',
    url: 'https://bolohousemusic.com/feed/',
    category: 'South African House',
    active: true
  },
  {
    name: 'House Music Co',
    url: 'https://house-music.co/feed/',
    category: 'House Music News',
    active: true
  },
  {
    name: 'Spirit of House',
    url: 'https://spiritofhouse.com/?format=feed',
    category: 'Soulful House',
    active: true
  },
  {
    name: 'Knights of the Turntable',
    url: 'https://knightsoftheturntable.co.uk/feed/',
    category: 'House & Techno',
    active: true
  },
  {
    name: 'Acid Ted',
    url: 'https://acidted.wordpress.com/feed/',
    category: 'Dance Music Blog',
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
        .slice(0, 10) // Limit to 10 items per feed
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

    // Sort by publication date (newest first)
    return allItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
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