import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  ShoppingBag
} from 'lucide-react';
import MediaPlayer from '../components/MediaPlayer';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const HomePage: React.FC = () => {
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const slogans = [
    "The Deepest Beats On The Net",
    "The Deeper Sound Of The Underground", 
    "We Go Deep"
  ];

  // Rotate slogans every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSloganIndex((prev) => (prev + 1) % slogans.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const shareContent = (platform: string) => {
    const url = window.location.href;
    const text = 'Check Out DHR - Deep House Radio For The Finest Deep House Music 24/7! The Deepest Beats On The Net 🎵';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=DeepHouse,DHR,ElectronicMusic`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'instagram':
        navigator.clipboard.writeText(`${text} ${url}`);
        alert('Link Copied To Clipboard! Share It On Instagram.');
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const features = [
    {
      icon: Headphones,
      title: 'Track Identifier',
      description: 'Instantly Identify Any Track Playing On DHR With Our Advanced AI-Powered Recognition System.',
      link: '/track-ident',
      color: 'from-orange-500 to-amber-500'
    },
    {
      icon: Radio,
      title: 'DHR1 Premium',
      description: 'Premium Deep House Channel Featuring The Finest Selection Of Underground And Mainstream Tracks.',
      link: '/dhr1',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Star,
      title: 'DHR2 Premium',
      description: 'Exclusive Premium Channel With Curated Deep House Sets From World-Renowned DJs.',
      link: '/dhr2',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: Crown,
      title: 'VIP Access',
      description: 'Unlock 1TB+ Of Exclusive Deep House Mixes With High-Quality Downloads And Premium Content.',
      link: '/vip',
      color: 'from-orange-600 to-orange-700'
    },
    {
      icon: Users,
      title: 'Community Forum',
      description: 'Join Our Vibrant Community Discussing The Latest In Deep House, Events, And Electronic Music.',
      link: '/forum',
      color: 'from-orange-400 to-orange-500'
    },
    {
      icon: Upload,
      title: 'DJ Submissions',
      description: 'Upload Your Deep House Mixes For Consideration. Share Your Talent With Our Global Audience.',
      link: '/upload',
      color: 'from-orange-500 to-amber-600'
    },
    {
      icon: ShoppingBag,
      title: 'Official Merchandise',
      description: 'Show Your Love For Deep House With Official DHR Merchandise And Limited Edition Collectibles.',
      link: '/shop',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const stats = [
    { icon: Globe, label: 'Global Listeners', value: '50K+' },
    { icon: Music, label: 'Tracks Identified', value: '1M+' },
    { icon: TrendingUp, label: 'Hours Streamed', value: '2.5M+' },
    { icon: Zap, label: 'Live 24/7', value: 'Always On' }
  ];

  return (
    <div className="text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <img 
                src={DHR_LOGO_URL} 
                alt="DHR Logo"
                className="h-24 w-24 rounded-2xl shadow-2xl border-2 border-orange-400/30 bg-gray-800/50 backdrop-blur-sm"
                onError={handleArtworkError}
              />
              <div className="absolute inset-0 rounded-2xl bg-orange-400/10 blur-lg -z-10"></div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            <span className="elegant-text bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent">
              DHR
            </span>
          </h1>
          
          <h2 className="text-2xl md:text-4xl font-light text-gray-300 mb-4">
            Deep House Radio
          </h2>

          {/* Single Rotating Slogan */}
          <div className="mb-8 h-16 flex items-center justify-center">
            <p 
              key={currentSloganIndex}
              className="text-lg md:text-xl text-orange-300 font-medium elegant-slogan"
              style={{
                animation: 'fadeInUp 1s ease-out'
              }}
            >
              {slogans[currentSloganIndex]}
            </p>
          </div>
          
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience The Finest Deep House Music 24/7. From Underground Gems To Mainstream Hits, 
            DHR Delivers The Perfect Soundtrack For Your Life With Intelligent Track Identification 
            And Premium Streaming Quality.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
            <Link
              to="/track-ident"
              className="group flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200 border border-orange-400/20"
            >
              <Play className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span>Start Listening</span>
            </Link>
            
            <Link
              to="/vip"
              className="group flex items-center space-x-3 bg-gray-900/60 hover:bg-gray-800/60 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200 border border-orange-400/20 backdrop-blur-sm"
            >
              <Crown className="h-6 w-6 text-orange-400 group-hover:scale-110 transition-transform" />
              <span>Go VIP</span>
            </Link>
          </div>

          {/* Social Share Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <span className="text-sm text-gray-400">Share DHR:</span>
            <button
              onClick={() => shareContent('twitter')}
              className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 transition-all duration-200 hover:scale-110"
              title="Share On Twitter"
            >
              <Twitter className="h-5 w-5" />
            </button>
            <button
              onClick={() => shareContent('facebook')}
              className="p-2 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 transition-all duration-200 hover:scale-110"
              title="Share On Facebook"
            >
              <Facebook className="h-5 w-5" />
            </button>
            <button
              onClick={() => shareContent('instagram')}
              className="p-2 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-pink-200 transition-all duration-200 hover:scale-110"
              title="Copy For Instagram"
            >
              <Instagram className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Live Stream Player */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 elegant-text bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
              Listen Live Now
            </h2>
            <p className="text-gray-400">Free 24/7 Deep House Stream - No Registration Required</p>
          </div>
          <MediaPlayer />
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-3xl p-8 border border-orange-400/20 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-white">Support DHR</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Help Us Keep The Music Flowing! Your Support Enables Us To Maintain Our Servers, 
                Discover New Artists, And Provide The Best Deep House Experience.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <a
                href="https://www.patreon.com/c/deephouseradio"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-3 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span>Support On Patreon</span>
              </a>
              
              <a
                href="https://www.buymeacoffee.com/deephouseradio"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center space-x-3 bg-gray-900/60 hover:bg-gray-800/60 px-6 py-3 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 border border-orange-400/20"
              >
                <Coffee className="h-5 w-5 text-orange-400 group-hover:scale-110 transition-transform" />
                <span>Buy Me A Coffee</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/10 hover:border-orange-400/20 transition-all duration-200 group">
                    <Icon className="h-8 w-8 text-orange-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 elegant-text bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Discover, Listen, And Connect With The Global Deep House Community Through Our Comprehensive Platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group bg-gray-900/40 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/10 hover:border-orange-400/20 transform hover:scale-105 transition-all duration-200 shadow-2xl"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-300 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Google Ads Placeholder */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-900/20 border border-orange-400/5 rounded-2xl p-8 text-center">
            <div className="text-gray-500 text-sm mb-2">Advertisement</div>
            <div className="h-24 bg-gray-700/10 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Google Ads Space - 728x90</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-3xl p-12 border border-orange-400/20 backdrop-blur-sm">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready To Dive Deep?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join Thousands Of Deep House Enthusiasts Worldwide. Start Your Journey With DHR Today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/track-ident"
                className="flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <Headphones className="h-6 w-6" />
                <span>Start Listening Now</span>
              </Link>
              <Link
                to="/forum"
                className="flex items-center space-x-3 bg-gray-900/60 hover:bg-gray-800/60 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200 border border-orange-400/20"
              >
                <Users className="h-6 w-6 text-orange-400" />
                <span>Join Community</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Styles for Elegant Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .elegant-slogan {
            font-family: 'Georgia', serif;
            letter-spacing: 0.05em;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }

          .elegant-text {
            font-family: 'Georgia', serif;
            letter-spacing: 0.1em;
            position: relative;
            display: inline-block;
          }
        `
      }} />
    </div>
  );
};

export default HomePage;