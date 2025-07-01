import React, { useState, useEffect } from 'react';
import { Play, Pause, Download, Lock, Music, Clock, Calendar, Star, Volume2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface VipMix {
  id: number;
  title: string;
  artist?: string;
  description?: string;
  fileUrl?: string;
  s3Url?: string;
  createdAt: string;
  playCount?: number;
  tags?: string;
}

interface FeaturedDJSetsProps {
  maxSets?: number;
  showTitle?: boolean;
  className?: string;
}

const FeaturedDJSets: React.FC<FeaturedDJSetsProps> = ({ 
  maxSets = 6, 
  showTitle = true, 
  className = '' 
}) => {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [featuredSets, setFeaturedSets] = useState<VipMix[]>([]);

  // Fetch VIP mixes for featured sets
  const { data: vipMixes, isLoading } = useQuery<VipMix[]>({
    queryKey: ['/api/vip-mixes'],
    enabled: true
  });

  // Randomly select featured sets from VIP mixes
  useEffect(() => {
    if (vipMixes && vipMixes.length > 0) {
      const shuffled = [...vipMixes].sort(() => 0.5 - Math.random());
      setFeaturedSets(shuffled.slice(0, maxSets));
    }
  }, [vipMixes, maxSets]);

  useEffect(() => {
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', () => setPlayingId(null));
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', () => setPlayingId(null));
      };
    }
  }, [audio]);

  const handlePlay = async (mix: VipMix) => {
    if (playingId === mix.id) {
      audio?.pause();
      setPlayingId(null);
      return;
    }

    if (audio) {
      audio.pause();
    }

    try {
      const newAudio = new Audio();
      
      // Use S3 URL or fallback to file URL
      const streamUrl = mix.s3Url || mix.fileUrl;
      if (!streamUrl) {
        alert('Audio Source Not Available - Please Contact Admin');
        return;
      }

      newAudio.src = streamUrl;
      setAudio(newAudio);
      setPlayingId(mix.id);
      
      await newAudio.play();
    } catch (error) {
      console.error('Audio playback failed:', error);
      alert('Playback Requires DHR1/DHR2 Subscription - Upgrade For Full Access');
      setPlayingId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (url?: string) => {
    // Estimate file size based on typical mix lengths
    return '~147MB';
  };

  const getGenreTags = (tags?: string) => {
    if (!tags) return ['Deep House', 'Progressive'];
    return tags.split(',').map(tag => tag.trim()).slice(0, 3);
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h2 className="text-3xl font-black text-center mb-8 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
            Featured DJ Sets
          </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: maxSets }).map((_, index) => (
            <div key={index} className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 animate-pulse">
              <div className="w-full h-32 bg-gray-700/50 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-4 bg-gray-700/50 rounded mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-10 w-10 bg-gray-700/50 rounded-full"></div>
                <div className="h-10 w-20 bg-gray-700/50 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showTitle && (
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
            Featured DJ Sets
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Curated Selection Of Premium Deep House Sessions From Our VIP Collection. 
            Playback Requires Active DHR1, DHR2, Or VIP Subscription.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredSets.map((mix) => (
          <div key={mix.id} className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 hover:border-orange-400/40 transition-all group">
            {/* Artwork/Visual */}
            <div className="relative mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-orange-500/20 to-orange-600/20">
              <div className="aspect-video flex items-center justify-center">
                <div className="relative">
                  <Music className="h-16 w-16 text-orange-400/60" />
                  {playingId === mix.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Volume2 className="h-8 w-8 text-orange-400 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Play button overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handlePlay(mix)}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full transition-all transform hover:scale-110"
                >
                  {playingId === mix.id ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </button>
              </div>
            </div>

            {/* Mix Info */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold text-white truncate">
                  {mix.title || 'Untitled Mix'}
                </h3>
                {mix.artist && (
                  <p className="text-orange-400 text-sm">
                    By {mix.artist}
                  </p>
                )}
              </div>

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2">
                {getGenreTags(mix.tags).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full border border-orange-400/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Progress bar (if playing) */}
              {playingId === mix.id && duration > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                  <div className="w-full bg-gray-600/50 rounded-full h-1">
                    <div
                      className="bg-orange-500 h-1 rounded-full transition-all"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-600/30">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatFileSize()}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePlay(mix)}
                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 p-2 rounded-lg transition-all"
                  >
                    {playingId === mix.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 p-2 rounded-lg transition-all"
                    title="Download Requires VIP Membership"
                  >
                    <Lock className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {featuredSets.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Music className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            No Featured Sets Available Yet
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Check Back Soon For New Releases
          </p>
        </div>
      )}
    </div>
  );
};

export default FeaturedDJSets;