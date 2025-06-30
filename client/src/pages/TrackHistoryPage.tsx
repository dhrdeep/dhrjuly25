import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Music, Clock, Trash2, RefreshCw, Download, ExternalLink, Youtube } from 'lucide-react';
import { SiSoundcloud, SiSpotify } from 'react-icons/si';

interface IdentifiedTrack {
  id: number;
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  confidence: number;
  service: string;
  duration?: number;
  releaseDate?: string;
  artwork?: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  spotifyUrl?: string;
  identifiedAt: string;
  createdAt: string;
}

export default function TrackHistoryPage() {
  const queryClient = useQueryClient();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Fetch track history
  const { data: tracks, isLoading } = useQuery<IdentifiedTrack[]>({
    queryKey: ['admin-track-history'],
    queryFn: async () => {
      const response = await fetch('/api/admin/track-history');
      if (!response.ok) throw new Error('Failed to fetch track history');
      return response.json();
    },
  });

  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/admin/track-history', {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-track-history'] });
      setShowConfirmClear(false);
    },
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadCSV = () => {
    if (!tracks || tracks.length === 0) return;

    const headers = [
      'Identified At',
      'Title',
      'Artist',
      'Album',
      'Confidence %',
      'Service',
      'Duration',
      'Release Date',
      'YouTube URL',
      'SoundCloud URL',
      'Spotify URL'
    ];

    const csvContent = [
      headers.join(','),
      ...tracks.map(track => [
        track.identifiedAt,
        `"${track.title}"`,
        `"${track.artist}"`,
        `"${track.album || ''}"`,
        track.confidence,
        track.service,
        track.duration || '',
        track.releaseDate || '',
        track.youtubeUrl || '',
        track.soundcloudUrl || '',
        track.spotifyUrl || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhr-track-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-4 text-orange-400">Track Identification History</h1>
          <p className="text-gray-300 mb-6">Complete history of all identified tracks from DHR stream monitoring</p>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={downloadCSV}
              disabled={!tracks || tracks.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
            >
              <Download className="h-5 w-5" />
              Export CSV
            </button>
            
            <button
              onClick={() => setShowConfirmClear(true)}
              disabled={!tracks || tracks.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
            >
              <Trash2 className="h-5 w-5" />
              Clear History
            </button>
          </div>

          {/* Statistics */}
          {tracks && tracks.length > 0 && (
            <div className="flex justify-center gap-6 text-sm text-gray-400 mb-8">
              <span>Total Tracks: {tracks.length}</span>
              <span>Unique Artists: {new Set(tracks.map(t => t.artist)).size}</span>
              <span>Date Range: {formatTime(tracks[tracks.length - 1].identifiedAt)} - {formatTime(tracks[0].identifiedAt)}</span>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmClear && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md">
              <h3 className="text-lg font-bold text-white mb-4">Clear Track History?</h3>
              <p className="text-gray-300 mb-6">
                This will permanently delete all {tracks?.length || 0} identified tracks from the database. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => clearHistoryMutation.mutate()}
                  disabled={clearHistoryMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg"
                >
                  {clearHistoryMutation.isPending ? 'Clearing...' : 'Delete All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Track History */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Music className="h-6 w-6 text-orange-400" />
            <h2 className="text-2xl font-bold">Identification History</h2>
            <span className="text-sm text-gray-400 ml-auto">
              {tracks?.length || 0} tracks identified
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : tracks && tracks.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tracks.map((track) => (
                <div key={track.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                  <div className="flex items-start gap-4">
                    {track.artwork && (
                      <img 
                        src={track.artwork} 
                        alt={`${track.title} artwork`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{track.title}</h4>
                      <p className="text-orange-400 mb-1">{track.artist}</p>
                      {track.album && (
                        <p className="text-sm text-gray-400 mb-2">{track.album}</p>
                      )}
                      
                      {/* Streaming Links */}
                      {(track.youtubeUrl || track.soundcloudUrl || track.spotifyUrl) && (
                        <div className="flex items-center gap-1 mb-2">
                          {track.youtubeUrl && (
                            <a 
                              href={track.youtubeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-red-600 text-white px-1.5 py-0.5 rounded text-xs hover:bg-red-700"
                            >
                              <Youtube className="h-2.5 w-2.5" />
                              YouTube
                            </a>
                          )}
                          {track.soundcloudUrl && (
                            <a 
                              href={track.soundcloudUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-orange-600 text-white px-1.5 py-0.5 rounded text-xs hover:bg-orange-700"
                            >
                              <SiSoundcloud className="h-2.5 w-2.5" />
                              SoundCloud
                            </a>
                          )}
                          {track.spotifyUrl && (
                            <a 
                              href={track.spotifyUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs hover:bg-green-700"
                            >
                              <SiSpotify className="h-2.5 w-2.5" />
                              Spotify
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(track.identifiedAt)}
                        </span>
                        {track.duration && (
                          <span>{formatDuration(track.duration)}</span>
                        )}
                        <span className="bg-orange-600 text-white px-2 py-1 rounded">
                          {track.confidence}% confidence
                        </span>
                        <span className="bg-blue-600 text-white px-2 py-1 rounded">
                          {track.service}
                        </span>
                        {track.releaseDate && (
                          <span>{track.releaseDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tracks identified yet</p>
              <p className="text-sm">Track identification history will appear here as songs are detected from the DHR stream</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Track identification powered by ACRCloud • Monitoring every 2 minutes • Data permanently stored</p>
        </div>
      </div>
    </div>
  );
}