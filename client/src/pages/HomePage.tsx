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
  ShoppingBag,
  ArrowRight,
  Waves,
  Volume2,
  Download,
  Eye
} from 'lucide-react';

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
      {/* Hero Section - Redesigned */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src={DHR_LOGO_URL} 
                  alt="DHR Logo"
                  className="h-16 w-16 rounded-2xl shadow-2xl border border-orange-400/30"
                  onError={handleArtworkError}
                />
                <div className="absolute inset-0 rounded-2xl bg-orange-400/20 blur-lg -z-10"></div>
              </div>
              <div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent">
                    DHR
                  </span>
                </h1>
                <p className="text-orange-300/70 text-sm tracking-widest uppercase">Deep House Radio</p>
              </div>
            </div>

            {/* Dynamic Slogan */}
            <div className="h-12 flex items-center">
              <h2 
                key={currentSloganIndex}
                className="text-2xl md:text-3xl font-bold text-white"
                style={{ animation: 'fadeInUp 1s ease-out' }}
              >
                {slogans[currentSloganIndex]}
              </h2>
            </div>
            
            {/* Description */}
            <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
              Immerse yourself in the deepest electronic sounds. From underground gems to exclusive premieres, 
              we curate the perfect sonic journey for true deep house enthusiasts.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/track-ident"
                className="group flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-10 py-5 rounded-2xl text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Play className="h-6 w-6 group-hover:scale-110 transition-transform" />
                <span>Enter The Deep</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/vip"
                className="group flex items-center justify-center space-x-3 bg-gray-900/80 hover:bg-gray-800/80 px-10 py-5 rounded-2xl text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 border border-orange-400/30 backdrop-blur-sm"
              >
                <Crown className="h-6 w-6 text-orange-400 group-hover:scale-110 transition-transform" />
                <span>VIP Access</span>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">50K+</div>
                <div className="text-sm text-gray-400">Listeners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">24/7</div>
                <div className="text-sm text-gray-400">Live Stream</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">1M+</div>
                <div className="text-sm text-gray-400">Tracks ID'd</div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Elements */}
          <div className="relative">
            {/* Main Visual Container */}
            <div className="relative bg-gradient-to-br from-gray-900/60 to-gray-800/60 rounded-3xl p-8 backdrop-blur-xl border border-orange-400/20">
              {/* Live Stream Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300 font-medium">LIVE NOW</span>
                </div>
                <div className="flex items-center space-x-2 text-orange-400">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm font-medium">HD Quality</span>
                </div>
              </div>

              {/* Current Track Display */}
              <div className="bg-gray-900/80 rounded-2xl p-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Waves className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">Deep Horizon</h3>
                    <p className="text-gray-400">Solomun</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="h-1 bg-gray-700 rounded-full flex-1">
                        <div className="h-1 bg-orange-400 rounded-full w-2/3"></div>
                      </div>
                      <span className="text-xs text-gray-400">3:42</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <Eye className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">Track ID</div>
                  <div className="text-xs text-gray-400">AI Powered</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <Download className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">Downloads</div>
                  <div className="text-xs text-gray-400">VIP Members</div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-orange-500/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-orange-600/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </section>

      {/* Immersive Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                Dive Deeper
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Explore our universe of deep house through multiple dimensions of experience
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-3xl p-8 backdrop-blur-xl border border-orange-400/20 hover:border-orange-400/40 transform hover:scale-105 transition-all duration-500 shadow-2xl"
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent"></div>
                  </div>
                  
                  {/* Icon */}
                  <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-300 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors mb-4">
                    {feature.description}
                  </p>

                  {/* Hover Arrow */}
                  <div className="flex items-center text-orange-400 group-hover:translate-x-2 transition-transform duration-300">
                    <span className="text-sm font-medium">Explore</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Live Player Section */}
          <div className="bg-gradient-to-r from-gray-900/60 to-gray-800/60 rounded-3xl p-8 backdrop-blur-xl border border-orange-400/20">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                Listen Live Now
              </h3>
              <p className="text-gray-400">Free 24/7 Deep House Stream - No Registration Required</p>
            </div>
            <div className="flex justify-center">
              <iframe
                src="/evercast-player.html"
                width="600"
                height="1000"
                frameBorder="0"
                style={{
                  border: 'none',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  maxWidth: '100%'
                }}
                title="DHR Live Player"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Community & Support Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Support Column */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-black mb-6">
                  <span className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                    Fuel The Deep
                  </span>
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Join our community of passionate supporters. Your contribution keeps the deepest beats flowing 
                  and helps us discover the next generation of underground talent.
                </p>
              </div>
              
              <div className="space-y-4">
                <a
                  href="https://www.patreon.com/c/deephouseradio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center space-x-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-8 py-6 rounded-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <Heart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <div className="text-lg">Support on Patreon</div>
                    <div className="text-sm opacity-80">Monthly support starting at €3</div>
                  </div>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
                
                <a
                  href="https://www.buymeacoffee.com/deephouseradio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center space-x-4 bg-gray-900/80 hover:bg-gray-800/80 px-8 py-6 rounded-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 border border-orange-400/30"
                >
                  <Coffee className="h-6 w-6 text-orange-400 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <div className="text-lg">Buy Me a Coffee</div>
                    <div className="text-sm opacity-80 text-gray-400">One-time support</div>
                  </div>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform text-orange-400" />
                </a>
              </div>

              {/* Quick Social Share */}
              <div className="flex items-center space-x-4 pt-4">
                <span className="text-sm text-gray-400">Share the vibes:</span>
                <button
                  onClick={() => shareContent('twitter')}
                  className="p-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:scale-110 transition-all duration-200"
                >
                  <Twitter className="h-5 w-5" />
                </button>
                <button
                  onClick={() => shareContent('facebook')}
                  className="p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:scale-110 transition-all duration-200"
                >
                  <Facebook className="h-5 w-5" />
                </button>
                <button
                  onClick={() => shareContent('instagram')}
                  className="p-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:scale-110 transition-all duration-200"
                >
                  <Instagram className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Stats Column */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/20 hover:border-orange-400/40 transition-all duration-300 group">
                    <Icon className="h-10 w-10 text-orange-400 mb-4 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-black text-white mb-2">{stat.value}</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">{stat.label}</div>
                  </div>
                );
              })}
            </div>
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

      {/* Final Call to Action */}
      <section className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Main CTA Container */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-3xl p-16 backdrop-blur-xl border border-orange-400/30">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl"></div>
            
            {/* Content */}
            <div className="relative text-center space-y-8">
              <h2 className="text-5xl md:text-7xl font-black">
                <span className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                  Ready To Go Deep?
                </span>
              </h2>
              
              <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Join thousands of deep house enthusiasts worldwide. 
                <br className="hidden md:block" />
                Your sonic journey begins now.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                <Link
                  to="/track-ident"
                  className="group flex items-center space-x-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-12 py-6 rounded-2xl text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <Headphones className="h-7 w-7 group-hover:scale-110 transition-transform" />
                  <span>Start Your Journey</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  to="/forum"
                  className="group flex items-center space-x-4 bg-gray-900/80 hover:bg-gray-800/80 px-12 py-6 rounded-2xl text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 border border-orange-400/30"
                >
                  <Users className="h-7 w-7 text-orange-400 group-hover:scale-110 transition-transform" />
                  <span>Join The Community</span>
                </Link>
              </div>

              {/* Subtle footer info */}
              <div className="pt-8 text-sm text-gray-400">
                <p>Free forever • No registration required • Available worldwide</p>
              </div>
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