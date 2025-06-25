import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VipMix } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Edit, Save, X, ExternalLink, Download, Play, Zap, Upload, Cloud, Music } from 'lucide-react';

export default function VIPAdminPage() {
  const [editingMix, setEditingMix] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<VipMix>>({});
  const queryClient = useQueryClient();

  const { data: vipMixes = [], isLoading } = useQuery({
    queryKey: ['/api/vip-mixes'],
  });

  const updateMixMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<VipMix> }) => {
      return apiRequest(`/api/vip-mixes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vip-mixes'] });
      setEditingMix(null);
      setFormData({});
    },
  });

  const startEditing = (mix: VipMix) => {
    setEditingMix(mix.id);
    setFormData({
      jumpshareUrl: mix.jumpshareUrl || '',
      jumpsharePreviewUrl: mix.jumpsharePreviewUrl || '',
    });
  };

  const saveChanges = () => {
    if (editingMix) {
      updateMixMutation.mutate({ id: editingMix, data: formData });
    }
  };

  const cancelEdit = () => {
    setEditingMix(null);
    setFormData({});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-white py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-400"></div>
          <p className="mt-4 text-xl">Loading VIP Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent mb-4">
            VIP Content Management
          </h1>
          <p className="text-xl text-gray-300">Update Jumpshare Links For Your 1TB Collection</p>
          
          {/* Quick Admin Links */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <a
              href="/jumpshare-extract"
              className="inline-flex items-center px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30 rounded-lg transition-all"
            >
              <Zap className="h-4 w-4 mr-2" />
              Jumpshare Extractor
            </a>
            
            <a
              href="/bulk-import"
              className="inline-flex items-center px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-400/30 rounded-lg transition-all"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import CSV
            </a>
            
            <a
              href="/storage-setup"
              className="inline-flex items-center px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 rounded-lg transition-all"
            >
              <Cloud className="h-4 w-4 mr-2" />
              Storage Setup Guide
            </a>
            
            <a
              href="/vip"
              className="inline-flex items-center px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 rounded-lg transition-all"
            >
              <Music className="h-4 w-4 mr-2" />
              View VIP Page
            </a>
          </div>
        </header>

        <div className="space-y-6">
          {vipMixes.map((mix: VipMix) => (
            <div key={mix.id} className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{mix.title}</h3>
                  <p className="text-orange-200 mb-2">{mix.artist}</p>
                  <p className="text-gray-400 text-sm mb-4">{mix.description}</p>
                  
                  {editingMix === mix.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Jumpshare Download URL
                        </label>
                        <input
                          type="url"
                          value={formData.jumpshareUrl || ''}
                          onChange={(e) => setFormData({ ...formData, jumpshareUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50"
                          placeholder="https://jumpshare.com/download/your-mix-link"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Jumpshare Preview/Stream URL
                        </label>
                        <input
                          type="url"
                          value={formData.jumpsharePreviewUrl || ''}
                          onChange={(e) => setFormData({ ...formData, jumpsharePreviewUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50"
                          placeholder="https://jumpshare.com/preview/your-mix-link"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={saveChanges}
                          disabled={updateMixMutation.isPending}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-400/30 rounded-lg transition-all"
                        >
                          <Save className="h-4 w-4" />
                          <span>{updateMixMutation.isPending ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border border-gray-400/30 rounded-lg transition-all"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Download className="h-4 w-4 text-orange-400" />
                        <span className="text-gray-300">Download:</span>
                        <span className="text-orange-300">
                          {mix.jumpshareUrl || 'Not set'}
                        </span>
                        {mix.jumpshareUrl && (
                          <a 
                            href={mix.jumpshareUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:text-orange-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <Play className="h-4 w-4 text-orange-400" />
                        <span className="text-gray-300">Stream:</span>
                        <span className="text-orange-300">
                          {mix.jumpsharePreviewUrl || 'Not set'}
                        </span>
                        {mix.jumpsharePreviewUrl && (
                          <a 
                            href={mix.jumpsharePreviewUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:text-orange-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {editingMix !== mix.id && (
                  <button
                    onClick={() => startEditing(mix)}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30 rounded-lg transition-all"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Links</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-orange-500/10 border border-orange-400/30 rounded-lg">
          <h3 className="text-lg font-bold text-orange-300 mb-3">How To Get Jumpshare Links:</h3>
          <ol className="text-gray-300 space-y-2">
            <li>1. Upload your mix files to Jumpshare</li>
            <li>2. For downloads: Copy the direct download link</li>
            <li>3. For streaming: Copy the preview link (allows streaming without download)</li>
            <li>4. Paste both URLs in the form above and save</li>
          </ol>
        </div>
      </div>
    </div>
  );
}