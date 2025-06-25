import React, { useState, useEffect, useRef } from 'react';
import { Crown, Download, Play, Search, Filter, Star, Clock, Users, HardDrive, Lock, AlertCircle, Pause, Volume2 } from 'lucide-react';
import { vipService, VipAccess } from '../services/vipService';
import { VipMix } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

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
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch VIP mixes from database
  const { data: vipMixes = [], isLoading } = useQuery({
    queryKey: ['/api/vip-mixes'],
    queryFn: () => vipService.fetchVipMixes()
  });

  useEffect(() => {
    // Demo user with VIP access for testing
    const mockUser = { id: 'demo_user', username: 'Demo User', subscriptionTier: 'vip' };
    setCurrentUser(mockUser);
    vipService.setCurrentUser(mockUser);
    
    // Check access permissions
    vipService.checkAccess(mockUser.id).then(setAccess);
  }, []);

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const handlePlay = async (mixId: number, mixTitle: string) => {
    try {
      // If same track is playing, pause it
      if (currentlyPlaying === mixId && isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setNotification(`Paused: ${mixTitle}`);
        return;
      }

      // Stop any currently playing audio
      if (currentlyPlaying && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Use proxy endpoint to stream audio without exposing source
      const audioUrl = `/api/stream/${mixId}`;
      console.log('Loading audio URL:', audioUrl);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        
        try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setCurrentlyPlaying(mixId);
              setIsPlaying(true);
              setNotification(`Now Playing: ${mixTitle}`);
            }).catch((playError) => {
              console.error('Play error:', playError);
              setNotification(`Playback Error: ${mixTitle}`);
              setCurrentlyPlaying(null);
              setIsPlaying(false);
            });
          }
        } catch (playError) {
          console.error('Play error:', playError);
          setNotification(`Playback Error: ${mixTitle}`);
          setCurrentlyPlaying(null);
          setIsPlaying(false);
        }
      }
    } catch (error) {
      setNotification(`Error Loading: ${mixTitle}`);
    }
  };

  const handleDownload = async (mixId: number, mixTitle: string) => {
    try {
      // Use proxy endpoint for downloads without exposing source
      const downloadUrl = `/api/file/${mixId}?userId=${currentUser.id}`;
      
      // Create temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${mixTitle}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setNotification(`Downloaded: ${mixTitle}`);
      
      // Refresh access info
      vipService.checkAccess(currentUser.id).then(setAccess);
    } catch (error) {
      setNotification(`Download Error: ${mixTitle}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                            ? currentlyPlaying === mix.id && isPlaying
                              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-400/30'
                              : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 border border-orange-400/30'
                            : 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600/30'
                        }`}
                        disabled={!access.canPlay}
                        title={access.canPlay ? 'Play mix' : 'DHR1 subscription required'}
                      >
                        {access.canPlay ? (
                          currentlyPlaying === mix.id && isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        <span>{currentlyPlaying === mix.id && isPlaying ? 'Pause' : 'Play'}</span>
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
                    
                    {/* Genre and Tags */}
                    {mix.genre && (
                      <div className="mt-3">
                        <span className="inline-block bg-orange-900/30 text-orange-300 px-2 py-1 rounded text-xs">
                          {mix.genre}
                        </span>
                      </div>
                    )}
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

        {/* Built-in Audio Player */}
        {currentlyPlaying && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50 shadow-2xl">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center space-x-4">
                {/* Track Info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <img
                    src={vipMixes.find(m => m.id === currentlyPlaying)?.artworkUrl || DHR_LOGO_URL}
                    alt="Now Playing"
                    className="w-12 h-12 rounded object-cover"
                    onError={handleArtworkError}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium truncate">
                      {vipMixes.find(m => m.id === currentlyPlaying)?.title || 'Unknown Track'}
                    </div>
                    <div className="text-gray-400 text-sm truncate">
                      {vipMixes.find(m => m.id === currentlyPlaying)?.artist || 'Unknown Artist'}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (isPlaying) {
                        audioRef.current?.pause();
                        setIsPlaying(false);
                      } else {
                        audioRef.current?.play();
                        setIsPlaying(true);
                      }
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-full transition-colors"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>{formatTime(currentTime)}</span>
                    <div className="w-32 h-1 bg-gray-700 rounded-full">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                      ></div>
                    </div>
                    <span>{formatTime(duration)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        setVolume(newVolume);
                        if (audioRef.current) {
                          audioRef.current.volume = newVolume;
                        }
                      }}
                      className="w-20 h-1 bg-gray-700 rounded-full appearance-none"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      setCurrentlyPlaying(null);
                      setIsPlaying(false);
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.src = '';
                      }
                    }}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
              audioRef.current.volume = volume;
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentlyPlaying(null);
            setNotification('Track Ended');
          }}
          onError={(e) => {
            console.error('Audio error:', e);
            setNotification('Audio Error - File Not Available');
            setIsPlaying(false);
            setCurrentlyPlaying(null);
          }}
          onCanPlay={() => {
            console.log('Audio can play - ready to start');
          }}
          onLoadStart={() => {
            console.log('Audio load started');
          }}
          onLoadedData={() => {
            console.log('Audio data loaded');
          }}
          onPlay={() => {
            console.log('Audio started playing');
            setIsPlaying(true);
          }}
          onPause={() => {
            console.log('Audio paused');
            setIsPlaying(false);
          }}
          preload="none"
        />

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 bg-orange-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {notification}
          </div>
        )}
    </div>
  );
};

export default VIPPage;