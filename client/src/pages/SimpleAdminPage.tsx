import React, { useState, useEffect } from 'react';
import { Users, Download, RefreshCw, AlertTriangle, Search, Crown, Star, Coffee } from 'lucide-react';
import { patreonService } from '@/services/patreonService';
import { buyMeCoffeeService } from '@/services/buyMeCoffeeService';
import { User, SubscriptionTier } from '@/types/subscription';

export default function SimpleAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Filter users based on search and tier
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || user.subscriptionTier === filterTier;
    return matchesSearch && matchesTier;
  });

  // Calculate stats
  const stats = {
    total: users.length,
    vip: users.filter(u => u.subscriptionTier === 'vip').length,
    dhr2: users.filter(u => u.subscriptionTier === 'dhr2').length,
    dhr1: users.filter(u => u.subscriptionTier === 'dhr1').length,
    free: users.filter(u => u.subscriptionTier === 'free').length,
    patreon: users.filter(u => u.subscriptionSource === 'patreon').length,
    bmac: users.filter(u => u.subscriptionSource === 'buymeacoffee').length,
    expired: users.filter(u => u.subscriptionEndDate && new Date(u.subscriptionEndDate) < new Date()).length
  };

  const syncAllPlatforms = async () => {
    setIsLoading(true);
    setNotifications([]);
    
    try {
      // Sync Patreon
      const patreonResult = await patreonService.syncPatreonSubscribers();
      let allUsers = [...patreonResult.users];
      
      // Sync Buy Me a Coffee 
      const bmacResult = await buyMeCoffeeService.syncSupporters();
      
      // Merge users from both platforms (avoid duplicates by email)
      const existingEmails = new Set(allUsers.map(u => u.email));
      const newBmacUsers = bmacResult.users.filter(u => !existingEmails.has(u.email));
      allUsers = [...allUsers, ...newBmacUsers];
      
      setUsers(allUsers);
      
      setNotifications([
        `✅ Patreon: ${patreonResult.success} subscribers synced`,
        `✅ Buy Me a Coffee: ${bmacResult.success} members synced`,
        `📊 Total: ${allUsers.length} unique subscribers`,
        `🎯 VIP: ${allUsers.filter(u => u.subscriptionTier === 'vip').length} members`,
        `🎵 DHR2: ${allUsers.filter(u => u.subscriptionTier === 'dhr2').length} members`,
        `🎶 DHR1: ${allUsers.filter(u => u.subscriptionTier === 'dhr1').length} members`
      ]);
      
    } catch (error) {
      console.error('Sync failed:', error);
      setNotifications(['❌ Sync failed - check API connections']);
    }
    
    setIsLoading(false);
  };

  const exportData = () => {
    const csvData = [
      'Email,Name,Tier,Source,Status,Amount,Expiry Date,Last Charge'
    ];
    
    users.forEach(user => {
      const expiry = user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString() : '';
      const lastCharge = user.lastChargeDate ? new Date(user.lastChargeDate).toLocaleDateString() : '';
      const amount = user.amount ? `€${user.amount.toFixed(2)}` : '';
      
      csvData.push(`"${user.email}","${user.username}","${user.subscriptionTier}","${user.subscriptionSource}","${user.subscriptionStatus}","${amount}","${expiry}","${lastCharge}"`);
    });
    
    const blob = new Blob([csvData.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhr-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setNotifications(prev => [...prev, `📁 Exported ${users.length} subscribers to CSV`]);
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'vip': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'dhr2': return <Star className="w-4 h-4 text-purple-400" />;
      case 'dhr1': return <Coffee className="w-4 h-4 text-blue-400" />;
      default: return <Users className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'vip': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'dhr2': return 'bg-purple-500/20 text-purple-400 border-purple-400/30';
      case 'dhr1': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">DHR Subscriber Management</h1>
          <p className="text-gray-400">Manage Patreon and Buy Me a Coffee subscribers</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
            <div className="text-2xl font-bold text-yellow-400">{stats.vip}</div>
            <div className="text-sm text-yellow-400">VIP (€10+)</div>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
            <div className="text-2xl font-bold text-purple-400">{stats.dhr2}</div>
            <div className="text-sm text-purple-400">DHR2 (€5+)</div>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-400">{stats.dhr1}</div>
            <div className="text-sm text-blue-400">DHR1 (€3+)</div>
          </div>
          <div className="bg-gray-500/10 rounded-lg p-4 border border-gray-500/30">
            <div className="text-2xl font-bold text-gray-400">{stats.free}</div>
            <div className="text-sm text-gray-400">Free</div>
          </div>
          <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
            <div className="text-2xl font-bold text-orange-400">{stats.patreon}</div>
            <div className="text-sm text-orange-400">Patreon</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">{stats.bmac}</div>
            <div className="text-sm text-green-400">Buy Me a Coffee</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <button
            onClick={syncAllPlatforms}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg px-6 py-3 text-white font-medium flex items-center justify-center transition-colors"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync All Platforms'}
          </button>
          
          <button
            onClick={exportData}
            className="bg-green-600 hover:bg-green-700 rounded-lg px-6 py-3 text-white font-medium flex items-center justify-center transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Search & Filter */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All Tiers ({users.length})</option>
              <option value="vip">VIP ({stats.vip})</option>
              <option value="dhr2">DHR2 ({stats.dhr2})</option>
              <option value="dhr1">DHR1 ({stats.dhr1})</option>
              <option value="free">Free ({stats.free})</option>
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Showing {filteredUsers.length} of {users.length} subscribers
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-6">
            <h3 className="text-white font-medium mb-2">Recent Updates</h3>
            <div className="space-y-1">
              {notifications.slice(-5).map((notification, index) => (
                <div key={index} className="text-sm text-gray-300">{notification}</div>
              ))}
            </div>
          </div>
        )}

        {/* Subscribers Table */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Subscriber</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Tier & Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Platform</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status & Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.map((user) => {
                  const isExpired = user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date();
                  const isExpiringSoon = user.subscriptionEndDate && 
                    new Date(user.subscriptionEndDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-white">{user.username}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 mb-1">
                          {getTierIcon(user.subscriptionTier)}
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getTierColor(user.subscriptionTier)}`}>
                            {user.subscriptionTier.toUpperCase()}
                          </span>
                        </div>
                        {user.amount && (
                          <div className="text-sm text-gray-300">€{user.amount.toFixed(2)}/month</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-300 capitalize">{user.subscriptionSource}</div>
                        {user.patreonTier && (
                          <div className="text-xs text-gray-500">{user.patreonTier}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.subscriptionStatus === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {user.subscriptionStatus}
                          </span>
                          {(isExpired || isExpiringSoon) && (
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        {user.subscriptionEndDate && (
                          <div className={`text-xs mt-1 ${
                            isExpired ? 'text-red-400' : 
                            isExpiringSoon ? 'text-yellow-400' : 'text-gray-400'
                          }`}>
                            Expires: {new Date(user.subscriptionEndDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {users.length === 0 ? 'Click "Sync All Platforms" to load subscribers' : 'No subscribers match your search'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}