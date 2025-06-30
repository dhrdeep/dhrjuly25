import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Music, Clock, ExternalLink, Youtube } from 'lucide-react';
import { SiSoundcloud, SiSpotify } from 'react-icons/si';

interface IdentifiedTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  confidence: number;
  service: string;
  timestamp: Date;
  duration?: number;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  spotifyUrl?: string;
}

interface StreamData {
  track: IdentifiedTrack | null;
  isActive: boolean;
}

interface LiveTrackWidgetProps {
  className?: string;
  compact?: boolean;
  channel?: 'dhr1' | 'dhr2';
}

export default function LiveTrackWidget({ className = '', compact = false, channel = 'dhr1' }: LiveTrackWidgetProps) {
  // Fetch current track from live monitoring
  const { data: currentData, isLoading } = useQuery<StreamData>({
    queryKey: ['track-monitor-current'],
    queryFn: async () => {
      const response = await fetch('/api/track-monitor/current');
      if (!response.ok) throw new Error('Failed to fetch current track');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 border border-gray-700 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Music className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">Live Track ID</span>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!currentData?.track) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 border border-gray-700 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Music className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">Live Track ID</span>
          <div className={`w-2 h-2 rounded-full ${currentData?.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        </div>
        <p className="text-xs text-gray-400">
          {currentData?.isActive ? 'Listening for tracks...' : 'Monitor stopped'}
        </p>
      </div>
    );
  }

  const track = currentData.track;

  return (
    <div className={`bg-gray-800/50 rounded-lg p-4 border border-gray-700 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Music className="h-4 w-4 text-orange-400" />
        <span className="text-sm font-semibold text-white">Now Identified</span>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>

      <div className="flex items-start gap-3">
        {track.artwork && !compact && (
          <img 
            src={track.artwork} 
            alt={`${track.title} artwork`}
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm truncate">{track.title}</h4>
          <p className="text-orange-400 text-sm truncate">{track.artist}</p>
          
          {/* Streaming Links */}
          {(track.youtubeUrl || track.soundcloudUrl || track.spotifyUrl) && (
            <div className="flex items-center gap-1 mt-2">
              {track.youtubeUrl && (
                <a 
                  href={track.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-red-600 text-white px-1.5 py-0.5 rounded text-xs hover:bg-red-700"
                  title="Listen on YouTube"
                >
                  <Youtube className="h-2.5 w-2.5" />
                  {!compact && 'YT'}
                </a>
              )}
              {track.soundcloudUrl && (
                <a 
                  href={track.soundcloudUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-orange-600 text-white px-1.5 py-0.5 rounded text-xs hover:bg-orange-700"
                  title="Listen on SoundCloud"
                >
                  <SiSoundcloud className="h-2.5 w-2.5" />
                  {!compact && 'SC'}
                </a>
              )}
              {track.spotifyUrl && (
                <a 
                  href={track.spotifyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs hover:bg-green-700"
                  title="Listen on Spotify"
                >
                  <SiSpotify className="h-2.5 w-2.5" />
                  {!compact && 'SP'}
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(track.timestamp)}
            </span>
            <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded">
              {track.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Link to full history */}
      <div className="mt-3 pt-2 border-t border-gray-700">
        <a 
          href="/birdy" 
          className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          View Live Monitor
        </a>
      </div>
    </div>
  );
}