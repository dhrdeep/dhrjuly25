import React, { useState, useEffect } from 'react';
import { Music, ExternalLink, Play, Youtube, Volume2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Track {
  id: number;
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  channel: 'dhr1' | 'dhr2';
  confidence: number;
  service: string;
  duration?: number;
  artwork?: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  spotifyUrl?: string;
  identifiedAt: string;
}

interface TrackWidgetProps {
  channel: 'dhr1' | 'dhr2';
  className?: string;
}

export default function TrackWidget({ channel, className = '' }: TrackWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);

  // Fetch last 10 tracks for this channel
  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ['recent-tracks', channel],
    queryFn: async () => {
      const response = await fetch(`/api/tracks/recent?channel=${channel}`);
      if (!response.ok) throw new Error('Failed to fetch recent tracks');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Content crawling for track recommendations
  const crawlRecommendations = async (track: Track) => {
    try {
      const response = await fetch('/api/tracks/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: track.artist,
          title: track.title,
          channel: track.channel
        })
      });
      
      if (response.ok) {
        const recommendations = await response.json();
        setRecommendedTracks(recommendations);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IE', {
      timeZone: 'Europe/Dublin',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChannelColor = (channel: string) => {
    return channel === 'dhr1' ? 'text-orange-400' : 'text-amber-400';
  };

  const getChannelBorder = (channel: string) => {
    return channel === 'dhr1' ? 'border-orange-400/20' : 'border-amber-400/20';
  };

  const openExternalLink = (url: string, platform: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`bg-black/40 backdrop-blur-xl rounded-2xl border ${getChannelBorder(channel)} ${className}`}>
      {/* Widget Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors rounded-t-2xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <Music className={`w-5 h-5 ${getChannelColor(channel)}`} />
          <h3 className={`font-bold text-lg ${getChannelColor(channel)}`}>
            {channel.toUpperCase()} Recent Tracks
          </h3>
          <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-full">
            {(tracks as Track[]).length || 0}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isExpanded && (tracks as Track[]).length > 0 && (
            <div className="text-white/60 text-sm">
              Latest: {(tracks as Track[])[0]?.title.substring(0, 20)}...
            </div>
          )}
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Widget Content */}
      {isExpanded && (
        <div className="border-t border-white/10">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-white/60">Loading tracks...</p>
            </div>
          ) : (tracks as Track[]).length === 0 ? (
            <div className="p-6 text-center text-white/60">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No tracks identified yet</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {(tracks as Track[]).map((track: Track, index: number) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      {track.artwork ? (
                        <img
                          src={track.artwork}
                          alt={track.title}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                          <Music className="w-5 h-5 text-white/60" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate text-sm">
                          {track.title}
                        </h4>
                        <p className="text-white/60 truncate text-xs">
                          {track.artist}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-white/40 mt-1">
                          <span>{formatTime(track.identifiedAt)}</span>
                          <span>•</span>
                          <span>{track.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Streaming Platform Links */}
                  <div className="flex items-center space-x-1 ml-3">
                    {track.youtubeUrl && (
                      <button
                        onClick={() => openExternalLink(track.youtubeUrl!, 'YouTube')}
                        className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
                        title="Listen on YouTube"
                      >
                        <Youtube className="w-4 h-4" />
                      </button>
                    )}
                    
                    {track.soundcloudUrl && (
                      <button
                        onClick={() => openExternalLink(track.soundcloudUrl!, 'SoundCloud')}
                        className="p-2 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 transition-colors"
                        title="Listen on SoundCloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {track.spotifyUrl && (
                      <button
                        onClick={() => openExternalLink(track.spotifyUrl!, 'Spotify')}
                        className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors"
                        title="Listen on Spotify"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}

                    {/* Recommendations Button */}
                    <button
                      onClick={() => crawlRecommendations(track)}
                      className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 transition-colors"
                      title="Find Similar Tracks"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Tracks Button */}
          {(tracks as Track[]).length > 0 && (
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => window.open('/track-history', '_blank')}
                className={`w-full py-2 px-4 rounded-lg bg-gradient-to-r ${
                  channel === 'dhr1' 
                    ? 'from-orange-500/20 to-orange-600/20 text-orange-400 hover:from-orange-500/30 hover:to-orange-600/30' 
                    : 'from-amber-500/20 to-amber-600/20 text-amber-400 hover:from-amber-500/30 hover:to-amber-600/30'
                } border border-current/20 hover:border-current/30 transition-all`}
              >
                View Full Track History
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recommended Tracks Section */}
      {recommendedTracks.length > 0 && (
        <div className="border-t border-white/10 p-4">
          <h4 className="text-white/80 font-semibold mb-3 text-sm">Recommended Similar Tracks</h4>
          <div className="space-y-2">
            {recommendedTracks.slice(0, 3).map((track, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{track.title}</p>
                  <p className="text-white/60 text-xs truncate">{track.artist}</p>
                </div>
                <div className="flex space-x-1">
                  {track.youtubeUrl && (
                    <button
                      onClick={() => openExternalLink(track.youtubeUrl!, 'YouTube')}
                      className="p-1 rounded bg-red-600/20 text-red-400"
                    >
                      <Youtube className="w-3 h-3" />
                    </button>
                  )}
                  {track.soundcloudUrl && (
                    <button
                      onClick={() => openExternalLink(track.soundcloudUrl!, 'SoundCloud')}
                      className="p-1 rounded bg-orange-600/20 text-orange-400"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}