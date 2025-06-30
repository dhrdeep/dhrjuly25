import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3, 
  DollarSign, 
  Eye, 
  TrendingUp,
  Calendar,
  MapPin,
  Smartphone,
  Monitor,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';

interface GoogleAdsConfig {
  id: number;
  adSlotId: string;
  adLocation: string;
  adSize: string;
  isActive: boolean;
  displayOnPages: string;
  createdAt: string;
  updatedAt: string;
}

interface GoogleAdsStats {
  id: number;
  adSlotId: string;
  impressions: number;
  clicks: number;
  revenue: string;
  ctr: string;
  dateRecorded: string;
  createdAt: string;
}

interface AdFormData {
  adSlotId: string;
  adLocation: string;
  adSize: string;
  displayOnPages: string;
  isActive: boolean;
}

const GoogleAdsAdminPage: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAd, setEditingAd] = useState<GoogleAdsConfig | null>(null);
  const [formData, setFormData] = useState<AdFormData>({
    adSlotId: '',
    adLocation: 'header',
    adSize: '728x90',
    displayOnPages: 'all',
    isActive: true
  });

  const queryClient = useQueryClient();

  // Fetch Google Ads configurations
  const { data: adsConfigs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['google-ads-configs'],
    queryFn: async (): Promise<GoogleAdsConfig[]> => {
      const response = await fetch('/api/admin/google-ads/configs');
      if (!response.ok) throw new Error('Failed to fetch ads configs');
      return response.json();
    }
  });

  // Fetch Google Ads stats
  const { data: adsStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['google-ads-stats'],
    queryFn: async (): Promise<GoogleAdsStats[]> => {
      const response = await fetch('/api/admin/google-ads/stats');
      if (!response.ok) throw new Error('Failed to fetch ads stats');
      return response.json();
    }
  });

  // Create/Update ad config mutation
  const createAdMutation = useMutation({
    mutationFn: async (data: AdFormData): Promise<GoogleAdsConfig> => {
      const response = await fetch('/api/admin/google-ads/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create ad config');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-ads-configs'] });
      setShowCreateForm(false);
      resetForm();
    }
  });

  const updateAdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AdFormData> }): Promise<GoogleAdsConfig> => {
      const response = await fetch(`/api/admin/google-ads/configs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update ad config');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-ads-configs'] });
      setEditingAd(null);
      resetForm();
    }
  });

  // Delete ad config mutation
  const deleteAdMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/admin/google-ads/configs/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete ad config');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-ads-configs'] });
    }
  });

  // Sync Google Ads data mutation
  const syncAdsMutation = useMutation({
    mutationFn: async (): Promise<{ success: boolean; message: string }> => {
      const response = await fetch('/api/admin/google-ads/sync', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to sync Google Ads data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-ads-stats'] });
    }
  });

  const resetForm = () => {
    setFormData({
      adSlotId: '',
      adLocation: 'header',
      adSize: '728x90',
      displayOnPages: 'all',
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAd) {
      updateAdMutation.mutate({ id: editingAd.id, data: formData });
    } else {
      createAdMutation.mutate(formData);
    }
  };

  const handleEdit = (ad: GoogleAdsConfig) => {
    setEditingAd(ad);
    setFormData({
      adSlotId: ad.adSlotId,
      adLocation: ad.adLocation,
      adSize: ad.adSize,
      displayOnPages: ad.displayOnPages,
      isActive: ad.isActive
    });
    setShowCreateForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this ad configuration?')) {
      deleteAdMutation.mutate(id);
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'header': return <Monitor className="h-4 w-4" />;
      case 'sidebar': return <Smartphone className="h-4 w-4" />;
      case 'footer': return <Monitor className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getTotalRevenue = () => {
    return adsStats.reduce((total, stat) => total + parseFloat(stat.revenue || '0'), 0).toFixed(2);
  };

  const getTotalImpressions = () => {
    return adsStats.reduce((total, stat) => total + (stat.impressions || 0), 0);
  };

  const getTotalClicks = () => {
    return adsStats.reduce((total, stat) => total + (stat.clicks || 0), 0);
  };

  const getAverageCTR = () => {
    const totalCTR = adsStats.reduce((total, stat) => total + parseFloat(stat.ctr || '0'), 0);
    return adsStats.length > 0 ? (totalCTR / adsStats.length).toFixed(2) : '0.00';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Google Ads Management</h1>
            <p className="text-slate-400">Configure and monitor Google AdSense integration</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => syncAdsMutation.mutate()}
              disabled={syncAdsMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncAdsMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Data
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Ad Slot
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-6 w-6 text-green-400" />
              <span className="text-slate-400 text-sm">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-white">${getTotalRevenue()}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-6 w-6 text-blue-400" />
              <span className="text-slate-400 text-sm">Impressions</span>
            </div>
            <div className="text-2xl font-bold text-white">{getTotalImpressions().toLocaleString()}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-6 w-6 text-orange-400" />
              <span className="text-slate-400 text-sm">Clicks</span>
            </div>
            <div className="text-2xl font-bold text-white">{getTotalClicks().toLocaleString()}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-6 w-6 text-purple-400" />
              <span className="text-slate-400 text-sm">Average CTR</span>
            </div>
            <div className="text-2xl font-bold text-white">{getAverageCTR()}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ad Configurations */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Ad Slot Configurations</h2>
            
            {configsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading configurations...</p>
              </div>
            ) : adsConfigs.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No ad slots configured</p>
              </div>
            ) : (
              <div className="space-y-4">
                {adsConfigs.map((ad) => (
                  <div key={ad.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getLocationIcon(ad.adLocation)}
                        <div>
                          <div className="font-semibold text-white">{ad.adSlotId}</div>
                          <div className="text-sm text-slate-400">{ad.adLocation} • {ad.adSize}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ad.isActive ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-sm">
                            <AlertCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Pages: {ad.displayOnPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(ad)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Performance */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recent Performance</h2>
            
            {statsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading stats...</p>
              </div>
            ) : adsStats.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No performance data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adsStats.slice(0, 10).map((stat) => (
                  <div key={stat.id} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{stat.adSlotId}</span>
                      <span className="text-sm text-slate-400">{stat.dateRecorded}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Impressions</div>
                        <div className="text-white font-medium">{stat.impressions.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Clicks</div>
                        <div className="text-white font-medium">{stat.clicks}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">CTR</div>
                        <div className="text-white font-medium">{stat.ctr}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Revenue</div>
                        <div className="text-green-400 font-medium">${stat.revenue}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-6">
                {editingAd ? 'Edit Ad Slot' : 'Create New Ad Slot'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ad Slot ID
                  </label>
                  <input
                    type="text"
                    value={formData.adSlotId}
                    onChange={(e) => setFormData({ ...formData, adSlotId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-400"
                    placeholder="e.g., ca-pub-1234567890123456/1234567890"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Location
                  </label>
                  <select
                    value={formData.adLocation}
                    onChange={(e) => setFormData({ ...formData, adLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-400"
                  >
                    <option value="header">Header</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="footer">Footer</option>
                    <option value="between-content">Between Content</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ad Size
                  </label>
                  <select
                    value={formData.adSize}
                    onChange={(e) => setFormData({ ...formData, adSize: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-400"
                  >
                    <option value="728x90">Leaderboard (728x90)</option>
                    <option value="300x250">Medium Rectangle (300x250)</option>
                    <option value="320x50">Mobile Banner (320x50)</option>
                    <option value="160x600">Wide Skyscraper (160x600)</option>
                    <option value="970x250">Billboard (970x250)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Display On Pages
                  </label>
                  <select
                    value={formData.displayOnPages}
                    onChange={(e) => setFormData({ ...formData, displayOnPages: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-400"
                  >
                    <option value="all">All Pages</option>
                    <option value="home">Home Page Only</option>
                    <option value="players">Player Pages</option>
                    <option value="vip">VIP Pages</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-orange-600 bg-slate-700 border-slate-600 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-slate-300">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createAdMutation.isPending || updateAdMutation.isPending}
                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {editingAd ? 'Update' : 'Create'} Ad Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingAd(null);
                      resetForm();
                    }}
                    className="flex-1 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAdsAdminPage;