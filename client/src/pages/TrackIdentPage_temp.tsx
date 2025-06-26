import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Headphones } from 'lucide-react';

// Mock subscription service for demo - replace with actual service
const mockSubscriptionService = {
  getCurrentUser: () => ({ subscriptionTier: 'vip', username: 'demo_user' })
};

const TrackIdentPage: React.FC = () => {
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  useEffect(() => {
    const user = mockSubscriptionService.getCurrentUser();
    if (user) {
      setHasAccess(['dhr1', 'dhr2', 'vip'].includes(user.subscriptionTier));
    } else {
      setHasAccess(true); // Demo access
    }
  }, []);
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-orange-400/20 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="h-10 w-10 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Track Identifier Access Required</h2>
            <p className="text-gray-300 mb-6">
              Track identification is available exclusively to DHR subscribers. 
              Upgrade to access this premium feature and support deep house music.
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20">
              <div className="text-blue-400 font-semibold">DHR1 - €3/month</div>
              <div className="text-sm text-gray-400">Track ID + DHR1 Premium Stream</div>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
              <div className="text-purple-400 font-semibold">DHR2 - €5/month</div>
              <div className="text-sm text-gray-400">Track ID + DHR1 + DHR2 Premium</div>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-400/20">
              <div className="text-orange-400 font-semibold">VIP - €10/month</div>
              <div className="text-sm text-gray-400">Track ID + All Streams + VIP Downloads</div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <a 
              href="https://patreon.com/deephouseradio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 bg-orange-500 hover:bg-orange-600 px-4 py-3 rounded-lg text-white font-semibold transition-colors"
            >
              Subscribe Now
            </a>
            <Link 
              to="/" 
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg text-white font-semibold transition-colors text-center"
            >
              Back To Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">Track Identifier</h1>
          <p className="text-xl text-gray-300">Discover What's Playing On DHR Live Stream</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
          <p className="text-gray-300 text-center">
            Track identification feature is currently in development. 
            Check back soon for AI-powered track recognition capabilities.
          </p>
        </div>

        <div className="text-center">
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
          >
            Back To Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackIdentPage;