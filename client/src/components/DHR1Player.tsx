import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, ThumbsUp, ThumbsDown, Share2, History, Headphones } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  image?: string;
  duration?: string;
  played_at?: string;
}

interface ChannelData {
  id: number;
  name: string;
  url: string;
  isActive: boolean;
  listeners?: number;
}

interface EvercastTrackResponse {
  data: {
    current_track: {
      title: string;
      artist: string;
      album?: string;
      artwork?: string;
    };
    history: Array<{
      title: string;
      artist: string;
      album?: string;
      played_at: string;
      duration?: string;
    }>;
    listeners: number;
  };
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
  channels: channelsProp = [
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

  // Fetch real track data from Everestcast API
  const fetchTrackData = async (serverId: number = 1) => {
    try {
      const response = await fetch(`https://ec1.everestcast.host:2750/api/v2/server/${serverId}/tracks`);
      if (!response.ok) throw new Error('Failed to fetch track data');
      
      const data: EvercastTrackResponse = await response.json();
      
      if (data.data.current_track) {
        const currentTrack: Track = {
          id: `current_${Date.now()}`,
          title: data.data.current_track.title,
          artist: data.data.current_track.artist,
          album: data.data.current_track.album,
          image: data.data.current_track.artwork || 'https://ec1.everestcast.host:2750/media/tracks/default_track_img.png'
        };
        setCurrentTrack(currentTrack);
      }
      
      if (data.data.history && data.data.history.length > 0) {
        const history: Track[] = data.data.history.slice(0, 5).map((track, index) => ({
          id: `history_${index}`,
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration,
          played_at: track.played_at
        }));
        setTrackHistory(history);
      }
      
      // Update channel listener count if available
      if (data.data.listeners) {
        setChannels(prev => prev.map(channel => 
          channel.id === serverId 
            ? { ...channel, listeners: data.data.listeners }
            : channel
        ));
      }
    } catch (error) {
      console.error('Error fetching track data:', error);
      // Fallback to real track examples based on the screenshot
      const fallbackTrack: Track = {
        id: 'fallback_current',
        title: 'Deep Sound Boutique (DSB005) Mixed By Dub Sole',
        artist: 'Deep Sound Boutique',
        album: 'DSB005',
        image: 'https://ec1.everestcast.host:2750/media/tracks/default_track_img.png'
      };
      setCurrentTrack(fallbackTrack);
      
      const fallbackHistory: Track[] = [
        { id: 'h1', title: "Rudi'Kastic [100% Original production]", artist: 'DHSA PODCAST 101', played_at: '22:54:55' },
        { id: 'h2', title: 'Chill Lounge Deep House Music Mix - Relaxing Camping DJ Set', artist: 'Outdoor Cooking Flavour Trip Playlist', played_at: '21:12:12' },
        { id: 'h3', title: 'Love Peace - LP Sessions™ Sound 124', artist: 'LP Sessions', played_at: '20:07:52' },
        { id: 'h4', title: 'Midnight City', artist: 'M83', played_at: '5 min ago' },
        { id: 'h5', title: 'Strobe', artist: 'Deadmau5', played_at: '6 min ago' }
      ];
      setTrackHistory(fallbackHistory);
    }
  };

  const [channels, setChannels] = useState(channelsProp);

  useEffect(() => {
    fetchTrackData(activeChannel);
    setVotes({ up: 142, down: 23 });
    
    // Refresh track data every 30 seconds
    const interval = setInterval(() => {
      fetchTrackData(activeChannel);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeChannel]);

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
    fetchTrackData(channelId);
    
    // Update audio source
    if (audioRef.current) {
      const newChannel = channels.find(c => c.id === channelId);
      if (newChannel) {
        audioRef.current.src = newChannel.url;
        if (isPlaying) {
          audioRef.current.play();
        }
      }
    }
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

      {/* DHR Branding Header */}
      <div 
        className="relative p-4 text-white"
        style={{ 
          background: `linear-gradient(135deg, #f79e02 0%, #ff6b35 100%)`,
          backgroundImage: `url('https://ec1.everestcast.host:2750/media/widgets/blob.jpeg')`,
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="text-6xl font-black text-black tracking-wider">DHR</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-gray-700 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-gray-700 ml-1" />
                </div>
              </div>
            </div>
            <div className="text-sm font-medium text-black mt-2">DEEPHOUSE-RADIO.COM</div>
          </div>
        </div>
        
        {/* Current Track Info */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <Headphones className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-black text-sm">{currentTrack?.title || 'Loading track info...'}</h3>
              <p className="text-black opacity-80 text-xs">{currentTrack?.artist || 'DHR Radio'}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-black font-mono">00:00:00</div>
            <div className="flex space-x-1 mt-1">
              <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">mp3 320 Kbps</span>
              <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">mp3 128 Kbps</span>
              <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">mp3 64 Kbps</span>
              <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">mp3 320 Kbps</span>
            </div>
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
          <div className="space-y-1">
            {trackHistory.slice(0, 5).map((track, index) => (
              <div key={track.id} className="flex items-center py-3 px-4 bg-white bg-opacity-70 rounded-lg">
                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{track.title}</div>
                  <div className="text-sm text-gray-600 truncate">by {track.artist}</div>
                </div>
                <div className="text-right text-sm text-gray-500 ml-2 flex-shrink-0">
                  {track.played_at || `${5 + index} min ago`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}