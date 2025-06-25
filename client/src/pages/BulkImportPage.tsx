import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Search, Cloud } from 'lucide-react';

interface BulkMix {
  title: string;
  artist: string;
  genre: string;
  duration: string;
  fileSize: string;
  jumpshareUrl: string;
  jumpsharePreviewUrl?: string;
  artworkUrl?: string;
  description?: string;
  tags?: string;
}

export default function BulkImportPage() {
  const [csvData, setCsvData] = useState('');
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const bulkImportMutation = useMutation({
    mutationFn: async (mixes: BulkMix[]) => {
      return apiRequest('/api/vip-mixes/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ mixes }),
      });
    },
    onSuccess: (data) => {
      setImportResults(data);
      queryClient.invalidateQueries({ queryKey: ['/api/vip-mixes'] });
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error('Bulk import failed:', error);
      setImportResults({ success: 0, errors: [error.message] });
      setIsProcessing(false);
    },
  });

  const downloadTemplate = () => {
    const template = `title,artist,genre,duration,fileSize,jumpshareUrl,jumpsharePreviewUrl,artworkUrl,description,tags
"Deep House Vibes Vol. 1","DJ Example","deep house","1h 30m","210 MB","https://jumpshare.com/download/mix1","https://jumpshare.com/preview/mix1","https://example.com/artwork1.jpg","Amazing deep house journey","deep,house,electronic"
"Tech House Sessions","Another DJ","tech house","2h 15m","315 MB","https://jumpshare.com/download/mix2","https://jumpshare.com/preview/mix2","https://example.com/artwork2.jpg","Underground tech house","tech,house,underground"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vip-mixes-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processCsv = () => {
    if (!csvData.trim()) return;
    
    setIsProcessing(true);
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const mixes: BulkMix[] = [];
    const errors: string[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const mix: any = {};
        
        headers.forEach((header, index) => {
          mix[header] = values[index] || '';
        });
        
        // Validate required fields
        if (!mix.title || !mix.artist || !mix.jumpshareUrl) {
          errors.push(`Row ${i + 1}: Missing required fields (title, artist, jumpshareUrl)`);
          continue;
        }
        
        mixes.push({
          title: mix.title,
          artist: mix.artist,
          genre: mix.genre || 'deep house',
          duration: mix.duration || '1h 30m',
          fileSize: mix.fileSize || '200 MB',
          jumpshareUrl: mix.jumpshareUrl,
          jumpsharePreviewUrl: mix.jumpsharePreviewUrl,
          artworkUrl: mix.artworkUrl,
          description: mix.description,
          tags: mix.tags
        });
      } catch (error) {
        errors.push(`Row ${i + 1}: Invalid CSV format`);
      }
    }
    
    if (errors.length > 0) {
      setImportResults({ success: 0, errors });
      setIsProcessing(false);
      return;
    }
    
    bulkImportMutation.mutate(mixes);
  };

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent mb-4">
            Bulk Import VIP Mixes
          </h1>
          <p className="text-xl text-gray-300">Import Your 1000+ Mix Collection From CSV</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Instructions & Template */}
          <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <h2 className="text-2xl font-black text-orange-300 mb-4 flex items-center">
                <FileText className="h-6 w-6 mr-2" />
                CSV Import Instructions
              </h2>
              
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-bold text-orange-200 mb-2">Required Columns:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>title</strong> - Mix title</li>
                    <li><strong>artist</strong> - Artist/DJ name</li>
                    <li><strong>jumpshareUrl</strong> - Download link (can be any hosting URL)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-orange-200 mb-2">Optional Columns:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>genre</strong> - Music genre</li>
                    <li><strong>duration</strong> - Mix length</li>
                    <li><strong>fileSize</strong> - File size</li>
                    <li><strong>jumpsharePreviewUrl</strong> - Stream link</li>
                    <li><strong>artworkUrl</strong> - Cover image</li>
                    <li><strong>description</strong> - Mix description</li>
                    <li><strong>tags</strong> - Search tags (comma-separated)</li>
                  </ul>
                </div>
              </div>
              
              <button
                onClick={downloadTemplate}
                className="mt-4 flex items-center space-x-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30 rounded-lg transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Download CSV Template</span>
              </button>
            </div>

            {/* Jumpshare Integration Guide */}
            <div className="bg-blue-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20">
              <h2 className="text-2xl font-black text-blue-300 mb-4">
                Need Help With Storage Setup?
              </h2>
              
              <p className="text-gray-300 mb-4">
                Ready to import your mix collection? Use the example data or paste your own CSV. 
                For 1000+ mixes, check our storage setup guides for the best hosting solution.
              </p>
              
              <div className="flex gap-4">
                <a
                  href="/storage-setup"
                  className="inline-flex items-center px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 rounded-lg transition-all"
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  View Storage Setup Guide
                </a>
                
                <button
                  onClick={() => {
                    const exampleCsv = `title,artist,genre,duration,fileSize,jumpshareUrl,jumpsharePreviewUrl,artworkUrl,description,tags
"Deep House Vibes Vol. 1","DJ Example","deep house","1h 30m","210 MB","https://jumpshare.com/download/mix1","https://jumpshare.com/preview/mix1","https://example.com/artwork1.jpg","Amazing deep house journey","deep,house,electronic,chill"
"Tech House Sessions","Another DJ","tech house","2h 15m","315 MB","https://jumpshare.com/download/mix2","https://jumpshare.com/preview/mix2","https://example.com/artwork2.jpg","Underground tech house","tech,house,underground,energy"
"Melodic Progressive","Third Artist","progressive","1h 45m","250 MB","https://jumpshare.com/download/mix3","https://jumpshare.com/preview/mix3","https://example.com/artwork3.jpg","Emotional progressive journey","progressive,melodic,emotional"`;
                    setCsvData(exampleCsv);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-400/30 rounded-lg transition-all"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Load Example CSV
                </button>
              </div>
            </div>
          </div>

          {/* CSV Input & Processing */}
          <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <h2 className="text-2xl font-black text-orange-300 mb-4 flex items-center">
                <Upload className="h-6 w-6 mr-2" />
                Paste CSV Data
              </h2>
              
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="Paste your CSV data here..."
                className="w-full h-64 px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 font-mono text-sm"
              />
              
              <button
                onClick={processCsv}
                disabled={!csvData.trim() || isProcessing}
                className="mt-4 w-full flex items-center justify-center space-x-2 px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 disabled:bg-gray-500/20 disabled:text-gray-400 text-orange-300 border border-orange-400/30 rounded-lg transition-all"
              >
                <Upload className="h-5 w-5" />
                <span>{isProcessing ? 'Processing...' : 'Import Mixes'}</span>
              </button>
            </div>

            {/* Results */}
            {importResults && (
              <div className={`bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border ${
                importResults.errors.length > 0 ? 'border-red-400/20' : 'border-green-400/20'
              }`}>
                <h2 className="text-2xl font-black mb-4 flex items-center">
                  {importResults.errors.length > 0 ? (
                    <>
                      <AlertCircle className="h-6 w-6 mr-2 text-red-400" />
                      <span className="text-red-300">Import Results</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-6 w-6 mr-2 text-green-400" />
                      <span className="text-green-300">Import Successful</span>
                    </>
                  )}
                </h2>
                
                <div className="space-y-2">
                  <p className="text-green-300">
                    Successfully imported: <strong>{importResults.success}</strong> mixes
                  </p>
                  
                  {importResults.errors.length > 0 && (
                    <div>
                      <p className="text-red-300 mb-2">Errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-red-200 text-sm">
                        {importResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}