import React, { useState } from 'react';
import { User, Settings, Crown, Download, Calendar, Mail, Bell, Music, X } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionTier } from '../types/subscription';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'preferences'>('profile');
  const currentUser = subscriptionService.getCurrentUser();
  const features = subscriptionService.getUserFeatures();

  if (!isOpen || !currentUser) return null;

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'vip': return 'text-orange-400';
      case 'premium': return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'vip': return Crown;
      case 'premium': return Download;
      default: return User;
    }
  };

  const remainingDownloads = subscriptionService.getRemainingDownloads();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-800/95 backdrop-blur-xl rounded-3xl border border-orange-400/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-400/20">
          <h2 className="text-2xl font-bold text-white">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-orange-500/20 text-gray-400 hover:text-orange-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-orange-400/20">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'subscription', label: 'Subscription', icon: Crown },
            { id: 'preferences', label: 'Preferences', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                  activeTab === tab.id
                    ? 'text-orange-300 border-b-2 border-orange-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{currentUser.username}</h3>
                  <p className="text-gray-400">{currentUser.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {React.createElement(getTierIcon(currentUser.subscriptionTier), {
                      className: `h-4 w-4 ${getTierColor(currentUser.subscriptionTier)}`
                    })}
                    <span className={`text-sm font-medium ${getTierColor(currentUser.subscriptionTier)}`}>
                      {currentUser.subscriptionTier.toUpperCase()} Member
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-xl p-4 border border-orange-400/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-gray-400">Member Since</span>
                  </div>
                  <p className="text-white font-semibold">
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-700/30 rounded-xl p-4 border border-orange-400/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Download className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-gray-400">Downloads</span>
                  </div>
                  <p className="text-white font-semibold">
                    {remainingDownloads === -1 ? 'Unlimited' : `${remainingDownloads} left`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Current Subscription */}
              <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-400/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Current Subscription</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentUser.subscriptionStatus === 'active' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {currentUser.subscriptionStatus.toUpperCase()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mb-4">
                  {React.createElement(getTierIcon(currentUser.subscriptionTier), {
                    className: `h-8 w-8 ${getTierColor(currentUser.subscriptionTier)}`
                  })}
                  <div>
                    <p className={`text-lg font-semibold ${getTierColor(currentUser.subscriptionTier)}`}>
                      {currentUser.subscriptionTier.toUpperCase()} Plan
                    </p>
                    <p className="text-gray-400 text-sm">
                      via {currentUser.subscriptionSource}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`flex items-center space-x-2 ${features.canAccessDHR1 ? 'text-green-300' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${features.canAccessDHR1 ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-sm">DHR1 Access</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${features.canAccessDHR2 ? 'text-green-300' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${features.canAccessDHR2 ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-sm">DHR2 Access</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${features.canAccessVIP ? 'text-green-300' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${features.canAccessVIP ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-sm">VIP Content</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${features.canDownload ? 'text-green-300' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${features.canDownload ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-sm">Downloads</span>
                  </div>
                </div>
              </div>

              {/* Upgrade Options */}
              {currentUser.subscriptionTier !== 'vip' && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-white">Upgrade Your Plan</h4>
                  <div className="grid gap-3">
                    <a
                      href="https://www.patreon.com/c/deephouseradio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl border border-orange-400/20 hover:border-orange-400/40 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Crown className="h-6 w-6 text-orange-400" />
                        <div>
                          <p className="font-semibold text-white">VIP Access</p>
                          <p className="text-sm text-gray-400">Unlimited downloads + exclusive content</p>
                        </div>
                      </div>
                      <span className="text-orange-400 font-semibold">$20/mo</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Notification Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
                <div className="space-y-3">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', icon: Mail },
                    { key: 'newReleaseAlerts', label: 'New Release Alerts', icon: Music },
                    { key: 'eventNotifications', label: 'Event Notifications', icon: Calendar }
                  ].map((pref) => {
                    const Icon = pref.icon;
                    return (
                      <div key={pref.key} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-orange-400/20">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-4 w-4 text-orange-400" />
                          <span className="text-white">{pref.label}</span>
                        </div>
                        <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          currentUser.preferences[pref.key as keyof typeof currentUser.preferences] 
                            ? 'bg-orange-500' 
                            : 'bg-gray-600'
                        }`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            currentUser.preferences[pref.key as keyof typeof currentUser.preferences] 
                              ? 'translate-x-6' 
                              : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Playback Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Playback</h3>
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-orange-400/20">
                  <div className="flex items-center space-x-3">
                    <Music className="h-4 w-4 text-orange-400" />
                    <span className="text-white">Auto-play</span>
                  </div>
                  <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    currentUser.preferences.autoPlay ? 'bg-orange-500' : 'bg-gray-600'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentUser.preferences.autoPlay ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-orange-400/20">
          <button
            onClick={() => subscriptionService.logout()}
            className="text-gray-400 hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;