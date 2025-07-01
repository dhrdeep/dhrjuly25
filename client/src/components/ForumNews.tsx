import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, ExternalLink, ThumbsUp, MessageCircle, RefreshCw, Globe, Users } from 'lucide-react';

interface RSSItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  imageUrl?: string;
}

interface RedditPost {
  id: string;
  title: string;
  url: string;
  author: string;
  score: number;
  numComments: number;
  subreddit: string;
  created: string;
  permalink: string;
  thumbnail?: string;
}

export default function ForumNews() {
  const [activeTab, setActiveTab] = useState('rss');
  
  const { data: rssItems = [], isLoading: rssLoading, refetch: refetchRSS } = useQuery({
    queryKey: ['/api/rss/latest'],
    refetchInterval: 30 * 60 * 1000, // Refresh every 30 minutes
  });

  const { data: redditPosts = [], isLoading: redditLoading, refetch: refetchReddit } = useQuery({
    queryKey: ['/api/reddit/posts'],
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const refreshAll = async () => {
    await Promise.all([refetchRSS(), refetchReddit()]);
  };

  const RSSCard = ({ item }: { item: RSSItem }) => (
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

  const RedditCard = ({ post }: { post: RedditPost }) => (
    <div className="mb-4 hover:shadow-lg transition-shadow bg-gray-900/50 border border-orange-400/30 rounded-lg">
      <div className="p-4">
        <div className="flex gap-4">
          {post.thumbnail && (
            <img 
              src={post.thumbnail} 
              alt={post.title}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-white hover:text-orange-400 transition-colors leading-tight">
                <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="block">
                  {post.title}
                </a>
              </h3>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-orange-500/20 text-orange-300 border border-orange-400/30 px-2 py-1 rounded text-xs">
                  r/{post.subreddit}
                </span>
                <span className="text-xs text-gray-400">u/{post.author}</span>
                <span className="text-xs text-gray-400">{formatTimeAgo(post.created)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{post.score}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.numComments}</span>
                </div>
              </div>
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
                <h2 className="text-2xl font-black text-white">Music News & Community</h2>
                <p className="text-gray-400 mt-1">Latest from electronic music publications and Reddit</p>
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
                <Globe className="w-4 h-4" />
                Music Press ({rssItems.length})
              </button>
              <button 
                onClick={() => setActiveTab('reddit')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors ${
                  activeTab === 'reddit' 
                    ? 'bg-orange-500/20 text-orange-300' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                Reddit ({redditPosts.length})
              </button>
            </div>
            
            {activeTab === 'rss' && (
              <div>
                {rssLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading music news...</p>
                  </div>
                ) : rssItems.length > 0 ? (
                  <div className="space-y-0">
                    {rssItems.slice(0, 10).map((item: RSSItem) => (
                      <RSSCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No news items available. Try refreshing.</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'reddit' && (
              <div>
                {redditLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading Reddit posts...</p>
                  </div>
                ) : redditPosts.length > 0 ? (
                  <div className="space-y-0">
                    {redditPosts.slice(0, 10).map((post: RedditPost) => (
                      <RedditCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No Reddit posts available. Try refreshing.</p>
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