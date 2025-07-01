import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Clock, User, Crown, Star, Shield } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ArticleComment {
  id: number;
  articleId: string;
  articleTitle: string;
  articleSource: string;
  userId: string;
  userEmail?: string;
  userName: string;
  userTier: string;
  comment: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ArticleCommentsProps {
  articleId: string;
  articleTitle: string;
  articleSource: string;
  userTier?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export default function ArticleComments({ 
  articleId, 
  articleTitle, 
  articleSource, 
  userTier, 
  userId, 
  userName, 
  userEmail 
}: ArticleCommentsProps) {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  // Fetch comments for this article
  const { data: comments = [], isLoading } = useQuery({
    queryKey: [`/api/comments/${articleId}`],
    enabled: showComments,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Post comment mutation
  const postCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      return await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify(commentData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${articleId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/comments/recent'] });
    },
    onError: (error) => {
      console.error('Error posting comment:', error);
    }
  });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || !userTier || !userId) return;

    // Check subscription requirement
    if (!['DHR1', 'DHR2', 'VIP'].includes(userTier)) {
      alert('Active subscription required to comment. Please upgrade to DHR1, DHR2, or VIP.');
      return;
    }

    postCommentMutation.mutate({
      articleId,
      articleTitle,
      articleSource,
      comment: comment.trim(),
      userTier,
      userId,
      userName: userName || 'Anonymous',
      userEmail
    });
  };

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

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'VIP': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'DHR2': return <Star className="w-4 h-4 text-pink-400" />;
      case 'DHR1': return <Shield className="w-4 h-4 text-orange-400" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'VIP': return 'text-yellow-300 bg-yellow-500/20 border-yellow-400/30';
      case 'DHR2': return 'text-pink-300 bg-pink-500/20 border-pink-400/30';
      case 'DHR1': return 'text-orange-300 bg-orange-500/20 border-orange-400/30';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-400/30';
    }
  };

  const canComment = userTier && ['DHR1', 'DHR2', 'VIP'].includes(userTier);

  return (
    <div className="mt-4 border-t border-gray-700/50 pt-4">
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-orange-300 hover:text-orange-400 transition-colors mb-4"
      >
        <MessageCircle className="w-4 h-4" />
        {showComments ? 'Hide Comments' : `Show Comments (${comments.length})`}
      </button>

      {showComments && (
        <div className="space-y-4">
          {/* Comment Form - Subscription Required */}
          {canComment ? (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                {getTierIcon(userTier!)}
                <span className={`px-2 py-1 rounded text-xs border ${getTierColor(userTier!)}`}>
                  {userTier} Member
                </span>
                <span>• {userName || 'Anonymous'}</span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on this article..."
                className="w-full p-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/50"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {comment.length}/500 characters
                </span>
                <button
                  type="submit"
                  disabled={!comment.trim() || postCommentMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-300 border border-orange-400/30 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {postCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-gray-800/30 border border-gray-600/30 rounded-lg text-center">
              <MessageCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 mb-2">Active subscription required to comment</p>
              <p className="text-sm text-gray-500">
                Upgrade to DHR1, DHR2, or VIP to join the discussion
              </p>
            </div>
          )}

          {/* Comments List */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading comments...</p>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment: ArticleComment) => (
                <div key={comment.id} className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTierIcon(comment.userTier)}
                      <span className={`px-2 py-1 rounded text-xs border ${getTierColor(comment.userTier)}`}>
                        {comment.userTier}
                      </span>
                      <span className="text-white font-medium">{comment.userName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(comment.createdAt)}
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{comment.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}