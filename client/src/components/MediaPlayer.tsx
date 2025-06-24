import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio } from 'lucide-react';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

interface MediaPlayerProps {
  streamUrl?: string;
  title?: string;
  compact?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ 
  streamUrl = 'https://streaming.shoutcast.com/dhr',
  title = 'DHR Live Stream',
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'connecting' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const handlePlay = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setConnectionStatus('idle');
      } else {
        try {
          setConnectionStatus('connecting');
          await audioRef.current.play();
          setIsPlaying(true);
          setConnectionStatus('connected');
        } catch (error) {
          console.error('Error playing audio:', error);
          setConnectionStatus('error');
        }
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-orange-400';
      case 'connecting': return 'text-orange-300';
      case 'error': return 'text-orange-600';
      case 'idle': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      case 'idle': return 'Offline';
      default: return 'Unknown';
    }
  };

  if (compact) {
    return (
      <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 border border-orange-400/20">
        <audio
          ref={audioRef}
          src={streamUrl}
          onPlay={() => {
            setIsPlaying(true);
            setConnectionStatus('connected');
          }}
          onPause={() => {
            if (!isPlaying) {
              setConnectionStatus('idle');
            }
          }}
          onError={() => {
            setConnectionStatus('error');
          }}
          crossOrigin="anonymous"
          preload="none"
          className="hidden"
        />

        <div className="flex items-center space-x-4">
          <div className="relative">
            <img 
              src={DHR_LOGO_URL} 
              alt="DHR Logo"
              className="h-12 w-12 rounded-lg shadow-lg border border-orange-400/30"
              onError={handleArtworkError}
            />
            {isPlaying && connectionStatus === 'connected' && (
              <div className="absolute inset-0 rounded-lg bg-orange-400/20 animate-pulse"></div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-white">{title}</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-orange-400 shadow-lg shadow-orange-400/50' :
                connectionStatus === 'connecting' ? 'bg-orange-400 animate-pulse shadow-lg shadow-orange-400/50' :
                connectionStatus === 'error' ? 'bg-orange-600 shadow-lg shadow-orange-600/50' :
                'bg-gray-400 shadow-lg shadow-gray-400/50'
              }`}></div>
              <span className={`text-sm ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleMute} 
              className="text-orange-300 hover:text-orange-100 transition-colors p-1"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />

            <button
              onClick={handlePlay}
              className={`w-10 h-10 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 border flex items-center justify-center ${
                connectionStatus === 'error'
                  ? 'bg-orange-600 hover:bg-orange-700 border-orange-500'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-orange-400'
              }`}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/20">
      <audio
        ref={audioRef}
        src={streamUrl}
        onPlay={() => {
          setIsPlaying(true);
          setConnectionStatus('connected');
        }}
        onPause={() => {
          if (!isPlaying) {
            setConnectionStatus('idle');
          }
        }}
        onError={() => {
          setConnectionStatus('error');
        }}
        crossOrigin="anonymous"
        preload="none"
        className="hidden"
      />

      <div className="text-center mb-6">
        <div className="relative inline-block">
          <img 
            src={DHR_LOGO_URL} 
            alt="DHR Logo"
            className="h-20 w-20 rounded-2xl shadow-2xl border-2 border-orange-400/50 mx-auto"
            onError={handleArtworkError}
          />
          {isPlaying && connectionStatus === 'connected' && (
            <div className="absolute inset-0 rounded-2xl bg-orange-400/20 animate-pulse"></div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-white mt-4">{title}</h2>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <Radio className="h-4 w-4 text-orange-400" />
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-orange-400 shadow-lg shadow-orange-400/50' :
            connectionStatus === 'connecting' ? 'bg-orange-400 animate-pulse shadow-lg shadow-orange-400/50' :
            connectionStatus === 'error' ? 'bg-orange-600 shadow-lg shadow-orange-600/50' :
            'bg-gray-400 shadow-lg shadow-gray-400/50'
          }`}></div>
          <span className={`text-sm ${getConnectionStatusColor()}`}>
            {getConnectionStatusText()}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-6 mb-6">
        <button
          onClick={handlePlay}
          className={`w-16 h-16 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200 border-2 flex items-center justify-center ${
            connectionStatus === 'error'
              ? 'bg-orange-600 hover:bg-orange-700 border-orange-500'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-orange-400'
          }`}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
        </button>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <button 
          onClick={toggleMute} 
          className="text-orange-300 hover:text-orange-100 transition-colors hover:scale-110 transform duration-200"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <span className="text-sm text-orange-300 w-10">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
};

export default MediaPlayer;