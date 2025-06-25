import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Radio, 
  Crown, 
  Users, 
  Menu, 
  X, 
  Headphones,
  Star,
  MessageCircle,
  Upload,
  Share2,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Music,
  User,
  LogIn,
  ShoppingBag,
  Settings
} from 'lucide-react';
import ChatBox from './ChatBox';
import ChatRoom from './ChatRoom';
import UserProfile from './UserProfile';
import AuthModal from './AuthModal';
import { subscriptionService } from '../services/subscriptionService';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatRoomOpen, setIsChatRoomOpen] = useState(false);
  const [isChatRoomMinimized, setIsChatRoomMinimized] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(subscriptionService.getCurrentUser());
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Track Ident', href: '/track-ident', icon: Headphones },
    { name: 'DHR1 Premium', href: '/dhr1', icon: Radio },
    { name: 'DHR2 Premium', href: '/dhr2', icon: Star },
    { name: 'VIP Access', href: '/vip', icon: Crown },
    { name: 'Forum', href: '/forum', icon: Users },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Shop', href: '/shop', icon: ShoppingBag },
    { name: 'Admin', href: '/admin', icon: Settings },
  ];

  const socialLinks = [
    { name: 'Instagram', icon: Instagram, url: 'https://instagram.com/deephouseradio', color: '#E4405F' },
    { name: 'Twitter', icon: Twitter, url: 'https://twitter.com/deephouseradio', color: '#1DA1F2' },
    { name: 'Facebook', icon: Facebook, url: 'https://facebook.com/deephouseradio', color: '#4267B2' },
    { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/deephouseradio', color: '#FF0000' },
    { name: 'SoundCloud', icon: Music, url: 'https://soundcloud.com/deephouseradio', color: '#FF5500' }
  ];

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const handleAuthSuccess = () => {
    setCurrentUser(subscriptionService.getCurrentUser());
  };

  const handleLogout = () => {
    subscriptionService.logout();
    setCurrentUser(null);
    setShowUserProfile(false);
  };

  const shareCurrentPage = (platform: string) => {
    const url = window.location.href;
    const title = 'DHR - Deep House Radio | The Deepest Beats On The Net';
    const text = 'Check Out DHR - Deep House Radio For The Finest Deep House Music 24/7!';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        navigator.clipboard.writeText(`${text} ${url}`);
        alert('Link Copied To Clipboard! Share It On Instagram.');
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const getUserTierColor = () => {
    if (!currentUser) return 'text-gray-400';
    switch (currentUser.subscriptionTier) {
      case 'vip': return 'text-orange-400';
      case 'premium': return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-900">
      {/* Floating DHR Logo Animation */}
      <div className="dhr-floating-bg">
        <div className="floating-dhr-logo">DHR</div>
        <div className="floating-dhr-logo">DHR</div>
        <div className="floating-dhr-logo">DHR</div>
        <div className="floating-dhr-logo">DHR</div>
        <div className="floating-dhr-logo">DHR</div>
      </div>

      {/* Single Subtle Background Logo */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900" />
        
        {/* Single centered background logo - spinning around screen */}
        <div 
          className="absolute"
          style={{
            width: '100vw',
            height: '100vh',
            left: '0',
            top: '0',
            animation: 'orbitSlowly 60s linear infinite'
          }}
        >
          <div
            className="absolute opacity-10"
            style={{
              width: '200px',
              height: '200px',
              left: '50%',
              top: '20%',
              marginLeft: '-100px',
              marginTop: '-100px',
              backgroundImage: `url(${DHR_LOGO_URL})`,
              backgroundPosition: 'center',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              animation: 'pulse60bpm 1s ease-in-out infinite, spin 20s linear infinite'
            }}
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/5 via-transparent to-orange-900/5" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-gray-900/80 backdrop-blur-xl border-b border-orange-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo with Elegant DHR Title */}
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src={DHR_LOGO_URL} 
                alt="DHR Logo"
                className="h-10 w-10 rounded-lg shadow-lg border border-orange-400/20"
                onError={handleArtworkError}
              />
              <div>
                <span className="text-xl font-bold elegant-text bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                  DHR
                </span>
                <p className="text-xs text-gray-400 -mt-1">Deep House Radio</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-orange-500/10 text-orange-300 border border-orange-400/20'
                          : 'text-gray-300 hover:bg-orange-500/5 hover:text-orange-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User & Social Media & Chat Toggles */}
            <div className="flex items-center space-x-2">
              {/* User Profile/Login */}
              {currentUser ? (
                <button
                  onClick={() => setShowUserProfile(true)}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 hover:text-orange-200 transition-all duration-200 border border-orange-400/20"
                  title={`${currentUser.username} (${currentUser.subscriptionTier.toUpperCase()})`}
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white`}>
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-xs font-medium ${getUserTierColor()}`}>
                    {currentUser.subscriptionTier.toUpperCase()}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 hover:text-orange-200 transition-all duration-200 border border-orange-400/20"
                  title="Sign In"
                >
                  <LogIn className="h-5 w-5" />
                  <span className="text-sm hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Social Share Button */}
              <div className="relative">
                <button
                  onClick={() => setShowSocialShare(!showSocialShare)}
                  className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 hover:text-orange-200 transition-all duration-200 border border-orange-400/20"
                  aria-label="Share & Social"
                  title="Share & Follow"
                >
                  <Share2 className="h-5 w-5" />
                </button>

                {/* Social Share Dropdown */}
                {showSocialShare && (
                  <div className="absolute right-0 top-12 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-orange-400/20 shadow-2xl p-4 w-64 z-50">
                    <div className="text-sm text-orange-200 font-semibold mb-3">Share DHR</div>
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={() => shareCurrentPage('twitter')}
                        className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-colors"
                        title="Share On Twitter"
                      >
                        <Twitter className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => shareCurrentPage('facebook')}
                        className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 transition-colors"
                        title="Share On Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => shareCurrentPage('instagram')}
                        className="p-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 transition-colors"
                        title="Copy For Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="text-sm text-orange-200 font-semibold mb-3">Follow DHR</div>
                    <div className="grid grid-cols-2 gap-2">
                      {socialLinks.map((social) => {
                        const Icon = social.icon;
                        return (
                          <a
                            key={social.name}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white transition-all duration-200 text-xs"
                            style={{ '--hover-color': social.color } as React.CSSProperties}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{social.name}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 hover:text-orange-200 transition-all duration-200 border border-orange-400/20"
                aria-label="Toggle AI Chat"
                title="AI Assistant"
              >
                <MessageCircle className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  setIsChatRoomOpen(!isChatRoomOpen);
                  if (isChatRoomMinimized) setIsChatRoomMinimized(false);
                }}
                className="relative p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 hover:text-orange-200 transition-all duration-200 border border-orange-400/20"
                aria-label="Toggle Live Chat"
                title="Live Chat Room"
              >
                <Users className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
              </button>
              
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 hover:text-orange-200 transition-all duration-200 border border-orange-400/20"
                  aria-label="Toggle Menu"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-gray-900/90 backdrop-blur-xl border-t border-orange-400/10">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-300 border border-orange-400/20'
                        : 'text-gray-300 hover:bg-orange-500/5 hover:text-orange-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Modals and Components */}
      <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <ChatRoom 
        isOpen={isChatRoomOpen} 
        onClose={() => setIsChatRoomOpen(false)}
        onMinimize={() => setIsChatRoomMinimized(!isChatRoomMinimized)}
        isMinimized={isChatRoomMinimized}
      />
      <UserProfile 
        isOpen={showUserProfile} 
        onClose={() => setShowUserProfile(false)} 
      />
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Click outside to close social share */}
      {showSocialShare && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSocialShare(false)}
        />
      )}

      {/* Enhanced Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse60bpm {
            0%, 100% { 
              opacity: 0.05;
              transform: scale(1);
            }
            50% { 
              opacity: 0.1;
              transform: scale(1.02);
            }
          }

          @keyframes elegantGlow {
            0%, 100% { 
              text-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
            }
            50% { 
              text-shadow: 0 0 20px rgba(249, 115, 22, 0.5), 0 0 30px rgba(249, 115, 22, 0.3);
            }
          }

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

          .elegant-text {
            animation: elegantGlow 4s ease-in-out infinite;
            font-family: 'Georgia', serif;
            letter-spacing: 0.1em;
            position: relative;
            display: inline-block;
          }

          .elegant-text::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 1px;
            background: linear-gradient(to right, transparent, #f97316, transparent);
            animation: fadeInUp 2s ease-in-out infinite alternate;
          }
          
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            background: linear-gradient(to right, #f97316, #ea580c);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fb923c;
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
          }
          
          .slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: linear-gradient(to right, #f97316, #ea580c);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fb923c;
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(55, 65, 81, 0.3);
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #f97316, #ea580c);
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #ea580c, #c2410c);
          }
        `
      }} />
    </div>
  );
};

export default Layout;