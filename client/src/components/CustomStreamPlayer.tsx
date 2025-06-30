import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, History, Share2, Headphones, SkipForward } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Track {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  played_at?: string;
}

interface EvercastData {
  current_track: Track;
  history: Track[];
  listeners: number;
}

interface CustomStreamPlayerProps {
  channel: 'dhr1' | 'dhr2';
  className?: string;
}

export default function CustomStreamPlayer({ channel, className = '' }: CustomStreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Configuration based on channel
  const config = {
    dhr1: {
      apiUrl: 'https://ec1.everestcast.host:2750/api/v2',
      streamUrl: 'https://ec1.everestcast.host:2750/stream/1',
      serverId: 1,
      name: 'DHR1 Premium',
      colors: {
        primary: '#f79e02',
        bg: '#1f2937',
        controls: '#111827',
        history: '#374151'
      }
    },
    dhr2: {
      apiUrl: 'https://ec1.everestcast.host:1480/api/v2',
      streamUrl: 'https://ec1.everestcast.host:1480/stream/1',
      serverId: 1, 
      name: 'DHR2 Exclusive',
      colors: {
        primary: '#fa9200',
        bg: '#fa9200', 
        controls: '#d6d6d6',
        history: '#ff9705'
      }
    }
  };

  const currentConfig = config[channel];

  // Fetch live track data
  const { data: trackData } = useQuery<EvercastData>({
    queryKey: [`evercast-${channel}`],
    queryFn: async () => {
      const response = await fetch(`${currentConfig.apiUrl}/server/${currentConfig.serverId}/tracks`);
      if (!response.ok) throw new Error('Failed to fetch track data');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Audio control functions
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume / 100;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Initialize audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const currentTrack = trackData?.current_track || {
    title: 'Deep House Radio',
    artist: currentConfig.name,
    artwork: 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png'
  };

  return (
    <div className={`w-full max-w-lg mx-auto bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 ${className}`}>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentConfig.streamUrl}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{currentConfig.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Headphones className="h-4 w-4" />
              <span>{trackData?.listeners || '0'} listeners</span>
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-white">DHR</div>
            <div className="text-xs text-orange-400">LIVE STREAM</div>
          </div>
        </div>
      </div>

      {/* Current Track Display */}
      <div className="p-6" style={{ backgroundColor: currentConfig.colors.bg }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentTrack.artwork || 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png'}
              alt={currentTrack.title}
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';
              }}
            />
            {isPlaying && (
              <div className="absolute inset-0 rounded-lg border-2 animate-pulse" style={{ borderColor: currentConfig.colors.primary }}></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-lg truncate">{currentTrack.title}</h4>
            <p className="text-gray-300 text-sm truncate">{currentTrack.artist}</p>
            {currentTrack.album && (
              <p className="text-gray-400 text-xs truncate">{currentTrack.album}</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4" style={{ backgroundColor: currentConfig.colors.controls }}>
        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <button
            onClick={togglePlayPause}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: currentConfig.colors.primary }}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <button onClick={toggleMute} className="text-gray-400 hover:text-white">
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, ${currentConfig.colors.primary} 0%, ${currentConfig.colors.primary} ${isMuted ? 0 : volume}%, #374151 ${isMuted ? 0 : volume}%, #374151 100%)`
              }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8">{isMuted ? 0 : volume}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            <History className="h-4 w-4" />
            <span className="text-sm">History</span>
          </button>
          
          <button
            onClick={() => {
              try {
                if (navigator.share && navigator.share.length !== undefined) {
                  navigator.share({
                    title: `${currentTrack.title} - ${currentTrack.artist}`,
                    text: `Now playing on ${currentConfig.name}`,
                    url: window.location.href
                  }).catch(() => {
                    // Fallback: copy to clipboard
                    navigator.clipboard?.writeText(`${currentTrack.title} - ${currentTrack.artist} | ${currentConfig.name}`);
                  });
                } else {
                  // Fallback: copy to clipboard
                  navigator.clipboard?.writeText(`${currentTrack.title} - ${currentTrack.artist} | ${currentConfig.name}`);
                }
              } catch (error) {
                console.log('Share not supported');
              }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && trackData?.history && (
        <div className="border-t border-gray-700" style={{ backgroundColor: currentConfig.colors.history }}>
          <div className="p-4">
            <h5 className="text-sm font-semibold text-white mb-3">Recently Played</h5>
            <div className="space-y-2">
              {trackData.history.slice(0, 5).map((track, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-black/20">
                  <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center">
                    <span className="text-xs text-white">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{track.title}</p>
                    <p className="text-xs text-gray-300 truncate">{track.artist}</p>
                  </div>
                  {track.played_at && (
                    <span className="text-xs text-gray-400">
                      {new Date(track.played_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}