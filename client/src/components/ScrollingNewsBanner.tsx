import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Clock, ExternalLink } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  pubDate: Date;
  link: string;
}

interface Comment {
  id: number;
  articleTitle: string;
  comment: string;
  userName: string;
  userTier: string;
  createdAt: Date;
}

export default function ScrollingNewsBanner() {
  // Fetch prioritized articles (commented articles first, then newest)
  const { data: newsItems = [] } = useQuery({
    queryKey: ['/api/articles/prioritized'],
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Fetch recent comments
  const { data: comments = [] } = useQuery({
    queryKey: ['/api/comments/recent/5'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Combine news and comments for scrolling
  const scrollingItems = [
    ...newsItems.slice(0, 5).map((item: NewsItem) => ({
      id: `news-${item.id}`,
      type: 'news' as const,
      title: item.title,
      source: item.source,
      time: formatTimeAgo(item.pubDate),
      link: item.link
    })),
    ...comments.map((comment: Comment) => ({
      id: `comment-${comment.id}`,
      type: 'comment' as const,
      title: `${comment.userName} commented on "${comment.articleTitle}"`,
      source: comment.userTier,
      time: formatTimeAgo(comment.createdAt),
      content: comment.comment
    }))
  ];

  if (scrollingItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-orange-500/10 border-y border-orange-400/20 py-3 overflow-hidden">
      <div className="relative">
        {/* DHR News Ticker Header */}
        <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 flex items-center font-bold text-sm z-10 shadow-lg">
          <span className="whitespace-nowrap">DHR NEWS</span>
        </div>
        
        {/* Scrolling Content */}
        <div className="pl-24 pr-4">
          <div className="flex animate-scroll">
            {scrollingItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 mr-8 whitespace-nowrap">
                {item.type === 'news' ? (
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span className="text-white font-medium">{item.title}</span>
                    <span className="text-orange-300 text-sm">• {item.source}</span>
                    <span className="text-gray-400 text-xs">• {item.time}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span className="text-white font-medium">{item.title}</span>
                    <span className="text-pink-300 text-sm">• {item.source} Member</span>
                    <span className="text-gray-400 text-xs">• {item.time}</span>
                  </div>
                )}
              </div>
            ))}
            
            {/* Duplicate items for seamless loop */}
            {scrollingItems.map((item) => (
              <div key={`${item.id}-duplicate`} className="flex items-center space-x-4 mr-8 whitespace-nowrap">
                {item.type === 'news' ? (
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span className="text-white font-medium">{item.title}</span>
                    <span className="text-orange-300 text-sm">• {item.source}</span>
                    <span className="text-gray-400 text-xs">• {item.time}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span className="text-white font-medium">{item.title}</span>
                    <span className="text-pink-300 text-sm">• {item.source} Member</span>
                    <span className="text-gray-400 text-xs">• {item.time}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}