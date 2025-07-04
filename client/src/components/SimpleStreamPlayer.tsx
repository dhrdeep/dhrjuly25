import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Headphones } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface SimpleStreamPlayerProps {
  channel: 'dhr1' | 'dhr2';
  className?: string;
}

export default function SimpleStreamPlayer({ channel, className = '' }: SimpleStreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Configuration based on channel
  const config = {
    dhr1: {
      streamUrl: 'https://ec1.everestcast.host:2775/stream',
      name: 'DHR1 Premium',
      color: '#f79e02'
    },
    dhr2: {
      streamUrl: 'https://ec1.everestcast.host:2775/stream',
      name: 'DHR2 Exclusive', 
      color: '#fa9200'
    }
  };

  const currentConfig = config[channel];

  // Fetch live metadata for current mix set and DJ info
  const { data: liveMetadata } = useQuery({
    queryKey: ['live-metadata'],
    queryFn: async () => {
      const response = await fetch('/api/live-metadata');
      if (!response.ok) throw new Error('Failed to fetch metadata');
      return response.json();
    },
    refetchInterval: 30000, // Update every 30 seconds
  });

  // Set up audio element properties
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      // Remove crossOrigin for better stream compatibility
      audioRef.current.preload = 'metadata';
      
      // Add event listeners for better stream handling
      const audio = audioRef.current;
      
      const handleCanPlay = () => {
        console.log('Stream ready to play');
      };
      
      const handleError = (e: Event) => {
        console.error('Stream error:', e);
        setIsPlaying(false);
      };
      
      const handleStalled = () => {
        console.log('Stream stalled, attempting to recover...');
        if (isPlaying) {
          audio.load();
          audio.play().catch(console.error);
        }
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      audio.addEventListener('stalled', handleStalled);
      audio.addEventListener('waiting', handleStalled);
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('stalled', handleStalled);
        audio.removeEventListener('waiting', handleStalled);
      };
    }
  }, [volume, isPlaying]);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
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

  return (
    <div className={`w-full max-w-lg mx-auto bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 ${className}`}>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentConfig.streamUrl}
        preload="metadata"
        controls={false}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
        onLoadStart={() => console.log('Stream loading...')}
        onCanPlay={() => console.log('Stream ready')}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{currentConfig.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Headphones className="h-4 w-4" />
              <span>Live Stream</span>
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-white">DHR</div>
            <div className="text-xs text-orange-400">STREAMING NOW</div>
          </div>
        </div>
      </div>

      {/* Current Mix Set Display */}
      <div className="p-6 bg-gray-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png"
              alt="DHR Logo"
              className="w-16 h-16 rounded-lg object-cover"
            />
            {isPlaying && (
              <div 
                className="absolute inset-0 rounded-lg border-2 animate-pulse" 
                style={{ borderColor: currentConfig.color }}
              ></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-lg truncate">
              {liveMetadata?.title || 'Deep House Radio'}
            </h4>
            <p className="text-gray-300 text-sm truncate">
              {liveMetadata?.artist || currentConfig.name}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {isPlaying ? 'Live Now' : 'Ready to Stream'}
            </p>
          </div>
        </div>
        
        {/* Mix Set Info Banner */}
        {liveMetadata?.title && (
          <div className="mt-4 p-3 bg-gray-700 rounded-lg border-l-4" style={{ borderLeftColor: currentConfig.color }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Now Playing</p>
                <p className="text-gray-300 text-xs">{liveMetadata.title}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-400 text-xs font-medium">LIVE</p>
                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'} mx-auto mt-1`}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-gray-700">
        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <button
            onClick={togglePlayPause}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: currentConfig.color }}
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
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${currentConfig.color} 0%, ${currentConfig.color} ${isMuted ? 0 : volume}%, #4b5563 ${isMuted ? 0 : volume}%, #4b5563 100%)`
              }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8">{isMuted ? 0 : volume}</span>
        </div>

        {/* Status */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            {isPlaying ? 'Now Streaming Live' : 'Click Play to Start Stream'}
          </p>
        </div>
      </div>
    </div>
  );
}