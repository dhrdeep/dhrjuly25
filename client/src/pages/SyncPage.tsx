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
  const [result, setResult] = useState<SyncResult | null>(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            Sync DigitalOcean Space
          </h1>
          <p className="text-slate-400 text-lg">
            Automatically add new mix files from your Space to the database
          </p>
        </div>

        {/* Main Sync Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg mb-6">
          <div className="p-6">
            <h2 className="text-white text-xl font-semibold flex items-center gap-2 mb-2">
              <Database className="w-5 h-5" />
              Space Database Sync
            </h2>
            <p className="text-slate-400 mb-4">
              This will scan your DigitalOcean Space for new MP3 files and automatically 
              add them to the VIP mix database. Existing files will not be duplicated.
            </p>
            <button 
              onClick={handleSync}
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning Space...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Sync New Files
                </>
              )}
            </button>
          </div>
        </div>

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

        {/* Success Result */}
        {result && result.success && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg mb-6">
            <div className="p-6">
              <h2 className="text-green-400 text-xl font-semibold flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5" />
                Sync Completed Successfully
              </h2>
              <p className="text-green-300 mb-4">
                {result.message}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-white">{result.newFiles}</div>
                  <div className="text-sm text-slate-400">New Files Found</div>
                </div>
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-white">{result.addedMixes.length}</div>
                  <div className="text-sm text-slate-400">Mixes Added</div>
                </div>
              </div>

              {result.addedMixes.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Newly Added Mixes
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.addedMixes.map((mix) => (
                      <div key={mix.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{mix.title}</div>
                          <div className="text-sm text-slate-400">{mix.filename}</div>
                        </div>
                        <div className="px-2 py-1 bg-orange-600/20 text-orange-400 text-xs rounded">
                          ID: {mix.id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg">
          <div className="p-6">
            <h2 className="text-white text-xl font-semibold mb-4">How It Works</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center font-bold">1</div>
                <div>
                  <div className="text-white font-medium">Upload Files to DigitalOcean Space</div>
                  <div className="text-slate-400 text-sm">Add new MP3 files to your dhrmixes Space</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center font-bold">2</div>
                <div>
                  <div className="text-white font-medium">Run Sync Operation</div>
                  <div className="text-slate-400 text-sm">Click the sync button to scan for new files</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center font-bold">3</div>
                <div>
                  <div className="text-white font-medium">Automatic Database Update</div>
                  <div className="text-slate-400 text-sm">New mixes are automatically added and available to VIP users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SyncPage;