import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Crown, Loader2, Play, Download, Lock } from 'lucide-react';

interface VipMix {
  id: number;
  title: string;
  artist?: string;
  genre?: string;
  uploadDate: string;
  fileSize?: string;
  s3Url?: string;
  tags?: string[];
}

const VIPPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [vipMixes, setVipMixes] = useState<VipMix[]>([]);
  const [mixesLoading, setMixesLoading] = useState(true);

  useEffect(() => {
    const fetchVipMixes = async () => {
      try {
        const response = await fetch('/api/vip-mixes', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const mixes = await response.json();
          setVipMixes(mixes);
        }
      } catch (error) {
        console.error('Error fetching VIP mixes:', error);
      } finally {
        setMixesLoading(false);
      }
    };

    if (user && user.subscriptionTier === 'vip') {
      fetchVipMixes();
    } else {
      setMixesLoading(false);
    }
  }, [user]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-16 w-16 animate-spin text-orange-400 mx-auto mb-4" />
          <p>Loading VIP Access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user is not VIP
  if (!user || user.subscriptionTier !== 'vip' || user.subscriptionStatus !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/30 text-center">
          <div className="mb-6">
            <Crown className="h-16 w-16 text-orange-400 mx-auto mb-4" />
            <Lock className="h-8 w-8 text-gray-400 mx-auto" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            VIP Access Required
          </h2>
          
          <p className="text-gray-300 mb-6">
            Access our exclusive VIP mix library with premium deep house content and download privileges.
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => window.location.href = '/simple-auth'}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Sign In To Access
            </button>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <a
                href="https://www.patreon.com/c/deephouseradio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-3 rounded-full text-sm font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <Crown className="h-5 w-5" />
                <span>Join VIP Now</span>
              </a>
              <a
                href="https://www.buymeacoffee.com/deephouseradio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 bg-gray-800/60 hover:bg-gray-700/60 px-6 py-3 rounded-full text-sm font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200 border border-orange-400/30"
              >
                <Star className="h-5 w-5 text-orange-400" />
                <span>Support DHR</span>
              </a>
            </div>
            <p className="text-sm text-gray-400">
              Use emails containing 'vip' to test VIP access level
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white py-8 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="relative">
                <img 
                  src={DHR_LOGO_URL} 
                  alt="DHR Logo"
                  className="h-20 w-20 rounded-2xl shadow-2xl border-2 border-amber-400/50"
                />
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full p-2">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
                  VIP Exclusive
                </h1>
                <p className="text-xl text-gray-300 mt-2">Premium Mix Collection</p>
                {user && (
                  <p className="text-sm text-amber-300 mt-1">
                    Welcome back, {user.email}!
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-2xl p-6 border border-amber-400/30 backdrop-blur-sm max-w-2xl mx-auto">
              <p className="text-lg text-gray-200 leading-relaxed">
                Access Our Exclusive VIP Library With Over 1TB Of Premium Deep House Content. 
                Featuring Unreleased Tracks, Exclusive DJ Sets, And Download Privileges.
              </p>
            </div>
          </header>
          
          {mixesLoading && (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto mb-4" />
              <p className="text-gray-300">Loading VIP Collection...</p>
            </div>
          )}
          
          {/* VIP Features Grid */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-center mb-8 bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
              VIP Privileges
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-2xl p-6 border border-amber-400/20 backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <Music className="h-8 w-8 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">Exclusive Mixes</h3>
                </div>
                <p className="text-gray-300">Access to 1000+ premium deep house mixes not available anywhere else</p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-2xl p-6 border border-amber-400/20 backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <Download className="h-8 w-8 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">Download Access</h3>
                </div>
                <p className="text-gray-300">Download up to 2 high-quality tracks daily for offline listening</p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-2xl p-6 border border-amber-400/20 backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <Headphones className="h-8 w-8 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">Premium Quality</h3>
                </div>
                <p className="text-gray-300">Lossless audio quality and exclusive artist content</p>
              </div>
            </div>
          </section>

          {/* VIP Mix Library */}
          {vipMixes.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-black text-center mb-8 bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
                VIP Mix Library ({vipMixes.length} Tracks)
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vipMixes.map((mix) => (
                  <div key={mix.id} className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-amber-400/20 hover:border-amber-400/40 transition-all duration-200 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{mix.title}</h3>
                        {mix.artist && <p className="text-gray-400 text-sm mb-2">by {mix.artist}</p>}
                        {mix.genre && <p className="text-amber-400 text-sm mb-2">{mix.genre}</p>}
                        {mix.fileSize && <p className="text-gray-500 text-xs">{mix.fileSize}</p>}
                      </div>
                      <Crown className="h-5 w-5 text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Play className="h-4 w-4" />
                        <span>Stream</span>
                      </button>
                      <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {vipMixes.length === 0 && !mixesLoading && (
            <div className="text-center py-12">
              <Crown className="h-16 w-16 text-amber-400 mx-auto mb-4 opacity-60" />
              <p className="text-xl text-gray-300 mb-4">VIP Library Loading...</p>
              <p className="text-gray-400">Your exclusive content will appear here</p>
            </div>
          )}
        </div>
      </div>
  );
};

export default VIPPage;