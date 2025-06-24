import React from 'react';
import { Crown, Lock, Star, ExternalLink } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionTier } from '../types/subscription';

interface SubscriptionGateProps {
  requiredTier: SubscriptionTier;
  contentType: 'dhr1' | 'dhr2' | 'vip';
  children: React.ReactNode;
  fallbackContent?: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ 
  requiredTier, 
  contentType, 
  children, 
  fallbackContent 
}) => {
  const currentUser = subscriptionService.getCurrentUser();
  const canAccess = subscriptionService.canAccessContent(contentType);

  if (canAccess) {
    return <>{children}</>;
  }

  if (fallbackContent) {
    return <>{fallbackContent}</>;
  }

  // Default subscription prompt
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/30 text-center">
        <div className="mb-6">
          {requiredTier === 'vip' ? (
            <Crown className="h-16 w-16 text-orange-400 mx-auto mb-4" />
          ) : (
            <Star className="h-16 w-16 text-orange-400 mx-auto mb-4" />
          )}
          <Lock className="h-8 w-8 text-gray-400 mx-auto" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">
          {requiredTier === 'vip' ? 'VIP Access Required' : 'Premium Access Required'}
        </h2>
        
        <p className="text-gray-300 mb-6">
          {contentType === 'dhr1' && 'Access DHR1 Premium with high-quality streaming and exclusive content.'}
          {contentType === 'dhr2' && 'Access DHR2 Premium featuring exclusive DJ sets and extended mixes.'}
          {contentType === 'vip' && 'Access our VIP section with 1TB+ of exclusive content and unlimited downloads.'}
        </p>

        <div className="space-y-3">
          <a
            href="https://www.patreon.com/c/deephouseradio"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-3 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Crown className="h-5 w-5" />
            <span>Subscribe on Patreon</span>
            <ExternalLink className="h-4 w-4" />
          </a>
          
          <a
            href="https://www.buymeacoffee.com/deephouseradio"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-3 bg-gray-700/60 hover:bg-gray-600/60 px-6 py-3 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 border border-orange-400/30"
          >
            <Star className="h-5 w-5 text-orange-400" />
            <span>Support on Buy Me a Coffee</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {!currentUser && (
          <div className="mt-6 pt-6 border-t border-gray-600/30">
            <p className="text-sm text-gray-400 mb-3">Already a subscriber?</p>
            <button className="text-orange-400 hover:text-orange-300 font-medium text-sm">
              Sign in to access your content
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionGate;