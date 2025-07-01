import React, { useState, useEffect } from 'react';
import { User } from '../types/subscription';
import { Search, Download, Edit, Plus, RefreshCw, Users, DollarSign, Coffee } from 'lucide-react';
import SharedBackground from '../components/SharedBackground';

interface BmacStats {
  totalSupporters: number;
  activeSupporters: number;
  totalRevenue: number;
  averageSupport: number;
  newThisMonth: number;
}

const BmacManagementPage: React.FC = () => {
  const [supporters, setSupporters] = useState<User[]>([]);
  const [filteredSupporters, setFilteredSupporters] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'dhr1' | 'dhr2' | 'vip'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<BmacStats>({
    totalSupporters: 0,
    activeSupporters: 0,
    totalRevenue: 0,
    averageSupport: 0,
    newThisMonth: 0
  });
  const [selectedSupporter, setSelectedSupporter] = useState<User | null>(null);
  const [editingSupporter, setEditingSupporter] = useState<Partial<User> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [newUrl, setNewUrl] = useState({ name: '', url: '' });
  const [bmacApiKey, setBmacApiKey] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    fetchSupporters();
  }, []);

  useEffect(() => {
    filterSupporters();
  }, [supporters, searchTerm, tierFilter, statusFilter]);

  const showNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 4)]);
  };

  const fetchSupporters = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      const bmacUsers = data.filter((user: User) => user.subscriptionSource === 'bmac' || user.subscriptionSource === 'buymeacoffee');
      setSupporters(bmacUsers);
      calculateStats(bmacUsers);
    } catch (error) {
      showNotification("Failed to fetch BMAC supporters");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (supporterList: User[]) => {
    const active = supporterList.filter(s => s.subscriptionStatus === 'active');
    const totalRevenue = supporterList.reduce((sum, s) => sum + (s.lifetimeSupport || 0), 0) / 100;
    const averageSupport = active.length > 0 ? totalRevenue / active.length : 0;
    
    const currentMonth = new Date().getMonth();
    const newThisMonth = supporterList.filter(s => 
      s.joinDate && new Date(s.joinDate).getMonth() === currentMonth
    ).length;

    setStats({
      totalSupporters: supporterList.length,
      activeSupporters: active.length,
      totalRevenue,
      averageSupport,
      newThisMonth
    });
  };

  const filterSupporters = () => {
    let filtered = supporters;

    if (searchTerm) {
      filtered = filtered.filter(supporter => 
        supporter.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supporter.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(supporter => supporter.subscriptionTier === tierFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(supporter => supporter.subscriptionStatus === statusFilter);
    }

    setFilteredSupporters(filtered);
  };

  const syncBmac = async () => {
    if (!bmacApiKey) {
      showNotification("Please enter your Buy Me A Coffee API key");
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync-bmac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: bmacApiKey })
      });
      const result = await response.json();
      
      if (result.success) {
        showNotification(`Updated ${result.updatedUsers} supporters, added ${result.newUsers} new supporters`);
        fetchSupporters();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSupporter = async (supporterId: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`/api/admin/users/${supporterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        showNotification("Supporter updated successfully");
        fetchSupporters();
        setShowEditModal(false);
        setEditingSupporter(null);
      } else {
        throw new Error('Failed to update supporter');
      }
    } catch (error) {
      showNotification("Failed to update supporter");
    }
  };

  const addPrivateUrl = async (supporterId: string, name: string, url: string) => {
    try {
      const supporter = supporters.find(s => s.id === supporterId);
      if (!supporter) return;

      const privateUrls = supporter.privateUrls || {};
      const updatedUrls = { ...privateUrls, [name]: url };

      await updateSupporter(supporterId, { privateUrls: updatedUrls });
      setShowAddUrlModal(false);
      setNewUrl({ name: '', url: '' });
    } catch (error) {
      showNotification("Failed to add private URL");
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Email', 'Current Tier', 'Total Support', 'Status', 'Join Date', 'Notes', 'Cancel Date', 'Access Expiration', 'Subscription Source'],
      ...filteredSupporters.map(supporter => [
        supporter.username,
        supporter.email,
        supporter.subscriptionTier,
        `€${((supporter.lifetimeSupport || 0) / 100).toFixed(2)}`,
        supporter.subscriptionStatus,
        supporter.joinDate ? new Date(supporter.joinDate).toLocaleDateString() : '',
        supporter.notes || '',
        supporter.cancelDate ? new Date(supporter.cancelDate).toLocaleDateString() : '',
        supporter.subscriptionExpiry ? new Date(supporter.subscriptionExpiry).toLocaleDateString() : '',
        'Buy Me A Coffee'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bmac-supporters-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black';
      case 'dhr2': return 'bg-gradient-to-r from-amber-400 to-orange-400 text-black';
      case 'dhr1': return 'bg-gradient-to-r from-orange-400 to-red-400 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      case 'expired': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen relative">
      <SharedBackground />
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-black mb-2 text-white flex items-center gap-3">
                <Coffee className="w-10 h-10 text-yellow-400" />
                Buy Me A Coffee Management
              </h1>
              <p className="text-gray-300">Manage Your Buy Me A Coffee Supporters And Access</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={syncBmac}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg disabled:opacity-50 font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync BMAC'}
              </button>
              <button 
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="whitespace-nowrap text-gray-300 font-medium">BMAC API Key:</label>
              <input
                type="password"
                placeholder="Enter your Buy Me A Coffee API key..."
                value={bmacApiKey}
                onChange={(e) => setBmacApiKey(e.target.value)}
                className="flex-1 p-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="mb-6 space-y-2">
              {notifications.map((notification, index) => (
                <div key={index} className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 text-yellow-300">
                  {notification}
                </div>
              ))}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Supporters</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.totalSupporters}</p>
                </div>
                <Coffee className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Supporters</p>
                  <p className="text-2xl font-bold text-green-400">{stats.activeSupporters}</p>
                </div>
                <Users className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-400">€{stats.totalRevenue.toFixed(0)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Average Support</p>
                  <p className="text-2xl font-bold text-purple-400">€{stats.averageSupport.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">New This Month</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.newThisMonth}</p>
                </div>
                <Plus className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search By Name Or Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                />
              </div>
              <select 
                value={tierFilter} 
                onChange={(e) => setTierFilter(e.target.value as any)}
                className="p-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="dhr1">DHR1</option>
                <option value="dhr2">DHR2</option>
                <option value="vip">VIP</option>
              </select>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="p-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Supporters Table */}
          <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <Coffee className="w-6 h-6" />
                Buy Me A Coffee Supporters ({filteredSupporters.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Name</th>
                    <th className="text-left p-3 text-gray-300">Email</th>
                    <th className="text-left p-3 text-gray-300">Current Tier</th>
                    <th className="text-left p-3 text-gray-300">Total Support</th>
                    <th className="text-left p-3 text-gray-300">Status</th>
                    <th className="text-left p-3 text-gray-300">Join Date</th>
                    <th className="text-left p-3 text-gray-300">Access Expiration</th>
                    <th className="text-left p-3 text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupporters.map((supporter) => (
                    <tr key={supporter.id} className="border-b border-gray-700/50 hover:bg-gray-800/30 text-white">
                      <td className="p-3">{supporter.username}</td>
                      <td className="p-3 text-gray-400">{supporter.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTierBadgeColor(supporter.subscriptionTier)}`}>
                          {supporter.subscriptionTier.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">€{((supporter.lifetimeSupport || 0) / 100).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(supporter.subscriptionStatus)}`}>
                          {supporter.subscriptionStatus}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">
                        {supporter.joinDate ? new Date(supporter.joinDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3 text-gray-400">
                        {supporter.subscriptionExpiry ? new Date(supporter.subscriptionExpiry).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => {
                            setSelectedSupporter(supporter);
                            setEditingSupporter(supporter);
                            setShowEditModal(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Modal */}
          {showEditModal && selectedSupporter && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">Manage Supporter: {selectedSupporter.username}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                      <input 
                        type="text"
                        value={editingSupporter?.username || selectedSupporter.username}
                        onChange={(e) => setEditingSupporter(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                      <input 
                        type="email"
                        value={editingSupporter?.email || selectedSupporter.email}
                        onChange={(e) => setEditingSupporter(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Subscription Tier</label>
                      <select 
                        value={editingSupporter?.subscriptionTier || selectedSupporter.subscriptionTier}
                        onChange={(e) => setEditingSupporter(prev => ({ ...prev, subscriptionTier: e.target.value }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                      >
                        <option value="free">Free</option>
                        <option value="dhr1">DHR1</option>
                        <option value="dhr2">DHR2</option>
                        <option value="vip">VIP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                      <select 
                        value={editingSupporter?.subscriptionStatus || selectedSupporter.subscriptionStatus}
                        onChange={(e) => setEditingSupporter(prev => ({ ...prev, subscriptionStatus: e.target.value }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                      >
                        <option value="active">Active</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                    <textarea 
                      value={editingSupporter?.notes || selectedSupporter.notes || ''}
                      onChange={(e) => setEditingSupporter(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded h-20"
                      placeholder="Admin notes for this supporter..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Private URLs</label>
                    <div className="space-y-2">
                      {Object.entries(selectedSupporter.privateUrls || {}).map(([name, url]) => (
                        <div key={name} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                          <span className="font-medium text-white">{name}:</span>
                          <span className="text-blue-400 truncate">{url}</span>
                        </div>
                      ))}
                      <button 
                        onClick={() => setShowAddUrlModal(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded"
                      >
                        <Plus className="w-4 h-4" />
                        Add Private URL
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <button 
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingSupporter(null);
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => updateSupporter(selectedSupporter.id, editingSupporter || {})}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded font-medium"
                    >
                      Update Supporter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Private URL Modal */}
          {showAddUrlModal && selectedSupporter && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Add Private URL</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">URL Name</label>
                    <input 
                      type="text"
                      value={newUrl.name}
                      onChange={(e) => setNewUrl(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., 'VIP Mix Pack', 'Special Content'"
                      className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
                    <input 
                      type="url"
                      value={newUrl.url}
                      onChange={(e) => setNewUrl(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setShowAddUrlModal(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => addPrivateUrl(selectedSupporter.id, newUrl.name, newUrl.url)}
                      disabled={!newUrl.name || !newUrl.url}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black rounded font-medium"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BmacManagementPage;