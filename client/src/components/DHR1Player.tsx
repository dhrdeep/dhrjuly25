import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, ThumbsUp, ThumbsDown, Share2, History, Headphones } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  image?: string;
  duration?: number;
}

interface ChannelData {
  id: number;
  name: string;
  url: string;
  isActive: boolean;
  listeners?: number;
}

interface DHR1PlayerProps {
  width?: string;
  showHistory?: boolean;
  showVote?: boolean;
  showShare?: boolean;
  showProgress?: boolean;
  channels?: ChannelData[];
  className?: string;
}

export default function DHR1Player({
  width = "1000px",
  showHistory = true,
  showVote = true,
  showShare = false,
  showProgress = true,
  channels = [
    { id: 1, name: "DHR1 Deep", url: "https://ec1.everestcast.host:2750/stream/1", isActive: true, listeners: 234 },
    { id: 2, name: "DHR1 Tech", url: "https://ec1.everestcast.host:2750/stream/2", isActive: false, listeners: 187 },
    { id: 3, name: "DHR1 Minimal", url: "https://ec1.everestcast.host:2750/stream/3", isActive: false, listeners: 156 },
    { id: 4, name: "DHR1 Progressive", url: "https://ec1.everestcast.host:2750/stream/4", isActive: false, listeners: 98 }
  ],
  className = ""
}: DHR1PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [activeChannel, setActiveChannel] = useState(1);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [trackHistory, setTrackHistory] = useState<Track[]>([]);
  const [votes, setVotes] = useState({ up: 0, down: 0 });
  const [hasVoted, setHasVoted] = useState<'up' | 'down' | null>(null);
  const [progress, setProgress] = useState(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(50).fill(0));
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const visualizerRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Initialize with demo track data
  useEffect(() => {
    const demoTrack: Track = {
      id: '1',
      title: 'Deep Resonance',
      artist: 'Laurent Garnier',
      album: 'Tales of a Kleptomaniac',
      image: 'https://ec1.everestcast.host:2750/media/tracks/default_track_img.png'
    };
    setCurrentTrack(demoTrack);
    
    const demoHistory: Track[] = [
      { id: '2', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming' },
      { id: '3', title: 'Strobe', artist: 'Deadmau5', album: 'For Lack of a Better Name' },
      { id: '4', title: 'One More Time', artist: 'Daft Punk', album: 'Discovery' },
      { id: '5', title: 'Windowlicker', artist: 'Aphex Twin', album: 'Windowlicker' },
      { id: '6', title: 'Born Slippy', artist: 'Underworld', album: 'Born Slippy' }
    ];
    setTrackHistory(demoHistory);
    setVotes({ up: 142, down: 23 });
  }, []);

  // Audio controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const switchChannel = (channelId: number) => {
    setActiveChannel(channelId);
    // In a real implementation, this would switch the audio source
    console.log(`Switching to channel ${channelId}`);
  };

  const handleVote = (type: 'up' | 'down') => {
    if (hasVoted) return;
    
    setHasVoted(type);
    setVotes(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  };

  // Visualizer animation
  useEffect(() => {
    const animate = () => {
      if (isPlaying) {
        setVisualizerData(prev => 
          prev.map(() => Math.random() * (0.3 + Math.random() * 0.7))
        );
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (isPlaying) {
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Progress simulation
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress(prev => (prev + 0.1) % 100);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <div 
      className={`bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800 ${className}`}
      style={{ width, maxWidth: '100%' }}
    >
      {/* Audio element */}
      <audio 
        ref={audioRef}
        src={channels.find(c => c.id === activeChannel)?.url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onVolumeChange={(e) => setVolume((e.target as HTMLAudioElement).volume)}
      />

      {/* Current Track Display */}
      <div 
        className="relative p-6 text-white"
        style={{ 
          background: `linear-gradient(135deg, #f79e02 0%, #ff6b35 100%)`,
          backgroundImage: `url('https://ec1.everestcast.host:2750/media/widgets/blob.jpeg')`,
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {currentTrack?.image ? (
              <img 
                src={currentTrack.image} 
                alt="Track artwork"
                className="w-16 h-16 rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                <Headphones className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">{currentTrack?.title || 'Loading...'}</h3>
              <p className="text-orange-200">{currentTrack?.artist || 'DHR Radio'}</p>
              <p className="text-sm text-orange-300">{currentTrack?.album}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Live</span>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Visualizer */}
      <div className="h-16 bg-gray-900 flex items-end justify-center space-x-1 px-4">
        {visualizerData.map((height, index) => (
          <div
            key={index}
            className="bg-gradient-to-t from-orange-500 to-orange-300 transition-all duration-75"
            style={{
              width: '1px',
              height: `${height * 60}px`,
              opacity: isPlaying ? 1 : 0.3
            }}
          />
        ))}
      </div>

      {/* Controls Container */}
      <div className="bg-black p-6">
        {/* Main Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="w-14 h-14 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 text-white hover:text-orange-400 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-orange"
              />
            </div>
          </div>

          {/* Vote Buttons */}
          {showVote && (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleVote('up')}
                disabled={hasVoted !== null}
                className={`p-2 rounded-lg transition-colors ${
                  hasVoted === 'up' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-400 hover:text-green-400 hover:bg-gray-800'
                } ${hasVoted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <ThumbsUp className="w-5 h-5" />
              </button>
              <span className="text-white font-medium">{votes.up}</span>
              
              <button
                onClick={() => handleVote('down')}
                disabled={hasVoted !== null}
                className={`p-2 rounded-lg transition-colors ${
                  hasVoted === 'down' 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-400 hover:text-red-400 hover:bg-gray-800'
                } ${hasVoted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <ThumbsDown className="w-5 h-5" />
              </button>
              <span className="text-white font-medium">{votes.down}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mb-6">
            <div 
              className="w-full rounded-full border border-gray-600"
              style={{ 
                height: '25px',
                backgroundColor: 'rgba(65, 184, 131, 0.1)',
                borderRadius: '10px'
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progress}%`,
                  backgroundColor: '#35495e',
                  borderRadius: '10px'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {Math.floor(progress)}% played
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Channel Switcher */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => switchChannel(channel.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeChannel === channel.id
                    ? 'bg-gray-300 text-black'
                    : 'bg-orange-400 text-white hover:bg-orange-500'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm">{channel.name}</span>
                  <span className="text-xs opacity-75">{channel.listeners} listeners</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Share Button */}
        {showShare && (
          <div className="mb-6">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        )}
      </div>

      {/* History Container */}
      {showHistory && (
        <div 
          className="p-4 border-t border-gray-700"
          style={{ 
            backgroundColor: '#cdd8e5',
            color: '#000'
          }}
        >
          <div className="flex items-center space-x-2 mb-3">
            <History className="w-5 h-5" />
            <h4 className="font-semibold">Recently Played</h4>
          </div>
          <div className="space-y-2">
            {trackHistory.slice(0, 5).map((track, index) => (
              <div key={track.id} className="flex items-center justify-between py-2 px-3 bg-white bg-opacity-50 rounded-lg">
                <div>
                  <span className="font-medium">{track.title}</span>
                  <span className="text-gray-600 ml-2">by {track.artist}</span>
                </div>
                <span className="text-sm text-gray-500">{5 + index} min ago</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}