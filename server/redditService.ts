import fetch from 'node-fetch';

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  author: string;
  score: number;
  numComments: number;
  subreddit: string;
  created: Date;
  selftext: string;
  permalink: string;
  thumbnail?: string;
  preview?: string;
}

const REDDIT_FEEDS = [
  'deephouse',
  'House',
  'electronicmusic',
  'EDM',
  'DJs',
  'WeAreTheMusicMakers',
  'trapproduction',
  'edmproduction',
  'techno',
  'underground',
  'festivals',
  'aves'
];

class RedditService {
  private cache: Map<string, { posts: RedditPost[], lastFetch: Date }>;
  private cacheDuration = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.cache = new Map();
  }

  private extractImageUrl(post: any): string | undefined {
    // Try preview images
    if (post.preview?.images?.[0]?.source?.url) {
      return post.preview.images[0].source.url.replace(/&amp;/g, '&');
    }
    
    // Check thumbnail
    if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' && post.thumbnail.startsWith('http')) {
      return post.thumbnail;
    }
    
    return undefined;
  }

  private parseRedditPost(postData: any): RedditPost {
    const data = postData.data;
    return {
      id: data.id,
      title: data.title,
      url: data.url,
      author: data.author,
      score: data.score || 0,
      numComments: data.num_comments || 0,
      subreddit: data.subreddit,
      created: new Date(data.created_utc * 1000),
      selftext: data.selftext || '',
      permalink: `https://reddit.com${data.permalink}`,
      thumbnail: this.extractImageUrl(data),
      preview: this.extractImageUrl(data)
    };
  }

  async fetchSubredditPosts(subreddit: string, limit: number = 10): Promise<RedditPost[]> {
    try {
      console.log(`📡 Fetching r/${subreddit} posts`);
      
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`, {
        headers: {
          'User-Agent': 'Deep House Radio Bot/1.0'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const posts = data.data?.children || [];
      
      const redditPosts = posts
        .map(post => this.parseRedditPost(post))
        .filter(post => {
          // Filter for music-related content
          const title = post.title.toLowerCase();
          const text = post.selftext.toLowerCase();
          const content = title + ' ' + text;
          
          return content.includes('house') || 
                 content.includes('electronic') || 
                 content.includes('techno') || 
                 content.includes('deep') || 
                 content.includes('music') || 
                 content.includes('dj') || 
                 content.includes('mix') || 
                 content.includes('track') || 
                 content.includes('festival') || 
                 content.includes('beat') || 
                 post.score >= 10; // Include popular posts
        });

      console.log(`✅ Fetched ${redditPosts.length} relevant posts from r/${subreddit}`);
      return redditPosts;
    } catch (error) {
      console.error(`❌ Error fetching r/${subreddit}:`, error.message);
      return [];
    }
  }

  async getAllPosts(limit: number = 20): Promise<RedditPost[]> {
    const allPosts: RedditPost[] = [];
    
    for (const subreddit of REDDIT_FEEDS) {
      const cacheKey = `reddit_${subreddit}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.lastFetch.getTime()) < this.cacheDuration) {
        console.log(`📋 Using cached data for r/${subreddit}`);
        allPosts.push(...cached.posts);
        continue;
      }

      const posts = await this.fetchSubredditPosts(subreddit, 5); // 5 per subreddit
      if (posts.length > 0) {
        this.cache.set(cacheKey, { posts, lastFetch: new Date() });
        allPosts.push(...posts);
      }
      
      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Sort by score and creation time
    return allPosts
      .sort((a, b) => (b.score + (b.created.getTime() / 1000000)) - (a.score + (a.created.getTime() / 1000000)))
      .slice(0, limit);
  }

  async getTopPosts(subreddit?: string, limit: number = 10): Promise<RedditPost[]> {
    if (subreddit) {
      const posts = await this.fetchSubredditPosts(subreddit, limit);
      return posts.sort((a, b) => b.score - a.score);
    }
    
    const allPosts = await this.getAllPosts(limit * 2);
    return allPosts.slice(0, limit);
  }

  getAvailableSubreddits(): string[] {
    return REDDIT_FEEDS;
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Reddit cache cleared');
  }
}

export const redditService = new RedditService();