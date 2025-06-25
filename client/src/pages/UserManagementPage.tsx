import React, { useState, useEffect } from 'react';
import { Users, Search, Download, Calendar, Filter, ExternalLink } from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionSource: string | null;
  subscriptionStartDate: Date | null;
  patreonTier: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, tierFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(user => user.subscriptionTier === tierFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.subscriptionStatus === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'dhr2': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'dhr1': return 'bg-green-500/20 text-green-300 border-green-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-500/20 text-green-300 border-green-400/30'
      : 'bg-red-500/20 text-red-300 border-red-400/30';
  };

  const exportUsers = () => {
    const csv = [
      ['Username', 'Email', 'Tier', 'Status', 'Source', 'Start Date', 'Created'],
      ...filteredUsers.map(user => [
        user.username,
        user.email,
        user.subscriptionTier,
        user.subscriptionStatus,
        user.subscriptionSource || '',
        user.subscriptionStartDate ? new Date(user.subscriptionStartDate).toLocaleDateString() : '',
        new Date(user.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhr-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-white">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-green-300 to-green-500 bg-clip-text text-transparent mb-2">
            User Management
          </h1>
          <p className="text-gray-300">
            Manage subscribers across Patreon and Buy Me a Coffee platforms
          </p>
        </header>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-400/20">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-400/20">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {users.filter(u => u.subscriptionStatus === 'active').length}
                </div>
                <div className="text-sm text-gray-400">Active Subscribers</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-400/20">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {users.filter(u => u.subscriptionTier === 'vip').length}
                </div>
                <div className="text-sm text-gray-400">VIP Members</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-400/20">
            <div className="flex items-center space-x-3">
              <ExternalLink className="h-8 w-8 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {users.filter(u => u.subscriptionSource === 'patreon').length}
                </div>
                <div className="text-sm text-gray-400">Patreon</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-400/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="dhr1">DHR1</option>
                <option value="dhr2">DHR2</option>
                <option value="vip">VIP</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={exportUsers}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 rounded-lg transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-400/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Tier</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Started</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">{user.username}</div>
                        <div className="text-gray-400 text-sm">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTierBadgeColor(user.subscriptionTier)}`}>
                        {user.subscriptionTier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(user.subscriptionStatus)}`}>
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 capitalize">
                        {user.subscriptionSource || 'Direct'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">
                        {user.subscriptionStartDate 
                          ? new Date(user.subscriptionStartDate).toLocaleDateString()
                          : '-'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No users found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}