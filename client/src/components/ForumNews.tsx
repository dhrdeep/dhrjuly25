import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, ExternalLink, RefreshCw, Globe, Rss } from 'lucide-react';

interface RSSItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  category?: string;
  source: string;
  imageUrl?: string;
}

interface CrawledItem {
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

export default function ForumNews() {
  const [activeTab, setActiveTab] = useState('rss');

  // RSS Feeds Query
  const { data: rssItems = [], isLoading: rssLoading, refetch: refetchRSS } = useQuery({
    queryKey: ['/api/rss/latest'],
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Web Crawler Query
  const { data: crawledItems = [], isLoading: crawlerLoading, refetch: refetchCrawler } = useQuery({
    queryKey: ['/api/crawler/all'],
    staleTime: 20 * 60 * 1000, // 20 minutes
  });

  const refreshAll = async () => {
    await Promise.all([refetchRSS(), refetchCrawler()]);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const NewsCard = ({ item }: { item: RSSItem | CrawledItem }) => (
    <div className="mb-4 hover:shadow-lg transition-shadow bg-gray-900/50 border border-orange-400/30 rounded-lg">
      <div className="p-4">
        <div className="flex gap-4">
          {item.imageUrl && (
            <img 
              src={item.imageUrl} 
              alt={item.title}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-white hover:text-orange-400 transition-colors leading-tight">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                  {item.title}
                </a>
              </h3>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
            </div>
            <p className="text-gray-300 text-sm mb-3 line-clamp-2">{item.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-orange-500/20 text-orange-300 border border-orange-400/30 px-2 py-1 rounded text-xs">
                  {item.source}
                </span>
                <span className="text-xs text-gray-400">{formatTimeAgo(item.pubDate)}</span>
              </div>
              <Newspaper className="w-4 h-4 text-orange-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-800/50 border border-orange-400/30 backdrop-blur-xl rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Newspaper className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Music News & Events</h2>
                <p className="text-gray-400 mt-1">Latest from electronic music publications and industry sources</p>
              </div>
            </div>
            <button
              onClick={refreshAll}
              className="border border-orange-400/30 text-orange-300 hover:bg-orange-500/20 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          
          <div className="w-full">
            <div className="grid w-full grid-cols-2 bg-gray-700/50 rounded-lg p-1 mb-6">
              <button 
                onClick={() => setActiveTab('rss')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors ${
                  activeTab === 'rss' 
                    ? 'bg-orange-500/20 text-orange-300' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Rss className="w-4 h-4" />
                RSS Feeds ({rssItems.length})
              </button>
              <button 
                onClick={() => setActiveTab('crawled')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors ${
                  activeTab === 'crawled' 
                    ? 'bg-orange-500/20 text-orange-300' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Globe className="w-4 h-4" />
                Web Sources ({crawledItems.length})
              </button>
            </div>
            
            {activeTab === 'rss' && (
              <div>
                {rssLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading RSS feeds...</p>
                  </div>
                ) : rssItems.length > 0 ? (
                  <div className="space-y-0">
                    {rssItems.slice(0, 10).map((item: RSSItem) => (
                      <NewsCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Rss className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No RSS items available. Try refreshing.</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'crawled' && (
              <div>
                {crawlerLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Crawling web sources...</p>
                  </div>
                ) : crawledItems.length > 0 ? (
                  <div className="space-y-0">
                    {crawledItems.slice(0, 10).map((item: CrawledItem) => (
                      <NewsCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No crawled content available. Try refreshing.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}