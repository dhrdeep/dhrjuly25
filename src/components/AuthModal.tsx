import React, { useState } from 'react';
import { X, Mail, Lock, Crown, Star, User, ExternalLink } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionTier } from '../types/subscription';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'demo'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await subscriptionService.login(email, password);
      if (user) {
        onAuthSuccess();
        onClose();
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (tier: SubscriptionTier) => {
    const user = subscriptionService.loginAsDemo(tier);
    if (user) {
      onAuthSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-800/95 backdrop-blur-xl rounded-3xl border border-orange-400/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-400/20">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Sign In to DHR' : 'Demo Access'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-orange-500/20 text-gray-400 hover:text-orange-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-orange-400/20">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'text-orange-300 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Member Login
          </button>
          <button
            onClick={() => setMode('demo')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              mode === 'demo'
                ? 'text-orange-300 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Demo Access
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'login' ? (
            <div className="space-y-6">
              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-orange-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-orange-200 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    isLoading
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-105'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <User className="h-5 w-5" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* External Login Options */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  <a
                    href="https://www.patreon.com/c/deephouseradio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg border border-gray-600/30 transition-colors"
                  >
                    <Crown className="h-5 w-5 text-orange-400" />
                    <span className="text-white">Patreon Subscriber</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>

                  <a
                    href="https://www.buymeacoffee.com/deephouseradio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg border border-gray-600/30 transition-colors"
                  >
                    <Star className="h-5 w-5 text-orange-400" />
                    <span className="text-white">Buy Me a Coffee Supporter</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm mb-4">
                Try DHR with different subscription levels to see the features available to each tier.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleDemoLogin('free')}
                  className="w-full flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-600/30 rounded-lg border border-gray-600/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="text-left">
                      <p className="font-semibold text-white">Free User</p>
                      <p className="text-sm text-gray-400">Basic access to DHR</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">Demo</span>
                </button>

                <button
                  onClick={() => handleDemoLogin('premium')}
                  className="w-full flex items-center justify-between p-4 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-400/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-amber-400" />
                    <div className="text-left">
                      <p className="font-semibold text-white">Premium User</p>
                      <p className="text-sm text-gray-400">DHR1 & DHR2 access + downloads</p>
                    </div>
                  </div>
                  <span className="text-amber-400 text-sm">Demo</span>
                </button>

                <button
                  onClick={() => handleDemoLogin('vip')}
                  className="w-full flex items-center justify-between p-4 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg border border-orange-400/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Crown className="h-5 w-5 text-orange-400" />
                    <div className="text-left">
                      <p className="font-semibold text-white">VIP User</p>
                      <p className="text-sm text-gray-400">Full access + unlimited downloads</p>
                    </div>
                  </div>
                  <span className="text-orange-400 text-sm">Demo</span>
                </button>
              </div>

              <div className="mt-6 p-4 bg-orange-500/10 rounded-lg border border-orange-400/30">
                <p className="text-orange-200 text-sm">
                  <strong>Note:</strong> Demo mode lets you explore features without a real subscription. 
                  To access actual content, please subscribe via Patreon or Buy Me a Coffee.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;