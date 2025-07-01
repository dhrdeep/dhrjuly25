import React, { useState } from 'react';
import { Star, Play, Download, Zap, Clock, Users } from 'lucide-react';
import MediaPlayer from '../components/MediaPlayer';
import SubscriptionGate from '../components/SubscriptionGate';
import LiveTrackWidget from '../components/LiveTrackWidget';
import TrackWidget from '../components/TrackWidget';
import ReliableStreamPlayer from '../components/ReliableStreamPlayer';

import { subscriptionService } from '../services/subscriptionService';
import AmbientMoodGenerator from '../components/AmbientMoodGenerator';
import { useCurrentTrack } from '../hooks/useCurrentTrack';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const DHR2Page: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { currentTrack } = useCurrentTrack('https://ec1.everestcast.host:1480/api/v2/current', isPlaying);
  const canAccess = subscriptionService.canAccessContent('dhr2');
  const canDownload = subscriptionService.canDownload();
  const currentUser = subscriptionService.getCurrentUser();

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const features = [
    {
      icon: Zap,
      title: 'Exclusive DJ Sets',
      description: 'Live and recorded sets from world-renowned deep house DJs'
    },
    {
      icon: Clock,
      title: 'Extended Mixes',
      description: 'Longer format tracks and continuous DJ mixes'
    },
    {
      icon: Users,
      title: 'Artist Spotlights',
      description: 'Featured artist showcases and exclusive interviews'
    },
    {
      icon: Download,
      title: 'Premium Downloads',
      description: canDownload ? 'High-quality downloads of exclusive content' : 'Available with subscription'
    }
  ];

  const featuredSets = [
    {
      title: 'Sunset Sessions Vol. 12',
      artist: 'DJ Solomun',
      duration: '2h 15m',
      listeners: '12.5K',
      artwork: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      title: 'Deep Underground',
      artist: 'Maceo Plex',
      duration: '1h 45m',
      listeners: '8.2K',
      artwork: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      title: 'Melodic Journeys',
      artist: 'Lane 8',
      duration: '3h 20m',
      listeners: '15.7K',
      artwork: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300'
    }
  ];

  const handleDownload = (setTitle: string) => {
    if (!canDownload) {
      alert('Download feature requires a premium subscription. Please upgrade to access downloads.');
      return;
    }
    console.log(`Downloading: ${setTitle}`);
    alert(`Starting download: ${setTitle}`);
  };

  return (
    <>
      <SubscriptionGate requiredTier="dhr2" contentType="dhr2">
        <div className="min-h-screen text-white py-8 px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="relative">
                <img 
                  src={DHR_LOGO_URL} 
                  alt="DHR Logo"
                  className="h-20 w-20 rounded-2xl shadow-2xl border-2 border-orange-400/50"
                  onError={handleArtworkError}
                />
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full p-2">
                  <Star className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
                  DHR2 Premium
                </h1>
                <p className="text-xl text-gray-300 mt-2">Exclusive DJ Sets & Extended Mixes</p>
                {currentUser && (
                  <p className="text-sm text-orange-300 mt-1">
                    Welcome back, {currentUser.username}!
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500/30 to-orange-600/30 rounded-2xl p-6 border border-orange-400/40 backdrop-blur-xl max-w-2xl mx-auto shadow-2xl">
              <p className="text-lg text-gray-200 leading-relaxed">
                Dive deeper into the world of deep house with DHR2. Featuring exclusive DJ sets, 
                extended mixes, and artist spotlights from the biggest names in electronic music.
              </p>
            </div>
          </header>

          {/* Premium Player and Live Track */}
          <section className="mb-12">
            <div className="flex justify-center gap-6">
              <ReliableStreamPlayer channel="dhr2" className="w-full max-w-lg" />
              
              {/* Live Track Identification & Recent Tracks */}
              <div className="w-80 space-y-4">
                <LiveTrackWidget className="sticky top-4" channel="dhr2" />
                <TrackWidget channel="dhr2" className="sticky top-4" />
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent drop-shadow-lg">
              Exclusive Features
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isDownloadFeature = feature.icon === Download;
                return (
                  <div
                    key={index}
                    className={`bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-200 group shadow-2xl hover:shadow-3xl ${
                      isDownloadFeature && !canDownload 
                        ? 'border-gray-600/50 opacity-60' 
                        : 'border-orange-400/40 hover:border-orange-400/70 hover:bg-gray-800/80'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
                      isDownloadFeature && !canDownload
                        ? 'bg-gray-600'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Featured DJ Sets */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
              Featured DJ Sets
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSets.map((set, index) => (
                <div
                  key={index}
                  className="bg-gray-800/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-orange-400/20 hover:border-orange-400/40 transition-all duration-200 group"
                >
                  <div className="relative">
                    <img 
                      src={set.artwork} 
                      alt={`${set.title} artwork`}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={handleArtworkError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-orange-500/80 hover:bg-orange-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm">
                      <Play className="h-6 w-6 text-white ml-1" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
                      {set.title}
                    </h3>
                    <p className="text-orange-200 mb-3">{set.artist}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{set.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{set.listeners}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownload(set.title)}
                        className={`p-2 rounded-full transition-all duration-200 ${
                          canDownload 
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300' 
                            : 'bg-gray-600/50 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!canDownload}
                        title={canDownload ? 'Download set' : 'Premium subscription required'}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Google Ads Placeholder */}
          <section className="mb-12">
            <div className="bg-gray-800/20 border border-orange-400/10 rounded-2xl p-8 text-center">
              <div className="text-gray-500 text-sm mb-2">Advertisement</div>
              <div className="h-32 bg-gray-700/20 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Google Ads Space - DJ Sets & Mixes</span>
              </div>
            </div>
          </section>

          {/* Subscription CTA */}
          {!canAccess && (
            <section className="text-center">
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-3xl p-12 border border-orange-400/30 backdrop-blur-sm">
                <Star className="h-16 w-16 text-amber-400 mx-auto mb-6" />
                <h2 className="text-4xl font-bold mb-6 text-white">
                  Access Exclusive Content
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Unlock DHR2 Premium for exclusive DJ sets, extended mixes, and behind-the-scenes 
                  content from your favorite deep house artists.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <a
                    href="https://www.patreon.com/c/deephouseradio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Star className="h-6 w-6" />
                    <span>Get Premium Access</span>
                  </a>
                  <button className="flex items-center space-x-3 bg-gray-800/60 hover:bg-gray-700/60 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200 border border-orange-400/30">
                    <Play className="h-6 w-6 text-orange-400" />
                    <span>Preview Sets</span>
                  </button>
                </div>
              </div>
            </section>
          )}
          </div>
        </div>
      </SubscriptionGate>
    </>
  );
};

export default DHR2Page;