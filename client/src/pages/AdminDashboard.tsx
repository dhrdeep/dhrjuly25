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
import { Link } from 'wouter';

interface SystemStats {
  totalUsers: number;
  activeSubscribers: number;
  totalMixes: number;
  totalDownloads: number;
  storageUsed: string;
  lastSync: string;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
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

  const quickActions = [
    {
      title: 'Sync DigitalOcean Space',
      description: 'Update database with new files from Space',
      icon: Sync,
      href: '/sync',
      color: 'text-blue-500',
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
      href: '/admin',
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

        {/* High Priority Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Primary Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highPriorityActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-all cursor-pointer h-full p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">{action.title}</h3>
                      <p className="text-slate-400 text-sm">{action.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Additional Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer p-4">
                  <div className="flex items-center gap-3">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-sm">{action.title}</h3>
                      <p className="text-slate-400 text-xs">{action.description}</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-500" />
                  </div>
                </div>
              </Link>
            ))}
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