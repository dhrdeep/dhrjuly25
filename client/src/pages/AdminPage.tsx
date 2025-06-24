import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  TrendingUp, 
  DollarSign, 
  RefreshCw, 
  Download, 
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  Mail,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  AlertTriangle,
  Info,
  Coffee } from 'lucide-react';
import { patreonService, DHR_PATREON_TIERS } from '../services/patreonService';
import { subscriptionService } from '../services/subscriptionService';
import { buyMeCoffeeService } from '../services/buyMeCoffeeService';
import { User, SubscriptionTier } from '../types/subscription';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

interface AdminStats {
  totalUsers: number;
  activeSubscribers: number;
  monthlyRevenue: number;
  patreonSubscribers: number;
  vipUsers: number;
  dhr2Users: number;
  dhr1Users: number;
  freeUsers: number;
  recentSignups: number;
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'patreon' | 'analytics' | 'settings'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | SubscriptionTier>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [configStatus, setConfigStatus] = useState<{ isConfigured: boolean; issues: string[] }>({ isConfigured: false, issues: [] });
  const [bmcConfigStatus, setBmcConfigStatus] = useState<{ isConfigured: boolean; issues: string[] }>({ isConfigured: false, issues: [] });
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    patreonSubscribers: 0,
    vipUsers: 0,
    dhr2Users: 0,
    dhr1Users: 0,
    freeUsers: 0,
    recentSignups: 0
  });
  const [notifications, setNotifications] = useState<string[]>([]);

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  // Load users and calculate stats
  useEffect(() => {
    loadUsers();
    checkPatreonConfig();
  }, []);

  // Filter users based on search and tier
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterTier !== 'all') {
      filtered = filtered.filter(user => user.subscriptionTier === filterTier);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterTier]);

  const checkPatreonConfig = () => {
    const status = patreonService.getConfigStatus();
    setConfigStatus(status);
    
    const bmcStatus = buyMeCoffeeService.getConfigStatus();
    setBmcConfigStatus(bmcStatus);
  };

  const loadUsers = () => {
    // In a real app, this would fetch from your backend
    const mockUsers: User[] = [
      {
        id: 'user_1',
        email: 'john@example.com',
        username: 'John Doe',
        subscriptionTier: 'vip',
        subscriptionStatus: 'active',
        subscriptionSource: 'patreon',
        subscriptionStartDate: '2024-01-15T00:00:00Z',
        patreonTier: 'dhr_vip',
        preferences: {
          emailNotifications: true,
          newReleaseAlerts: true,
          eventNotifications: true,
          autoPlay: true,
          preferredGenres: ['deep-house']
        },
        createdAt: '2024-01-15T00:00:00Z',
        lastLoginAt: '2024-01-20T10:30:00Z'
      },
      {
        id: 'user_2',
        email: 'sarah@example.com',
        username: 'Sarah Wilson',
        subscriptionTier: 'dhr2',
        subscriptionStatus: 'active',
        subscriptionSource: 'patreon',
        subscriptionStartDate: '2024-01-10T00:00:00Z',
        patreonTier: 'dhr2',
        preferences: {
          emailNotifications: true,
          newReleaseAlerts: true,
          eventNotifications: false,
          autoPlay: true,
          preferredGenres: ['deep-house', 'tech-house']
        },
        createdAt: '2024-01-10T00:00:00Z',
        lastLoginAt: '2024-01-19T15:45:00Z'
      },
      {
        id: 'user_3',
        email: 'mike@example.com',
        username: 'Mike Johnson',
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        subscriptionSource: 'direct',
        subscriptionStartDate: '2024-01-18T00:00:00Z',
        preferences: {
          emailNotifications: false,
          newReleaseAlerts: true,
          eventNotifications: false,
          autoPlay: true,
          preferredGenres: ['deep-house']
        },
        createdAt: '2024-01-18T00:00:00Z',
        lastLoginAt: '2024-01-20T09:15:00Z'
      }
    ];

    setUsers(mockUsers);
    calculateStats(mockUsers);
  };

  const calculateStats = (userList: User[]) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newStats: AdminStats = {
      totalUsers: userList.length,
      activeSubscribers: userList.filter(u => u.subscriptionTier !== 'free').length,
      monthlyRevenue: userList.reduce((total, user) => {
        if (user.subscriptionTier === 'vip') return total + 20;
        if (user.subscriptionTier === 'dhr2') return total + 5;
        if (user.subscriptionTier === 'dhr1') return total + 3;
        return total;
      }, 0),
      patreonSubscribers: userList.filter(u => u.subscriptionSource === 'patreon').length,
      vipUsers: userList.filter(u => u.subscriptionTier === 'vip').length,
      dhr2Users: userList.filter(u => u.subscriptionTier === 'dhr2').length,
      dhr1Users: userList.filter(u => u.subscriptionTier === 'dhr1').length,
      freeUsers: userList.filter(u => u.subscriptionTier === 'free').length,
      recentSignups: userList.filter(u => new Date(u.createdAt) > thirtyDaysAgo).length
    };

    setStats(newStats);
  };

  const handlePatreonAuth = () => {
    if (!configStatus.isConfigured) {
      setSyncStatus('Please configure Patreon credentials in .env file first');
      return;
    }
    
    const authUrl = patreonService.getAuthUrl();
    window.open(authUrl, '_blank', 'width=600,height=700');
  };

  const handleSyncPatreon = async () => {
    if (!patreonService.isAuthenticated()) {
      setSyncStatus('Please authenticate with Patreon first');
      return;
    }

    setIsLoading(true);
    setSyncStatus('Fetching all Patreon members (this may take a moment)...');

    try {
      const result = await patreonService.syncPatreonSubscribers();
      setSyncStatus(`Full sync completed: ${result.success} users synced, ${result.errors} errors (${result.users.length} total members processed)`);
      
      // Replace all users with fresh Patreon data
      setUsers(result.users);
      calculateStats(result.users);
      
      // Update stats with accurate counts
      const activeUsers = result.users.filter(u => u.subscriptionStatus === 'active');
      const vipUsers = result.users.filter(u => u.subscriptionTier === 'vip');
      const dhr2Users = result.users.filter(u => u.subscriptionTier === 'dhr2');
      const dhr1Users = result.users.filter(u => u.subscriptionTier === 'dhr1');
      const totalRevenue = result.users.reduce((sum, user) => sum + (user.amount || 0), 0) / 100;
      
      setStats(prev => ({
        ...prev,
        totalUsers: result.users.length,
        activeSubscribers: activeUsers.length,
        patreonSubscribers: result.users.length,
        vipUsers: vipUsers.length,
        dhr2Users: dhr2Users.length,
        dhr1Users: dhr1Users.length,
        freeUsers: result.users.filter(u => u.subscriptionTier === 'free').length,
        monthlyRevenue: totalRevenue
      }));
      
    } catch (error) {
      setSyncStatus(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncBuyMeCoffee = async () => {
    setIsLoading(true);
    setSyncStatus('Syncing Buy Me a Coffee supporters...');

    try {
      const result = await buyMeCoffeeService.syncSupporters();
      setSyncStatus(`Buy Me a Coffee sync completed: ${result.success} supporters synced, ${result.errors} errors`);
      
      // Merge with existing users
      const updatedUsers = [...users, ...result.users];
      setUsers(updatedUsers);
      calculateStats(updatedUsers);
      
      const newNotifications = [];
      if (result.success > 0) {
        newNotifications.push(`Successfully synced ${result.success} Buy Me a Coffee supporters`);
        
        // Count tier distribution from actual data
        const tierCounts = result.users?.reduce((acc, user) => {
          acc[user.subscriptionTier] = (acc[user.subscriptionTier] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        if (tierCounts.vip) newNotifications.push(`${tierCounts.vip} VIP supporters detected`);
        if (tierCounts.dhr2) newNotifications.push(`${tierCounts.dhr2} DHR2 supporters detected`);
        if (tierCounts.dhr1) newNotifications.push(`${tierCounts.dhr1} DHR1 supporters detected`);
      } else {
        newNotifications.push(`Buy Me a Coffee API integration ready - click Sync Supporters to fetch data`);
      }
      
      setNotifications(prev => [...prev, ...newNotifications]);
      
    } catch (error) {
      console.error('Buy Me a Coffee sync failed:', error);
      setSyncStatus('Buy Me a Coffee sync failed');
      setNotifications(prev => [...prev, 'Buy Me a Coffee sync failed']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvImport = () => {
    if (!csvContent.trim()) {
      setNotifications(prev => [...prev, 'Please paste CSV content first']);
      return;
    }

    try {
      const csvUsers = buyMeCoffeeService.parseCsvData(csvContent);
      
      // Merge with existing users, avoiding duplicates
      const existingEmails = new Set(users.map(u => u.email));
      const newUsers = csvUsers.filter(user => !existingEmails.has(user.email));
      const updatedUsers = [...users, ...newUsers];
      
      setUsers(updatedUsers);
      calculateStats(updatedUsers);
      
      const notifications = [
        `Imported ${newUsers.length} new Buy Me a Coffee supporters from CSV`,
        `Skipped ${csvUsers.length - newUsers.length} duplicates`
      ];
      
      // Count tier distribution
      const tierCounts = newUsers.reduce((acc, user) => {
        acc[user.subscriptionTier] = (acc[user.subscriptionTier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      if (tierCounts.vip) notifications.push(`${tierCounts.vip} VIP supporters added`);
      if (tierCounts.dhr2) notifications.push(`${tierCounts.dhr2} DHR2 supporters added`);
      if (tierCounts.dhr1) notifications.push(`${tierCounts.dhr1} DHR1 supporters added`);
      
      setNotifications(prev => [...prev, ...notifications]);
      setShowCsvModal(false);
      setCsvContent('');
      
    } catch (error) {
      console.error('CSV import failed:', error);
      setNotifications(prev => [...prev, 'CSV import failed - check format']);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Username', 'Email', 'Subscription Tier', 'Status', 'Source', 'Start Date', 'Last Login'],
      ...filteredUsers.map(user => [
        user.username,
        user.email,
        user.subscriptionTier,
        user.subscriptionStatus,
        user.subscriptionSource,
        new Date(user.subscriptionStartDate).toLocaleDateString(),
        new Date(user.lastLoginAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhr-users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'dhr2': return 'bg-orange-100 text-orange-800';
      case 'dhr1': return 'bg-blue-100 text-blue-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'vip':
        return <Crown className="h-3 w-3 mr-1" />;
      case 'dhr2':
        return <Users className="h-3 w-3 mr-1" />;
      case 'dhr1':
        return <Users className="h-3 w-3 mr-1" />;
      case 'free':
        return <Users className="h-3 w-3 mr-1" />;
      default:
        return <Users className="h-3 w-3 mr-1" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; change?: string; color?: string }> = ({ 
    icon: Icon, title, value, change, color = 'text-orange-400' 
  }) => (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {change}
            </p>
          )}
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <img 
                src={DHR_LOGO_URL} 
                alt="DHR Logo"
                className="h-16 w-16 rounded-xl shadow-2xl border-2 border-orange-400/50"
                onError={handleArtworkError}
              />
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-2">
                <Settings className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                DHR Admin Dashboard
              </h1>
              <p className="text-gray-300 mt-1">Manage Subscribers, Patreon Integration & Analytics</p>
            </div>
          </div>
        </header>

        {/* Configuration Warning */}
        {!configStatus.isConfigured && (
          <div className="mb-8 bg-red-500/20 border border-red-400/30 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-300 font-semibold mb-2">Patreon Configuration Required</h3>
                <div className="text-red-200 text-sm space-y-1">
                  {configStatus.issues.map((issue, index) => (
                    <p key={index}>• {issue}</p>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-red-500/10 rounded-lg">
                  <p className="text-red-200 text-sm">
                    <strong>To fix:</strong> Create a <code>.env</code> file with your Patreon credentials:
                  </p>
                  <pre className="text-xs text-red-300 mt-2 font-mono">
{`VITE_PATREON_CLIENT_ID=your_client_id_here
VITE_PATREON_CLIENT_SECRET=your_client_secret_here
VITE_PATREON_REDIRECT_URI=${window.location.origin}/auth/patreon/callback`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="mb-8">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-2 border border-orange-400/20">
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'patreon', label: 'Patreon', icon: Crown },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard icon={Users} title="Total Users" value={stats.totalUsers} change="+12%" />
              <StatCard icon={Crown} title="Active Subscribers" value={stats.activeSubscribers} change="+8%" />
              <StatCard icon={DollarSign} title="Monthly Revenue" value={`€${stats.monthlyRevenue}`} change="+15%" />
              <StatCard icon={TrendingUp} title="Recent Signups" value={stats.recentSignups} change="+23%" />
            </div>

            {/* Subscription Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
                <h3 className="text-xl font-bold text-white mb-4">Subscription Tiers</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-orange-400" />
                      <span className="text-white">VIP Users</span>
                    </div>
                    <span className="text-orange-400 font-semibold">{stats.vipUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-orange-400" />
                      <span className="text-white">DHR2 Users</span>
                    </div>
                    <span className="text-orange-400 font-semibold">{stats.dhr2Users}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="text-white">DHR1 Users</span>
                    </div>
                    <span className="text-blue-400 font-semibold">{stats.dhr1Users}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-white">Free Users</span>
                    </div>
                    <span className="text-gray-400 font-semibold">{stats.freeUsers}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
                <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleSyncPatreon}
                    disabled={isLoading || !configStatus.isConfigured}
                    className={`w-full flex items-center space-x-2 p-3 rounded-lg transition-colors border ${
                      configStatus.isConfigured 
                        ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/30' 
                        : 'bg-gray-600/50 border-gray-600/30 cursor-not-allowed'
                    }`}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Sync Patreon</span>
                  </button>
                  <button
                    onClick={exportUsers}
                    className="w-full flex items-center space-x-2 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600/30"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Users</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600/30">
                    <Mail className="h-4 w-4" />
                    <span>Send Newsletter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <select
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value as any)}
                    className="px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50"
                  >
                    <option value="all">All Tiers</option>
                    <option value="vip">VIP</option>
                    <option value="dhr2">DHR2</option>
                    <option value="dhr1">DHR1</option>
                    <option value="free">Free</option>
                  </select>
                  
                  <button
                    onClick={exportUsers}
                    className="flex items-center space-x-2 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors border border-orange-400/30"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-orange-400/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="text-left p-4 text-gray-300 font-semibold">User</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Subscription</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Source</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Start Date</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Last Login</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-gray-700/50 hover:bg-gray-700/20">
                        <td className="p-4">
                          <div>
                            <div className="font-semibold text-white">{user.username}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(user.subscriptionTier)}`}>
                            {user.subscriptionTier.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1">
                            {user.subscriptionSource === 'patreon' && <Crown className="h-4 w-4 text-orange-400" />}
                            <span className="text-gray-300 capitalize">{user.subscriptionSource}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">{formatDate(user.subscriptionStartDate)}</td>
                        <td className="p-4 text-gray-300">{formatDate(user.lastLoginAt)}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 rounded hover:bg-gray-600/50 text-gray-400 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1 rounded hover:bg-gray-600/50 text-gray-400 hover:text-white">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="p-1 rounded hover:bg-gray-600/50 text-gray-400 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Patreon Tab */}
        {activeTab === 'patreon' && (
          <div className="space-y-6">
            {/* Subscription Sources Integration */}
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Subscription Sources</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Patreon Section */}
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-orange-300 font-medium">Patreon Integration</h4>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                      patreonService.isAuthenticated() 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {patreonService.isAuthenticated() ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <span>{patreonService.isAuthenticated() ? 'Connected' : 'Not Connected'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handlePatreonAuth}
                      disabled={!configStatus.isConfigured}
                      className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm"
                    >
                      Authenticate with Patreon
                    </button>
                    
                    <button
                      onClick={handleSyncPatreon}
                      disabled={isLoading || !patreonService.isAuthenticated()}
                      className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          <span>Sync Patreon</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Buy Me a Coffee Section */}
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-yellow-300 font-medium">Buy Me a Coffee</h4>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                      bmcConfigStatus.isConfigured 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      <CheckCircle className="h-4 w-4" />
                      <span>Ready</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleSyncBuyMeCoffee}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <Coffee className="h-4 w-4" />
                          <span>Sync Supporters</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowCsvModal(true)}
                      className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-white text-sm"
                    >
                      Import CSV
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Connection Actions</h4>
                  <div className="space-y-3">
                    {!patreonService.isAuthenticated() ? (
                      <button
                        onClick={handlePatreonAuth}
                        disabled={!configStatus.isConfigured}
                        className={`w-full flex items-center space-x-2 p-3 rounded-lg transition-colors border ${
                          configStatus.isConfigured 
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/30' 
                            : 'bg-gray-600/50 border-gray-600/30 cursor-not-allowed'
                        }`}
                      >
                        <Crown className="h-4 w-4" />
                        <span>Connect to Patreon</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSyncPatreon}
                          disabled={isLoading}
                          className="w-full flex items-center space-x-2 p-3 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors border border-orange-400/30"
                        >
                          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>Sync Subscribers</span>
                        </button>
                        <button
                          onClick={() => patreonService.logout()}
                          className="w-full flex items-center space-x-2 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors border border-red-400/30"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Disconnect</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3">Status & Messages</h4>
                  {!configStatus.isConfigured && (
                    <div className="bg-red-500/20 rounded-lg p-3 border border-red-400/30 mb-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-red-300 text-sm">Configuration required</span>
                      </div>
                    </div>
                  )}
                  {syncStatus && (
                    <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/30">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-gray-300 text-sm">{syncStatus}</span>
                      </div>
                    </div>
                  )}
                  {configStatus.isConfigured && (
                    <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-green-300 text-sm">Configuration valid</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            {!configStatus.isConfigured && (
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-blue-300 font-semibold mb-3">Patreon Setup Instructions</h3>
                    <div className="text-blue-200 text-sm space-y-2">
                      <p><strong>1.</strong> Go to <a href="https://www.patreon.com/portal/registration/register-clients" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Patreon Developer Portal</a></p>
                      <p><strong>2.</strong> Create a new client application</p>
                      <p><strong>3.</strong> Set redirect URI to: <code className="bg-blue-500/20 px-1 rounded">{window.location.origin}/auth/patreon/callback</code></p>
                      <p><strong>4.</strong> Copy your Client ID and Client Secret</p>
                      <p><strong>5.</strong> Create a <code className="bg-blue-500/20 px-1 rounded">.env</code> file with your credentials</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patreon Tiers */}
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <h3 className="text-xl font-bold text-white mb-4">DHR Patreon Tiers</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.values(DHR_PATREON_TIERS).map((tier, index) => (
                  <div key={index} className="bg-gray-700/30 rounded-lg p-4 border border-orange-400/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{tier.name}</h4>
                      <span className="text-orange-400 font-bold">€{(tier.minAmount / 100).toFixed(0)}/mo</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-gray-300 text-sm">Access to {tier.name} channel</span>
                      </div>
                      {tier.name === 'DHR2' && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span className="text-gray-300 text-sm">Access to DHR1 channel</span>
                        </div>
                      )}
                      {tier.name === 'VIP' && (
                        <>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span className="text-gray-300 text-sm">Access to DHR1 & DHR2 channels</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span className="text-gray-300 text-sm">VIP exclusive content</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Patreon Statistics */}
            <div className="grid md:grid-cols-3 gap-6">
              <StatCard 
                icon={Crown} 
                title="Patreon Subscribers" 
                value={stats.patreonSubscribers} 
                color="text-orange-400" 
              />
              <StatCard 
                icon={DollarSign} 
                title="Patreon Revenue" 
                value={`€${Math.round(stats.monthlyRevenue * 0.8)}`} 
                color="text-green-400" 
              />
              <StatCard 
                icon={TrendingUp} 
                title="Growth Rate" 
                value="12%" 
                change="+3%" 
                color="text-blue-400" 
              />
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 text-center">
              <BarChart3 className="h-16 w-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-400">
                Detailed analytics dashboard coming soon. This will include revenue tracking, 
                user engagement metrics, subscription trends, and more.
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 text-center">
              <Settings className="h-16 w-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Admin Settings</h3>
              <p className="text-gray-400">
                Configuration options for DHR admin panel, API keys, webhook settings, 
                and system preferences will be available here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;