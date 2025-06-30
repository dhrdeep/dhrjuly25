import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Music, Clock, Play, Users, Zap, RefreshCw, Power, Square } from 'lucide-react';

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
  releaseDate?: string;
}

interface StreamData {
  track: IdentifiedTrack | null;
  isActive: boolean;
}

interface RecentTracksData {
  tracks: IdentifiedTrack[];
  isActive: boolean;
}

export default function BirdyPage() {
  const queryClient = useQueryClient();
  
  // Fetch current track
  const { data: currentData, isLoading: currentLoading } = useQuery<StreamData>({
    queryKey: ['track-monitor-current'],
    queryFn: async () => {
      const response = await fetch('/api/track-monitor/current');
      if (!response.ok) throw new Error('Failed to fetch current track');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch recent tracks
  const { data: recentData, isLoading: recentLoading } = useQuery<RecentTracksData>({
    queryKey: ['track-monitor-recent'],
    queryFn: async () => {
      const response = await fetch('/api/track-monitor/recent');
      if (!response.ok) throw new Error('Failed to fetch recent tracks');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const startMonitoring = async () => {
    try {
      const response = await fetch('/api/track-monitor/start', { method: 'POST' });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['track-monitor-current'] });
        queryClient.invalidateQueries({ queryKey: ['track-monitor-recent'] });
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const stopMonitoring = async () => {
    try {
      const response = await fetch('/api/track-monitor/stop', { method: 'POST' });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['track-monitor-current'] });
        queryClient.invalidateQueries({ queryKey: ['track-monitor-recent'] });
      }
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
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

  const isMonitoringActive = currentData?.isActive || recentData?.isActive || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-4 text-orange-400">Live Track Identification</h1>
          <p className="text-gray-300 mb-6">Real-time track identification from DHR stream using ACRCloud</p>
          
          {/* Control Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={startMonitoring}
              disabled={isMonitoringActive}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isMonitoringActive 
                  ? 'bg-green-600 text-white cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {isMonitoringActive ? <Zap className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {isMonitoringActive ? 'Monitoring Active' : 'Start Monitoring'}
            </button>
            
            <button
              onClick={stopMonitoring}
              disabled={!isMonitoringActive}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                !isMonitoringActive 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Square className="h-5 w-5" />
              Stop Monitoring
            </button>
          </div>

          {/* Status Indicator */}
          <div className="flex justify-center items-center gap-2 mb-8">
            <div className={`w-3 h-3 rounded-full ${isMonitoringActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-400">
              {isMonitoringActive ? 'Live monitoring DHR stream' : 'Monitoring stopped'}
            </span>
          </div>
        </div>

        {/* Current Track */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Music className="h-6 w-6 text-orange-400" />
            <h2 className="text-2xl font-bold">Now Playing</h2>
          </div>

          {currentLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : currentData?.track ? (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{currentData.track.title}</h3>
                  <p className="text-lg text-orange-400 mb-2">{currentData.track.artist}</p>
                  {currentData.track.album && (
                    <p className="text-sm text-gray-400 mb-2">{currentData.track.album}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(currentData.track.timestamp)}
                    </span>
                    <span>{formatDuration(currentData.track.duration)}</span>
                    <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs">
                      {currentData.track.confidence}% confidence
                    </span>
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      {currentData.track.service}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No track currently identified</p>
              <p className="text-sm">
                {isMonitoringActive ? 'Listening for tracks...' : 'Start monitoring to identify tracks'}
              </p>
            </div>
          )}
        </div>

        {/* Recent Tracks */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-orange-400" />
            <h2 className="text-2xl font-bold">Recently Identified</h2>
            <span className="text-sm text-gray-400 ml-auto">
              {recentData?.tracks?.length || 0} tracks
            </span>
          </div>

          {recentLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : recentData?.tracks && recentData.tracks.length > 0 ? (
            <div className="space-y-3">
              {recentData.tracks.map((track) => (
                <div key={track.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{track.title}</h4>
                      <p className="text-orange-400 mb-1">{track.artist}</p>
                      {track.album && (
                        <p className="text-sm text-gray-400 mb-2">{track.album}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(track.timestamp)}
                        </span>
                        {track.duration && (
                          <span>{formatDuration(track.duration)}</span>
                        )}
                        <span className="bg-orange-600 text-white px-2 py-1 rounded">
                          {track.confidence}%
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
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tracks identified yet</p>
              <p className="text-sm">
                {isMonitoringActive ? 'Monitoring will show identified tracks here' : 'Start monitoring to see track history'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by ACRCloud • Monitoring DHR Stream • Updates every 30 seconds</p>
        </div>
      </div>
    </div>
  );
}