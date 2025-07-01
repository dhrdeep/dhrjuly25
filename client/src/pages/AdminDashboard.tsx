import { useState, useEffect } from 'react';
// Using simple styled divs instead of shadcn components for now
import { 
  Users, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw as Sync,
  Music,
  Upload,
  Database,
  Settings,
  Package,
  BarChart3,
  FileText,
  HardDrive
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SystemStats {
  totalUsers: number;
  activeSubscribers: number;
  totalMixes: number;
  totalDownloads: number;
  storageUsed: string;
  lastSync: string;
}

interface ExpiredAccounts {
  expiredToday: number;
  expiredInRange: number;
  totalExpired: number;
  accounts: {
    today: Array<{
      id: string;
      email: string;
      username: string;
      subscriptionTier: string;
      subscriptionSource: string;
      subscriptionExpiry: string;
    }>;
    past: Array<{
      id: string;
      email: string;
      username: string;
      subscriptionTier: string;
      subscriptionSource: string;
      subscriptionExpiry: string;
    }>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeSubscribers: 0,
    totalMixes: 0,
    totalDownloads: 0,
    storageUsed: '0 GB',
    lastSync: 'Never'
  });
  const [expiredAccounts, setExpiredAccounts] = useState<ExpiredAccounts>({
    expiredToday: 0,
    expiredInRange: 0,
    totalExpired: 0,
    accounts: { today: [], past: [] }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
    fetchExpiredAccounts();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpiredAccounts = async () => {
    try {
      const response = await fetch('/api/admin/expired-accounts?days=30');
      if (response.ok) {
        const data = await response.json();
        setExpiredAccounts(data);
      }
    } catch (error) {
      console.error('Failed to fetch expired accounts:', error);
    }
  };

  const quickActions = [
    {
      title: 'Sync System',
      description: 'Patreon, BMAC & Spaces Sync',
      icon: Sync,
      href: '/sync',
      color: 'text-orange-500',
      priority: 'high'
    },
    {
      title: 'VIP Content Management',
      description: 'Manage premium mixes and access',
      icon: Music,
      href: '/vip-admin',
      color: 'text-purple-500',
      priority: 'high'
    },
    {
      title: 'User Management',
      description: 'View and manage subscribers',
      icon: Users,
      href: '/user-management',
      color: 'text-green-500',
      priority: 'high'
    },
    {
      title: 'Bulk Import',
      description: 'Import multiple mix files',
      icon: Upload,
      href: '/bulk-import',
      color: 'text-orange-500',
      priority: 'medium'
    },
    {
      title: 'Storage Configuration',
      description: 'Configure file hosting settings',
      icon: Settings,
      href: '/storage-setup',
      color: 'text-slate-500',
      priority: 'medium'
    },
    {
      title: 'Track History',
      description: 'View identified tracks and export data',
      icon: Music,
      href: '/track-history',
      color: 'text-purple-500',
      priority: 'medium'
    },
    {
      title: 'Google Ads Management',
      description: 'Configure and monitor Google AdSense',
      icon: BarChart3,
      href: '/google-ads-admin',
      color: 'text-emerald-500',
      priority: 'high'
    }

  ];

  const highPriorityActions = quickActions.filter(action => action.priority === 'high');
  const otherActions = quickActions.filter(action => action.priority !== 'high');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            DHR Admin Control Center
          </h1>
          <p className="text-slate-400 text-lg">
            Complete system management and content administration
          </p>
        </div>

        {/* System Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <div className="text-xs text-slate-400">Total Users</div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
            <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.activeSubscribers}</div>
            <div className="text-xs text-slate-400">Active VIPs</div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
            <Music className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalMixes}</div>
            <div className="text-xs text-slate-400">Total Mixes</div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
            <Download className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalDownloads}</div>
            <div className="text-xs text-slate-400">Downloads</div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
            <HardDrive className="h-6 w-6 text-slate-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.storageUsed}</div>
            <div className="text-xs text-slate-400">Storage</div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
            <Sync className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">{stats.lastSync}</div>
            <div className="text-xs text-slate-400">Last Sync</div>
          </div>
        </div>

        {/* Expired Accounts Notifications */}
        {(expiredAccounts.expiredToday > 0 || expiredAccounts.expiredInRange > 0) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Expired Account Notifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today's Expired Accounts */}
              {expiredAccounts.expiredToday > 0 && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-red-400">
                      Expired Today ({expiredAccounts.expiredToday})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {expiredAccounts.accounts.today.map((account, index) => (
                      <div key={index} className="bg-red-900/30 rounded p-3 text-sm">
                        <div className="text-white font-medium">{account.username || account.email}</div>
                        <div className="text-red-300 text-xs">
                          {account.subscriptionTier.toUpperCase()} • {account.subscriptionSource} • 
                          Expired: {new Date(account.subscriptionExpiry).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past 30 Days Expired Accounts */}
              {expiredAccounts.expiredInRange > 0 && (
                <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-orange-400">
                      Expired Past 30 Days ({expiredAccounts.expiredInRange})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {expiredAccounts.accounts.past.slice(0, 10).map((account, index) => (
                      <div key={index} className="bg-orange-900/30 rounded p-3 text-sm">
                        <div className="text-white font-medium">{account.username || account.email}</div>
                        <div className="text-orange-300 text-xs">
                          {account.subscriptionTier.toUpperCase()} • {account.subscriptionSource} • 
                          Expired: {new Date(account.subscriptionExpiry).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {expiredAccounts.accounts.past.length > 10 && (
                      <div className="text-orange-400 text-xs text-center pt-2">
                        ...and {expiredAccounts.accounts.past.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* High Priority Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Primary Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/sync">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-all cursor-pointer h-full p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <Sync className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">Sync System</h3>
                    <p className="text-slate-400 text-sm">Patreon, BMAC & Spaces Sync</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </Link>
            
            <Link to="/vip-admin">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-all cursor-pointer h-full p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <Music className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">VIP Content Management</h3>
                    <p className="text-slate-400 text-sm">Manage premium mixes and access</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </Link>
            
            <Link to="/user-management">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-all cursor-pointer h-full p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">User Management</h3>
                    <p className="text-slate-400 text-sm">View and manage subscribers</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Subscription Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/patreon-management">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-all cursor-pointer h-full p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <DollarSign className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">Patreon Management</h3>
                    <p className="text-slate-400 text-sm">Manage Patreon subscribers and access</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </Link>
            
            <Link to="/bmac-management">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-all cursor-pointer h-full p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <DollarSign className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">BMAC Management</h3>
                    <p className="text-slate-400 text-sm">Manage Buy Me A Coffee supporters</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Additional Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/bulk-import">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer p-4">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-sm">Bulk Import</h3>
                    <p className="text-slate-400 text-xs">Import multiple mix files</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </div>
              </div>
            </Link>
            
            <Link to="/storage-setup">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer p-4">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-slate-500" />
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-sm">Storage Configuration</h3>
                    <p className="text-slate-400 text-xs">Configure file hosting settings</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Status */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg">
          <div className="p-6">
            <h3 className="text-white text-lg font-semibold mb-2">System Status</h3>
            <p className="text-slate-400 mb-4">Current system health and recent activity</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">DigitalOcean Spaces Connection</span>
                <div className="border border-green-500 text-green-500 px-2 py-1 rounded text-sm flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Database Status</span>
                <div className="border border-green-500 text-green-500 px-2 py-1 rounded text-sm flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Operational
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Patreon Integration</span>
                <div className="border border-green-500 text-green-500 px-2 py-1 rounded text-sm flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}