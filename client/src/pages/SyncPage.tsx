import { useState } from 'react';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Music, Database } from 'lucide-react';

interface SyncResult {
  success: boolean;
  message: string;
  newFiles: number;
  addedMixes: Array<{
    id: number;
    title: string;
    filename: string;
  }>;
}

function SyncPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPatreonLoading, setIsPatreonLoading] = useState(false);
  const [isBmacLoading, setIsBmacLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [patreonResult, setPatreonResult] = useState<any>(null);
  const [bmacResult, setBmacResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/sync-space', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatreonSync = async () => {
    setIsPatreonLoading(true);
    setError(null);
    setPatreonResult(null);

    try {
      const response = await fetch('/api/sync-patreon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Patreon sync failed');
      }

      setPatreonResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsPatreonLoading(false);
    }
  };

  const handleBmacSync = async () => {
    setIsBmacLoading(true);
    setError(null);
    setBmacResult(null);

    try {
      const response = await fetch('/api/sync-bmac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Buy Me a Coffee sync failed');
      }

      setBmacResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsBmacLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent mb-2">
            Sync System
          </h1>
          <p className="text-gray-300">
            Synchronize Patreon subscribers, Buy Me a Coffee supporters, and DigitalOcean Spaces content
          </p>
        </header>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg mb-6 p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Sync Failed</span>
            </div>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Patreon Sync Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-orange-400/20 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-orange-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Patreon Sync</h2>
                <p className="text-gray-400">Sync all Patreon campaign members and tiers</p>
              </div>
            </div>
            
            <button
              onClick={handlePatreonSync}
              disabled={isPatreonLoading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                isPatreonLoading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {isPatreonLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              <span>{isPatreonLoading ? 'Syncing...' : 'Sync Patreon'}</span>
            </button>
          </div>

          {patreonResult && (
            <div className="mt-6 p-4 bg-green-900/30 border border-green-400/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-medium">Patreon Sync Complete</span>
              </div>
              <p className="text-green-200">{patreonResult.message}</p>
              <div className="text-sm text-green-300 mt-2">
                Total: {patreonResult.totalPatrons} | New: {patreonResult.newUsers} | Updated: {patreonResult.updatedUsers}
              </div>
            </div>
          )}
        </div>

        {/* Buy Me a Coffee Sync Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-blue-400/20 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Buy Me a Coffee Sync</h2>
                <p className="text-gray-400">Sync Buy Me a Coffee supporters</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleBmacSync}
            disabled={isBmacLoading}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isBmacLoading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isBmacLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            <span>{isBmacLoading ? 'Syncing...' : 'Sync BMAC'}</span>
          </button>

          {bmacResult && (
            <div className="mt-6 p-4 bg-green-900/30 border border-green-400/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-medium">BMAC Sync Complete</span>
              </div>
              <p className="text-green-200">{bmacResult.message}</p>
              <div className="text-sm text-green-300 mt-2">
                Total: {bmacResult.totalSupporters} | New: {bmacResult.newUsers} | Updated: {bmacResult.updatedUsers}
              </div>
            </div>
          )}
        </div>

        {/* DigitalOcean Spaces Sync Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-orange-400/20 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-orange-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">DigitalOcean Spaces Sync</h2>
                <p className="text-gray-400">Scan dhrmixes Space for new content</p>
              </div>
            </div>
            
            <button
              onClick={handleSync}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                isLoading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              <span>{isLoading ? 'Syncing...' : 'Sync Spaces'}</span>
            </button>
          </div>

          {result && result.success && (
            <div className="mt-6 p-4 bg-green-900/30 border border-green-400/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-medium">Spaces Sync Complete</span>
              </div>
              <p className="text-green-200">{result.message}</p>
              <div className="text-sm text-green-300 mt-2">
                New Files: {result.newFiles} | Added Mixes: {result.addedMixes.length}
              </div>
              {result.addedMixes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-green-200 font-medium mb-2">Newly Added:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.addedMixes.map((mix: any) => (
                      <div key={mix.id} className="text-sm text-green-100">
                        {mix.title} ({mix.filename})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Usage Instructions */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-400/20">
          <h2 className="text-xl font-bold text-white mb-4">Sync Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-400 font-bold">1</span>
              </div>
              <h3 className="font-bold text-orange-300 mb-2">Patreon Sync</h3>
              <p className="text-gray-400 text-sm">Import all campaign members with their subscription tiers and payment status</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <h3 className="font-bold text-blue-300 mb-2">BMAC Sync</h3>
              <p className="text-gray-400 text-sm">Add Buy Me a Coffee supporters with API key authentication</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-400 font-bold">3</span>
              </div>
              <h3 className="font-bold text-orange-300 mb-2">Spaces Sync</h3>
              <p className="text-gray-400 text-sm">Detect new MP3 files in DigitalOcean Space and add to VIP library</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SyncPage;