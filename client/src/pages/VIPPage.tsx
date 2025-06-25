import React, { useState, useEffect } from 'react';
import { Crown, Download, Play, Search, Filter, Star, Clock, Users, HardDrive, Lock, AlertCircle } from 'lucide-react';
import { vipService, VipAccess } from '../services/vipService';
import { VipMix } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import JumpsharePreview from '../components/JumpsharePreview';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const VIPPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [access, setAccess] = useState<VipAccess>({
    canView: true,
    canPlay: false,
    canDownload: false,
    remainingDownloads: 0,
    subscriptionTier: 'free'
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notification, setNotification] = useState<string>('');

  // Fetch VIP mixes from database
  const { data: vipMixes = [], isLoading } = useQuery({
    queryKey: ['/api/vip-mixes'],
    queryFn: () => vipService.fetchVipMixes()
  });

  useEffect(() => {
    // In a real app, this would come from auth context
    const mockUser = { id: 'demo_user', username: 'Demo User', subscriptionTier: 'free' };
    setCurrentUser(mockUser);
    vipService.setCurrentUser(mockUser);
    
    // Check access permissions
    vipService.checkAccess(mockUser.id).then(setAccess);
  }, []);

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const vipStats = [
    { icon: HardDrive, label: 'Total Storage', value: '1.2TB' },
    { icon: Users, label: 'VIP Members', value: '2.5K+' },
    { icon: Download, label: 'Downloads Today', value: '847' },
    { icon: Star, label: 'Exclusive Mixes', value: '1,250+' }
  ];

  const genres = [
    'all', 'deep house', 'tech house', 'progressive', 'melodic', 'minimal', 'organic'
  ];

  const filteredMixes = vipMixes.filter(mix => {
    const matchesSearch = mix.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mix.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || mix.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const handleDownload = async (mixId: number, mixTitle: string) => {
    if (!access.canDownload) {
      setNotification(access.message || 'VIP membership required for downloads');
      return;
    }
    
    if (!currentUser?.id) {
      setNotification('Please sign in to download mixes');
      return;
    }
    
    const result = await vipService.downloadMix(mixId, currentUser.id);
    setNotification(result.message);
    
    if (result.success) {
      // Refresh access to update remaining downloads
      const newAccess = await vipService.checkAccess(currentUser.id);
      setAccess(newAccess);
    }
  };

  const handlePlay = async (mixId: number, mixTitle: string) => {
    if (!access.canPlay) {
      setNotification(access.message || 'DHR1 subscription required to play mixes');
      return;
    }
    
    // Get mix details to access Jumpshare preview URL
    try {
      const response = await fetch(`/api/vip-mixes/${mixId}`);
      if (response.ok) {
        const mix = await response.json();
        if (mix.jumpsharePreviewUrl && mix.jumpsharePreviewUrl.includes('jumpshare.com')) {
          // Check if this is a real Jumpshare URL vs generated placeholder
          if (mix.jumpsharePreviewUrl.includes('/preview/')) {
            window.open(mix.jumpsharePreviewUrl, '_blank', 'noopener,noreferrer');
            setNotification(`Opening stream: ${mixTitle}`);
          } else {
            setNotification(`Demo mode: ${mixTitle} - Real Jumpshare URL needed for audio playback`);
          }
        } else {
          setNotification(`Demo mode: ${mixTitle} - Update with real Jumpshare URL in VIP Admin`);
        }
      }
    } catch (error) {
      setNotification(`Error loading mix: ${mixTitle}`);
    }
  };

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (isLoading) {
    return (
      <div className="min-h-screen text-white py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-400"></div>
          <p className="mt-4 text-xl">Loading VIP Content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white py-8 px-4">
      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{notification}</span>
          </div>
        </div>
      )}
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="relative">
                <img 
                  src={DHR_LOGO_URL} 
                  alt="DHR Logo"
                  className="h-24 w-24 rounded-2xl shadow-2xl border-2 border-orange-400/50"
                  onError={handleArtworkError}
                />
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-3">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-6xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                  VIP Access
                </h1>
                <p className="text-2xl text-gray-300 mt-2">Exclusive Deep House Collection</p>
                {currentUser && (
                  <div className="text-sm text-orange-300 mt-1">
                    <p>Welcome back, {currentUser.username}!</p>
                    <p className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${vipService.getTierColor(access.subscriptionTier)}`}>
                      {vipService.getTierName(access.subscriptionTier)} Member
                    </p>
                    {access.subscriptionTier === 'vip' && (
                      <p className="mt-1">{access.remainingDownloads} downloads remaining today</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl p-8 border border-orange-400/30 backdrop-blur-sm max-w-3xl mx-auto">
              <p className="text-xl text-gray-200 leading-relaxed mb-4">
                Welcome To The VIP Section! Access Over 1TB Of Exclusive Deep House Mixes, 
                High-Quality Downloads, And Premium Content Curated Just For Our VIP Members.
              </p>
              
              {/* Access Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className={`flex items-center space-x-2 p-3 rounded-lg ${access.canView ? 'bg-green-500/20 border border-green-400/30' : 'bg-gray-500/20 border border-gray-400/30'}`}>
                  {access.canView ? <Star className="h-5 w-5 text-green-400" /> : <Lock className="h-5 w-5 text-gray-400" />}
                  <span className="text-sm font-medium">View Mixes</span>
                </div>
                <div className={`flex items-center space-x-2 p-3 rounded-lg ${access.canPlay ? 'bg-green-500/20 border border-green-400/30' : 'bg-orange-500/20 border border-orange-400/30'}`}>
                  {access.canPlay ? <Play className="h-5 w-5 text-green-400" /> : <Lock className="h-5 w-5 text-orange-400" />}
                  <span className="text-sm font-medium">Play Mixes {!access.canPlay && '(DHR1+)'}</span>
                </div>
                <div className={`flex items-center space-x-2 p-3 rounded-lg ${access.canDownload ? 'bg-green-500/20 border border-green-400/30' : 'bg-orange-500/20 border border-orange-400/30'}`}>
                  {access.canDownload ? <Download className="h-5 w-5 text-green-400" /> : <Lock className="h-5 w-5 text-orange-400" />}
                  <span className="text-sm font-medium">Download {!access.canDownload && '(VIP)'}</span>
                </div>
              </div>
              
              {access.message && (
                <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-4 mt-4">
                  <p className="text-orange-200 font-semibold text-center">
                    {access.message}
                  </p>
                </div>
              )}
            </div>
          </header>

          {/* VIP Stats */}
          <section className="mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {vipStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 hover:border-orange-400/40 transition-all duration-200 group">
                      <Icon className="h-8 w-8 text-orange-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                      <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Search and Filter */}
          <section className="mb-8">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search exclusive mixes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="pl-10 pr-8 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50 appearance-none cursor-pointer"
                  >
                    {genres.map(genre => (
                      <option key={genre} value={genre} className="bg-gray-800">
                        {genre.charAt(0).toUpperCase() + genre.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Exclusive Mixes Grid */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
              Exclusive Mixes ({filteredMixes.length})
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMixes.map((mix) => (
                <div
                  key={mix.id}
                  className="bg-gray-800/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-orange-400/20 hover:border-orange-400/40 transition-all duration-200 group"
                >
                  <div className="relative">
                    <img 
                      src={mix.artworkUrl || DHR_LOGO_URL} 
                      alt={`${mix.title} artwork`}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={handleArtworkError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    {mix.isExclusive && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                        <Crown className="h-3 w-3" />
                        <span>VIP</span>
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                      <Star className="h-3 w-3 text-orange-400" />
                      <span className="text-white text-xs">{mix.rating || 0}</span>
                    </div>
                    
                    <button 
                      onClick={() => handlePlay(mix.id, mix.title)}
                      className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm ${
                        access.canPlay 
                          ? 'bg-orange-500/80 hover:bg-orange-500' 
                          : 'bg-gray-600/80 cursor-not-allowed'
                      }`}
                      disabled={!access.canPlay}
                    >
                      {access.canPlay ? (
                        <Play className="h-6 w-6 text-white ml-1" />
                      ) : (
                        <Lock className="h-6 w-6 text-white" />
                      )}
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
                      {mix.title}
                    </h3>
                    <p className="text-orange-200 mb-3">{mix.artist}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{mix.duration}</span>
                        </div>
                        <span className="text-orange-400 font-medium">{mix.fileSize}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="h-4 w-4" />
                        <span>{mix.totalDownloads || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handlePlay(mix.id, mix.title)}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
                          access.canPlay 
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 border border-orange-400/30'
                            : 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600/30'
                        }`}
                        disabled={!access.canPlay}
                        title={access.canPlay ? 'Play mix' : 'DHR1 subscription required'}
                      >
                        {access.canPlay ? <Play className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        <span>Play</span>
                      </button>
                      
                      <button 
                        onClick={() => handleDownload(mix.id, mix.title)}
                        className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                          access.canDownload 
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 border border-orange-400/30 hover:scale-105'
                            : 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600/30'
                        }`}
                        disabled={!access.canDownload}
                        title={access.canDownload ? `Download mix (${access.remainingDownloads} remaining)` : 'VIP membership required'}
                      >
                        {access.canDownload ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Jumpshare Integration Preview */}
                    <JumpsharePreview
                      mix={mix}
                      canPlay={access.canPlay}
                      canDownload={access.canDownload}
                      onPlay={() => handlePlay(mix.id, mix.title)}
                      onDownload={() => handleDownload(mix.id, mix.title)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Google Ads Placeholder */}
          <section className="mb-12">
            <div className="bg-gray-800/20 border border-orange-400/10 rounded-2xl p-8 text-center">
              <div className="text-gray-500 text-sm mb-2">Advertisement</div>
              <div className="h-32 bg-gray-700/20 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Google Ads Space - VIP Content</span>
              </div>
            </div>
          </section>

          {/* VIP Subscription CTA */}
          {access.subscriptionTier === 'free' && (
            <section className="text-center">
              <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-3xl p-12 border border-orange-400/30 backdrop-blur-sm">
                <Crown className="h-20 w-20 text-orange-400 mx-auto mb-6" />
                <h2 className="text-5xl font-black mb-6 text-white">
                  Become A VIP Member
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                  Unlock access to over 1TB of exclusive deep house content, high-quality downloads, 
                  and premium mixes from the world's best DJs. Join our VIP community today!
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
                  <div className="bg-gray-800/40 rounded-xl p-6 border border-orange-400/20">
                    <HardDrive className="h-8 w-8 text-orange-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-white mb-2">1TB+ Content</h3>
                    <p className="text-gray-400 text-sm">Massive library of exclusive mixes</p>
                  </div>
                  <div className="bg-gray-800/40 rounded-xl p-6 border border-orange-400/20">
                    <Download className="h-8 w-8 text-orange-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-white mb-2">HD Downloads</h3>
                    <p className="text-gray-400 text-sm">High-quality audio files</p>
                  </div>
                  <div className="bg-gray-800/40 rounded-xl p-6 border border-orange-400/20">
                    <Star className="h-8 w-8 text-orange-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-white mb-2">Exclusive Access</h3>
                    <p className="text-gray-400 text-sm">VIP-only content and early releases</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <a
                    href="https://www.patreon.com/c/deephouseradio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Crown className="h-6 w-6" />
                    <span>Join VIP Now</span>
                  </a>
                  <a
                    href="https://www.buymeacoffee.com/deephouseradio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 bg-gray-800/60 hover:bg-gray-700/60 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200 border border-orange-400/30"
                  >
                    <Star className="h-6 w-6 text-orange-400" />
                    <span>Support DHR</span>
                  </a>
                </div>
              </div>
            </section>
          )}
        </div>
    </div>
  );
};

export default VIPPage;