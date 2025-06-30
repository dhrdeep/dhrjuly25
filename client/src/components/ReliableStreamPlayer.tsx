import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Headphones, Radio } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ReliableStreamPlayerProps {
  channel: 'dhr1' | 'dhr2';
  className?: string;
}

export default function ReliableStreamPlayer({ channel, className = '' }: ReliableStreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'loading' | 'ready' | 'error'>('ready');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Stream configuration based on channel
  const channelConfig = {
    dhr1: { 
      name: 'DHR1 Premium', 
      color: '#f79e02',
      streamUrl: 'https://ec1.everestcast.host:2775/stream'
    },
    dhr2: { 
      name: 'DHR2 Exclusive', 
      color: '#fa9200',
      streamUrl: 'https://ec1.everestcast.host:1480/stream'
    }
  };
  const config = channelConfig[channel];

  // Fetch live metadata
  const { data: liveMetadata } = useQuery({
    queryKey: ['live-metadata'],
    queryFn: async () => {
      const response = await fetch('/api/live-metadata');
      if (!response.ok) throw new Error('Failed to fetch metadata');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume / 100;
    
    const handleLoadStart = () => setStreamStatus('loading');
    const handleCanPlay = () => setStreamStatus('ready');
    const handleError = () => {
      setStreamStatus('error');
      setIsPlaying(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [volume]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        setStreamStatus('loading');
        await audio.play();
      }
    } catch (error) {
      console.error('Playback error:', error);
      setStreamStatus('error');
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
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume / 100;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const getStatusText = () => {
    if (streamStatus === 'loading') return 'Connecting...';
    if (streamStatus === 'error') return 'Connection Error';
    if (isPlaying) return 'Live Now';
    return 'Ready to Stream';
  };

  const getStatusColor = () => {
    if (streamStatus === 'loading') return 'text-yellow-400';
    if (streamStatus === 'error') return 'text-red-400';
    if (isPlaying) return 'text-green-400';
    return 'text-gray-400';
  };

  return (
    <div className={`w-full max-w-lg mx-auto bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 ${className}`}>
      {/* Audio Element */}
      <audio ref={audioRef} src={config.streamUrl} />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{config.name}</h3>
            <div className="flex items-center gap-2 text-sm">
              <Radio className="h-4 w-4 text-orange-400" />
              <span className={getStatusColor()}>{getStatusText()}</span>
              <span className="text-orange-400 font-medium">• 320kbps</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-white">DHR</div>
            <div className="text-xs text-orange-400">LIVE STREAM</div>
          </div>
        </div>
      </div>

      {/* Current Mix Display */}
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
                style={{ borderColor: config.color }}
              />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-lg truncate">
              {liveMetadata?.title || 'Deep House Radio'}
            </h4>
            <p className="text-gray-300 text-sm truncate">
              {liveMetadata?.artist || 'Live DJ Set'}
            </p>
            <p className={`text-xs truncate ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-gray-700">
        <div className="flex items-center justify-center gap-6 mb-4">
          <button
            onClick={togglePlayPause}
            disabled={streamStatus === 'loading'}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
            style={{ backgroundColor: config.color }}
          >
            {streamStatus === 'loading' ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
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
                background: `linear-gradient(to right, ${config.color} 0%, ${config.color} ${isMuted ? 0 : volume}%, #4b5563 ${isMuted ? 0 : volume}%, #4b5563 100%)`
              }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8">{isMuted ? 0 : volume}</span>
        </div>
      </div>
    </div>
  );
}