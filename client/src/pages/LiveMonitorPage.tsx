import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Music, ExternalLink, Clock, Star, Download, Refresh } from 'lucide-react';

interface IdentifiedTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  confidence: number;
  service: string;
  timestamp: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  spotifyUrl?: string;
  artwork?: string;
}

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const LiveMonitorPage: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<IdentifiedTrack | null>(null);

  // Fetch recent tracks
  const { data: recentTracks = [], refetch, isLoading } = useQuery({
    queryKey: ['recent-tracks'],
    queryFn: async (): Promise<IdentifiedTrack[]> => {
      const response = await fetch('/api/admin/track-history?limit=50');
      if (!response.ok) throw new Error('Failed to fetch tracks');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch current track
  const { data: currentTrackData } = useQuery({
    queryKey: ['current-track'],
    queryFn: async (): Promise<{ track: IdentifiedTrack | null }> => {
      const response = await fetch('/api/track-monitor/current');
      if (!response.ok) throw new Error('Failed to fetch current track');
      return response.json();
    },
    refetchInterval: 10000, // Check every 10 seconds
  });

  useEffect(() => {
    if (currentTrackData?.track) {
      setCurrentTrack(currentTrackData.track);
    }
  }, [currentTrackData]);

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getPlatformLinks = (track: IdentifiedTrack) => {
    const links = [];
    if (track.youtubeUrl) {
      links.push({ platform: 'YouTube', url: track.youtubeUrl, color: 'text-red-400' });
    }
    if (track.soundcloudUrl) {
      links.push({ platform: 'SoundCloud', url: track.soundcloudUrl, color: 'text-orange-400' });
    }
    if (track.spotifyUrl) {
      links.push({ platform: 'Spotify', url: track.spotifyUrl, color: 'text-green-400' });
    }
    return links;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <img 
              src={DHR_LOGO_URL} 
              alt="DHR Logo"
              className="h-16 w-16 rounded-2xl shadow-2xl border-2 border-orange-400/50"
              onError={handleArtworkError}
            />
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                Live Track Monitor
              </h1>
              <p className="text-lg text-gray-300">Real-Time Track Identification</p>
            </div>
          </div>
          
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <Refresh className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        {/* Current Track */}
        {currentTrack && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-orange-300">Now Identified</h2>
            <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={currentTrack.artwork || DHR_LOGO_URL}
                    alt={`${currentTrack.title} artwork`}
                    className="w-20 h-20 rounded-lg object-cover"
                    onError={handleArtworkError}
                  />
                  <div className="absolute inset-0 rounded-lg border-2 border-orange-400/50 animate-pulse" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{currentTrack.title}</h3>
                  <p className="text-orange-200 text-lg mb-2">{currentTrack.artist}</p>
                  {currentTrack.album && (
                    <p className="text-gray-400 text-sm mb-2">{currentTrack.album}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`font-semibold ${getConfidenceColor(currentTrack.confidence)}`}>
                      {currentTrack.confidence}% confidence
                    </span>
                    <span className="text-gray-400">via {currentTrack.service}</span>
                    <span className="text-gray-500">{formatTime(currentTrack.timestamp)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {getPlatformLinks(currentTrack).map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors ${link.color}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-sm">{link.platform}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent Tracks */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-orange-300">
            Recent Tracks ({recentTracks.length})
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading tracks...</p>
            </div>
          ) : recentTracks.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No tracks identified yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {recentTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-gray-800/40 backdrop-blur-xl rounded-xl p-4 border border-gray-700 hover:border-orange-400/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={track.artwork || DHR_LOGO_URL}
                      alt={`${track.title} artwork`}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={handleArtworkError}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{track.title}</h3>
                      <p className="text-orange-200 text-sm truncate">{track.artist}</p>
                      {track.album && (
                        <p className="text-gray-500 text-xs truncate">{track.album}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className={`font-semibold ${getConfidenceColor(track.confidence)}`}>
                        {track.confidence}%
                      </span>
                      <span className="text-gray-500">{track.service}</span>
                      <span className="text-gray-500">{formatTime(track.timestamp)}</span>
                    </div>

                    <div className="flex gap-1">
                      {getPlatformLinks(track).map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors ${link.color}`}
                          title={`Open on ${link.platform}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LiveMonitorPage;