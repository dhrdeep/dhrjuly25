import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Headphones, Radio, Cast, Timer, ExternalLink } from 'lucide-react';
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
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sleepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      streamUrl: 'https://ec1.everestcast.host:1565/stream'
    }
  };
  const config = channelConfig[channel];

  // Fetch live metadata
  const { data: liveMetadata } = useQuery({
    queryKey: ['live-metadata', channel],
    queryFn: async () => {
      const response = await fetch(`/api/live-metadata?channel=${channel}`);
      if (!response.ok) throw new Error('Failed to fetch metadata');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Initialize audio element and handle events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume / 100;
    audio.load(); // Load the audio when component mounts or streamUrl changes
    
    const handleLoadStart = () => setStreamStatus('loading');
    const handleCanPlay = () => {
      if (!isPlaying) { // Only set to ready if not already playing
        setStreamStatus('ready');
      }
    };
    const handleError = () => {
      setStreamStatus('error');
      setIsPlaying(false);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setStreamStatus('ready'); // Stream is playing, so it's ready
    };
    const handlePause = () => {
      setIsPlaying(false);
      setStreamStatus('ready'); // Stream is paused, but ready to play
    };

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
  }, [volume, config.streamUrl]); // Add config.streamUrl to dependencies

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        setStreamStatus('loading'); // Show loading state immediately
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

  const setSleepTimerMinutes = (minutes: number) => {
    if (sleepTimeoutRef.current) {
      clearTimeout(sleepTimeoutRef.current);
    }
    
    setSleepTimer(minutes);
    setShowSleepMenu(false);
    
    sleepTimeoutRef.current = setTimeout(() => {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
      }
      setSleepTimer(null);
    }, minutes * 60 * 1000);
  };

  const clearSleepTimer = () => {
    if (sleepTimeoutRef.current) {
      clearTimeout(sleepTimeoutRef.current);
      sleepTimeoutRef.current = null;
    }
    setSleepTimer(null);
  };

  const handleCast = () => {
    if (navigator.share) {
      navigator.share({
        title: `${config.name} - Deep House Radio`,
        text: `Listen to ${config.name} live stream`,
        url: config.streamUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(config.streamUrl);
      alert('Stream URL copied to clipboard for casting');
    }
  };

  const openLiveMonitor = () => {
    window.open('/live-monitor', '_blank');
  };

  // Cleanup sleep timer on unmount
  useEffect(() => {
    return () => {
      if (sleepTimeoutRef.current) {
        clearTimeout(sleepTimeoutRef.current);
      }
    };
  }, []);

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
        <div className="flex items-center gap-3 mb-4">
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

        {/* Additional Controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleCast}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm text-white transition-colors"
            title="Cast to Device"
          >
            <Cast className="h-4 w-4" />
            <span>Cast</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSleepMenu(!showSleepMenu)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white transition-colors ${
                sleepTimer ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title={sleepTimer ? `Sleep timer: ${sleepTimer}min` : 'Set sleep timer'}
            >
              <Timer className="h-4 w-4" />
              <span>{sleepTimer ? `${sleepTimer}m` : 'Sleep'}</span>
            </button>

            {showSleepMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-gray-800 rounded-lg border border-gray-600 shadow-xl p-2 min-w-32 z-50">
                <div className="text-xs text-gray-400 mb-2">Sleep Timer</div>
                {[15, 30, 60, 90].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => setSleepTimerMinutes(minutes)}
                    className="block w-full text-left px-3 py-1 text-sm text-white hover:bg-gray-700 rounded"
                  >
                    {minutes} min
                  </button>
                ))}
                {sleepTimer && (
                  <button
                    onClick={clearSleepTimer}
                    className="block w-full text-left px-3 py-1 text-sm text-red-400 hover:bg-gray-700 rounded mt-1 border-t border-gray-600 pt-2"
                  >
                    Clear Timer
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={openLiveMonitor}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm text-white transition-colors"
            title="View Track History"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Tracks</span>
          </button>
        </div>
      </div>
    </div>
  );
}