import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentTrack } from '../hooks/useCurrentTrack';
import { 
  Play, 
  Headphones, 
  Crown, 
  Users, 
  Radio, 
  Star,
  Music,
  Zap,
  Globe,
  TrendingUp,
  Heart,
  Coffee,
  Upload,
  Share2,
  Twitter,
  Facebook,
  Instagram,
  Apple,
  Play as PlayStore,
  ExternalLink,
  Waves,
  Volume2,
  SkipForward,
  Timer,
  Maximize2
} from 'lucide-react';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const HomePage: React.FC = () => {
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const { currentTrack } = useCurrentTrack('https://ec1.everestcast.host:2750/api/v2/current', true);

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const slogans = [
    "The Deepest Beats On The Net!",
    "The Deeper Sound Of The Underground!",
    "We Go Deep!"
  ];

  // Rotate slogans every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSloganIndex((prev) => (prev + 1) % slogans.length);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const scrollToFreePlayer = () => {
    const playerSection = document.getElementById('free-player-section');
    if (playerSection) {
      playerSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const shareOnSocial = (platform: string) => {
    const text = encodeURIComponent('Check out DHR - The deepest beats on the net! 🎵');
    const url = encodeURIComponent(window.location.origin);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      instagram: `https://www.instagram.com/deephouseradio/`
    };
    
    window.open(urls[platform as keyof typeof urls], '_blank');
  };

  return (
    <div className="min-h-screen text-white">
      {/* Floating DHR logo animation */}
      <div className="fixed top-4 right-4 z-50 animate-pulse">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-orange-400/50">
          <Music className="h-8 w-8 text-white animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920')] bg-cover bg-center opacity-20"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-8">
            <img 
              src={DHR_LOGO_URL} 
              alt="DHR Logo"
              className="h-32 w-32 mx-auto rounded-3xl shadow-2xl border-4 border-orange-400/50 mb-6"
              onError={handleArtworkError}
            />
            <h1 className="text-7xl font-black mb-4 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
              DHR
            </h1>
            <h2 className="text-3xl font-bold text-gray-300 mb-6">
              DEEP HOUSE RADIO
            </h2>
            <p className="text-2xl font-bold text-orange-400 animate-pulse transition-all duration-1000">
              {slogans[currentSloganIndex]}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-900/80 rounded-2xl p-6 border border-orange-400/30 backdrop-blur-sm">
              <Radio className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">24/7 Deep House</h3>
              <p className="text-gray-400">Immerse Yourself In The Deepest Electronic Sounds</p>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-orange-400/30 backdrop-blur-sm">
              <Crown className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Premium Content</h3>
              <p className="text-gray-400">Exclusive DJ Sets And Underground Tracks</p>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-orange-400/30 backdrop-blur-sm">
              <Users className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Global Community</h3>
              <p className="text-gray-400">Connect With Deep House Lovers Worldwide</p>
            </div>
          </div>

          <button 
            onClick={scrollToFreePlayer}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <Play className="inline-block w-6 h-6 mr-2" />
            Enter The Deep
          </button>
        </div>
      </section>

      {/* Live Now Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-4xl font-black">LIVE NOW</h2>
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="bg-gray-900/80 rounded-2xl p-8 border border-orange-400/30 backdrop-blur-sm max-w-2xl mx-auto">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Waves className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">
                  {currentTrack?.artist || 'DHR Live'}
                </h3>
                <p className="text-gray-400">
                  "{currentTrack?.title || 'Loading Live Track Info...'}"
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="h-1 bg-gray-700 rounded-full flex-1">
                    <div className="h-1 bg-orange-400 rounded-full w-2/3 animate-pulse"></div>
                  </div>
                  <span className="text-xs text-gray-500">128kbps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Media Player Section */}
      <section id="free-player-section" className="py-16 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Free Media Player</h2>
            <p className="text-xl text-gray-400">Experience DHR's Deep House Stream</p>
          </div>

          <div className="bg-black/50 rounded-3xl p-8 border border-orange-400/30 backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Music className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">DHR Free Stream</h3>
              <p className="text-gray-400 mb-6">128kbps • With Ads</p>
              
              <audio 
                controls 
                className="w-full max-w-md mx-auto mb-6"
                style={{ filter: 'invert(1) hue-rotate(180deg)' }}
              >
                <source src="https://ec1.everestcast.host:2750/live" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>

              <div className="flex justify-center space-x-4">
                <button 
                  onClick={() => window.open('/player', 'player', 'width=400,height=600')}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors"
                >
                  <Maximize2 className="h-5 w-5" />
                  <span>Pop Out</span>
                </button>

                <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors">
                  <Timer className="h-5 w-5" />
                  <span>Sleep Timer</span>
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-400 mb-4">Want Premium Quality And No Ads?</p>
              <Link 
                to="/premium" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 inline-block"
              >
                Upgrade To Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-black to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Join The Community</h2>
            <p className="text-xl text-gray-400">Connect With Fellow Deep House Enthusiasts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gray-900/80 rounded-2xl p-6 text-center border border-orange-400/30">
              <Heart className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">1,123+</h3>
              <p className="text-gray-400">Patreon Supporters</p>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 text-center border border-orange-400/30">
              <Coffee className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Buy Me a Coffee</h3>
              <p className="text-gray-400">One-Time Support</p>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 text-center border border-orange-400/30">
              <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Submit Tracks</h3>
              <p className="text-gray-400">Share Your Music</p>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 text-center border border-orange-400/30">
              <TrendingUp className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Growing</h3>
              <p className="text-gray-400">Expanding Globally</p>
            </div>
          </div>

          <div className="text-center">
            <div className="flex justify-center space-x-6 mb-8">
              <button 
                onClick={() => shareOnSocial('instagram')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white p-4 rounded-xl transition-all duration-300"
              >
                <Instagram className="h-6 w-6" />
              </button>

              <button 
                onClick={() => shareOnSocial('twitter')}
                className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl transition-all duration-300"
              >
                <Twitter className="h-6 w-6" />
              </button>

              <button 
                onClick={() => shareOnSocial('facebook')}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition-all duration-300"
              >
                <Facebook className="h-6 w-6" />
              </button>
            </div>

            <div className="flex justify-center space-x-4">
              <a 
                href="https://apps.apple.com/app/deep-house-radio/id123456789" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <Apple className="h-5 w-5" />
                <span>App Store</span>
              </a>

              <a 
                href="https://play.google.com/store/apps/details?id=com.ni.deephouseradio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <PlayStore className="h-5 w-5" />
                <span>Google Play</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;