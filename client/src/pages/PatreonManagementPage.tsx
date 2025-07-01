import React, { useState, useEffect } from 'react';
import { User } from '../types/subscription';
import { Search, Download, Edit, Plus, RefreshCw, Users, DollarSign, Upload, FileText } from 'lucide-react';
import SharedBackground from '../components/SharedBackground';

interface PatreonStats {
  totalPatrons: number;
  activePatrons: number;
  totalRevenue: number;
  averagePledge: number;
  newThisMonth: number;
}

const PatreonManagementPage: React.FC = () => {
  const [patrons, setPatrons] = useState<User[]>([]);
  const [filteredPatrons, setFilteredPatrons] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'dhr1' | 'dhr2' | 'vip'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<PatreonStats>({
    totalPatrons: 0,
    activePatrons: 0,
    totalRevenue: 0,
    averagePledge: 0,
    newThisMonth: 0
  });
  const [selectedPatron, setSelectedPatron] = useState<User | null>(null);
  const [editingPatron, setEditingPatron] = useState<Partial<User> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [newUrl, setNewUrl] = useState({ name: '', url: '' });
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchPatrons();
  }, []);

  useEffect(() => {
    filterPatrons();
  }, [patrons, searchTerm, tierFilter, statusFilter]);

  const showNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 4)]);
  };

  const fetchPatrons = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      const patreonUsers = data.filter((user: User) => user.subscriptionSource === 'patreon');
      setPatrons(patreonUsers);
      calculateStats(patreonUsers);
    } catch (error) {
      showNotification("Failed to fetch Patreon subscribers");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (patronList: User[]) => {
    const active = patronList.filter(p => p.subscriptionStatus === 'active');
    const totalRevenue = patronList.reduce((sum, p) => sum + (p.pledgeAmount || 0), 0) / 100;
    const averagePledge = active.length > 0 ? totalRevenue / active.length : 0;
    
    const currentMonth = new Date().getMonth();
    const newThisMonth = patronList.filter(p => 
      p.joinDate && new Date(p.joinDate).getMonth() === currentMonth
    ).length;

    setStats({
      totalPatrons: patronList.length,
      activePatrons: active.length,
      totalRevenue,
      averagePledge,
      newThisMonth
    });
  };

  const filterPatrons = () => {
    let filtered = patrons;

    if (searchTerm) {
      filtered = filtered.filter(patron => 
        patron.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patron.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(patron => patron.subscriptionTier === tierFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(patron => patron.subscriptionStatus === statusFilter);
    }

    setFilteredPatrons(filtered);
  };

  const syncPatreon = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync-patreon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      if (result.success) {
        showNotification(`Updated ${result.updatedUsers} patrons, added ${result.newUsers} new patrons`);
        fetchPatrons();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const updatePatron = async (patronId: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`/api/admin/users/${patronId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        showNotification("Patron updated successfully");
        fetchPatrons();
        setShowEditModal(false);
        setEditingPatron(null);
      } else {
        throw new Error('Failed to update patron');
      }
    } catch (error) {
      showNotification("Failed to update patron");
    }
  };

  const addPrivateUrl = async (patronId: string, name: string, url: string) => {
    try {
      const patron = patrons.find(p => p.id === patronId);
      if (!patron) return;

      const privateUrls = patron.privateUrls || {};
      const updatedUrls = { ...privateUrls, [name]: url };

      await updatePatron(patronId, { privateUrls: updatedUrls });
      setShowAddUrlModal(false);
      setNewUrl({ name: '', url: '' });
    } catch (error) {
      showNotification("Failed to add private URL");
    }
  };

  const handleImportCSV = async () => {
    if (!importFile) {
      showNotification("Please select a CSV file");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('csvFile', importFile);
      formData.append('subscriptionSource', 'patreon');

      const response = await fetch('/api/admin/import-csv', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(`Successfully imported ${result.imported} patrons, updated ${result.updated} existing patrons`);
        fetchPatrons();
        setShowImportModal(false);
        setImportFile(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Name', 'Email', 'Current Tier', 'Pledge Amount (cents)', 'Status', 'Join Date', 'Notes', 'Cancel Date', 'Access Expiration'],
      ['John Doe', 'john@example.com', 'dhr1', '300', 'active', '2024-01-15', 'VIP patron', '', '2025-01-15'],
      ['Jane Smith', 'jane@example.com', 'vip', '1000', 'active', '2024-02-20', 'Long-time supporter', '', '2025-02-20']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([templateData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patreon-import-template.csv';
    a.click();
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Email', 'Current Tier', 'Pledge', 'Status', 'Join Date', 'Notes', 'Cancel Date', 'Access Expiration', 'Subscription Source'],
      ...filteredPatrons.map(patron => [
        patron.username,
        patron.email,
        patron.subscriptionTier,
        `€${((patron.pledgeAmount || 0) / 100).toFixed(2)}`,
        patron.subscriptionStatus,
        patron.joinDate ? new Date(patron.joinDate).toLocaleDateString() : '',
        patron.notes || '',
        patron.cancelDate ? new Date(patron.cancelDate).toLocaleDateString() : '',
        patron.subscriptionExpiry ? new Date(patron.subscriptionExpiry).toLocaleDateString() : '',
        'Patreon'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patreon-patrons-${new Date().toISOString().split('T')[0]}.csv`;
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
              <h1 className="text-4xl font-black mb-2 text-white">Patreon Management</h1>
              <p className="text-gray-300">Manage Your Patreon Subscribers And Access</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={syncPatreon}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Patreon'}
              </button>
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                <Upload className="w-4 h-4" />
                Import CSV
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

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="mb-6 space-y-2">
              {notifications.map((notification, index) => (
                <div key={index} className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 text-green-300">
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
                  <p className="text-sm text-gray-400">Total Patrons</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.totalPatrons}</p>
                </div>
                <Users className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Patrons</p>
                  <p className="text-2xl font-bold text-green-400">{stats.activePatrons}</p>
                </div>
                <Users className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-blue-400">€{stats.totalRevenue.toFixed(0)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Average Pledge</p>
                  <p className="text-2xl font-bold text-purple-400">€{stats.averagePledge.toFixed(2)}</p>
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

          {/* Patrons Table */}
          <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-orange-400">Patreon Subscribers ({filteredPatrons.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Name</th>
                    <th className="text-left p-3 text-gray-300">Email</th>
                    <th className="text-left p-3 text-gray-300">Current Tier</th>
                    <th className="text-left p-3 text-gray-300">Pledge</th>
                    <th className="text-left p-3 text-gray-300">Status</th>
                    <th className="text-left p-3 text-gray-300">Join Date</th>
                    <th className="text-left p-3 text-gray-300">Access Expiration</th>
                    <th className="text-left p-3 text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatrons.map((patron) => (
                    <tr key={patron.id} className="border-b border-gray-700/50 hover:bg-gray-800/30 text-white">
                      <td className="p-3">{patron.username}</td>
                      <td className="p-3 text-gray-400">{patron.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTierBadgeColor(patron.subscriptionTier)}`}>
                          {patron.subscriptionTier.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">€{((patron.pledgeAmount || 0) / 100).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(patron.subscriptionStatus)}`}>
                          {patron.subscriptionStatus}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">
                        {patron.joinDate ? new Date(patron.joinDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3 text-gray-400">
                        {patron.subscriptionExpiry ? new Date(patron.subscriptionExpiry).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => {
                            setSelectedPatron(patron);
                            setEditingPatron(patron);
                            setShowEditModal(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded"
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
          {showEditModal && selectedPatron && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">Manage Patron: {selectedPatron.username}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                      <input 
                        type="text"
                        value={editingPatron?.username || selectedPatron.username}
                        onChange={(e) => setEditingPatron(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                      <input 
                        type="email"
                        value={editingPatron?.email || selectedPatron.email}
                        onChange={(e) => setEditingPatron(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Subscription Tier</label>
                      <select 
                        value={editingPatron?.subscriptionTier || selectedPatron.subscriptionTier}
                        onChange={(e) => setEditingPatron(prev => ({ ...prev, subscriptionTier: e.target.value }))}
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
                        value={editingPatron?.subscriptionStatus || selectedPatron.subscriptionStatus}
                        onChange={(e) => setEditingPatron(prev => ({ ...prev, subscriptionStatus: e.target.value }))}
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
                      value={editingPatron?.notes || selectedPatron.notes || ''}
                      onChange={(e) => setEditingPatron(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded h-20"
                      placeholder="Admin notes for this patron..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Private URLs</label>
                    <div className="space-y-2">
                      {Object.entries(selectedPatron.privateUrls || {}).map(([name, url]) => (
                        <div key={name} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                          <span className="font-medium text-white">{name}:</span>
                          <span className="text-blue-400 truncate">{url}</span>
                        </div>
                      ))}
                      <button 
                        onClick={() => setShowAddUrlModal(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded"
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
                        setEditingPatron(null);
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => updatePatron(selectedPatron.id, editingPatron || {})}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded"
                    >
                      Update Patron
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Private URL Modal */}
          {showAddUrlModal && selectedPatron && (
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
                      onClick={() => addPrivateUrl(selectedPatron.id, newUrl.name, newUrl.url)}
                      disabled={!newUrl.name || !newUrl.url}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CSV Import Modal */}
          {showImportModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Import CSV File</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
                    />
                  </div>
                  <div className="text-sm text-gray-400">
                    <p className="mb-2">Expected CSV format:</p>
                    <p className="font-mono text-xs bg-gray-700 p-2 rounded">
                      Name, Email, Current Tier, Pledge Amount (cents), Status, Join Date, Notes, Cancel Date, Access Expiration
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Download Template
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowImportModal(false);
                          setImportFile(null);
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleImportCSV}
                        disabled={!importFile || isImporting}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded"
                      >
                        {isImporting ? 'Importing...' : 'Import'}
                      </button>
                    </div>
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

export default PatreonManagementPage;