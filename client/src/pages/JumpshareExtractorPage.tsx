import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Search, Cloud, Zap } from 'lucide-react';

interface ExtractedMix {
  title: string;
  artist: string;
  genre: string;
  duration: string;
  fileSize: string;
  filePath: string;
  jumpshareUrl: string;
  jumpsharePreviewUrl: string;
  artworkUrl: string;
  description: string;
  tags: string;
  rating: number;
  totalDownloads: number;
  isExclusive: boolean;
  isActive: boolean;
}

export default function JumpshareExtractorPage() {
  const [jumpshareData, setJumpshareData] = useState('');
  const [extractedMixes, setExtractedMixes] = useState<ExtractedMix[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const queryClient = useQueryClient();

  const bulkImportMutation = useMutation({
    mutationFn: async (mixes: ExtractedMix[]) => {
      return apiRequest('/api/vip-mixes/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ mixes }),
      });
    },
    onSuccess: (data) => {
      setImportResults(data);
      queryClient.invalidateQueries({ queryKey: ['/api/vip-mixes'] });
    },
    onError: (error) => {
      console.error('Bulk import failed:', error);
      setImportResults({ success: 0, errors: [error.message] });
    },
  });

  const extractMixesFromJumpshare = () => {
    if (!jumpshareData.trim()) return;
    
    setIsProcessing(true);
    const lines = jumpshareData.trim().split('\n');
    const mixes: ExtractedMix[] = [];
    
    // Look for lines with .mp3 files in the activity log
    for (const line of lines) {
      if (line.includes('.mp3') && line.includes('Someone viewed')) {
        // Extract filename from the log entry
        const match = line.match(/'([^']+\.mp3)'/);
        if (match) {
          const filename = match[1];
          
          // Skip if it's a duplicate
          if (mixes.some(mix => mix.title === filename)) continue;
          
          // Extract info from filename
          const mixInfo = parseFilename(filename);
          
          mixes.push({
            title: mixInfo.title,
            artist: mixInfo.artist,
            genre: mixInfo.genre,
            duration: '1h 30m', // Default duration
            fileSize: '200 MB', // Default size
            filePath: '', // External hosting, no local path
            jumpshareUrl: `https://jumpshare.com/v/${generateJumpshareId(filename)}`, // Generated URL
            jumpsharePreviewUrl: `https://jumpshare.com/preview/${generateJumpshareId(filename)}`, // Preview URL
            artworkUrl: '', // No artwork initially
            description: `${mixInfo.title} - ${mixInfo.artist}`,
            tags: `${mixInfo.genre},deep house,${mixInfo.artist.toLowerCase().replace(/\s+/g, ',')}`,
            rating: 0,
            totalDownloads: 0,
            isExclusive: true,
            isActive: true
          });
        }
      }
    }
    
    setExtractedMixes(mixes);
    setIsProcessing(false);
  };

  const parseFilename = (filename: string) => {
    // Remove .mp3 extension
    let name = filename.replace('.mp3', '');
    
    // Common patterns to extract artist and title
    let artist = 'Unknown Artist';
    let title = name;
    let genre = 'deep house';
    
    // Pattern 1: "Artist - Title"
    if (name.includes(' - ')) {
      const parts = name.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
    // Pattern 2: "Artist_ Title" or "Artist Title"
    else if (name.includes('_')) {
      const parts = name.split('_');
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' ').trim();
      }
    }
    // Pattern 3: Extract from common podcast formats
    else if (name.toLowerCase().includes('session') || name.toLowerCase().includes('mix')) {
      // Keep full name as title, try to extract artist from beginning
      const words = name.split(' ');
      if (words.length > 2) {
        artist = words.slice(0, 2).join(' ');
        title = name;
      }
    }
    
    // Determine genre from keywords
    if (name.toLowerCase().includes('tech house')) genre = 'tech house';
    else if (name.toLowerCase().includes('progressive')) genre = 'progressive';
    else if (name.toLowerCase().includes('minimal')) genre = 'minimal';
    else if (name.toLowerCase().includes('afro')) genre = 'afro house';
    
    return { artist: cleanString(artist), title: cleanString(title), genre };
  };

  const cleanString = (str: string) => {
    return str
      .replace(/[_\(\)\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const generateJumpshareId = (filename: string) => {
    // Generate a sample Jumpshare ID (you'll need to replace with actual URLs)
    const hash = filename.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash).toString(36).substring(0, 8);
  };

  const importExtractedMixes = () => {
    if (extractedMixes.length === 0) return;
    bulkImportMutation.mutate(extractedMixes);
  };

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent mb-4">
            Jumpshare Collection Extractor
          </h1>
          <p className="text-xl text-gray-300">Extract Mix Data From Your Jumpshare Activity Export</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <h2 className="text-2xl font-black text-orange-300 mb-4 flex items-center">
                <Upload className="h-6 w-6 mr-2" />
                Paste Jumpshare Export Data
              </h2>
              
              <textarea
                value={jumpshareData}
                onChange={(e) => setJumpshareData(e.target.value)}
                placeholder={`Paste your Jumpshare CSV export here. Should contain lines like:
"2025-06-06 18:42:01","Someone viewed 'LUCIDFLOW RADIO 189_ RIKO FORINSON.mp3' for the first time"
"2025-06-05 19:41:58","Someone viewed 'marshallbuti_2022-04-22T11_39_09-07_00.mp3' for the first time"`}
                className="w-full h-64 px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/50 font-mono text-sm"
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={extractMixesFromJumpshare}
                  disabled={!jumpshareData.trim() || isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 disabled:bg-gray-500/20 disabled:text-gray-400 text-orange-300 border border-orange-400/30 rounded-lg transition-all"
                >
                  <Zap className="h-4 w-4" />
                  <span>{isProcessing ? 'Extracting...' : 'Extract Mixes'}</span>
                </button>
                
                {extractedMixes.length > 0 && (
                  <button
                    onClick={importExtractedMixes}
                    disabled={bulkImportMutation.isPending}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:bg-gray-500/20 disabled:text-gray-400 text-green-300 border border-green-400/30 rounded-lg transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{bulkImportMutation.isPending ? 'Importing...' : `Import ${extractedMixes.length} Mixes`}</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    // Load sample data for testing
                    const sampleData = `"2025-06-06 18:42:01","Someone viewed 'LUCIDFLOW RADIO 189_ RIKO FORINSON [LUCIDFLOW.BANDCAMP.COM] (1).mp3' for the first time"
"2025-06-05 19:41:58","Someone viewed 'marshallbuti_2022-04-22T11_39_09-07_00.mp3' for the first time"
"2025-06-05 19:41:40","Someone viewed 'THE DEEP SESSION 049 HOSTED BY LEBRICO [GUEST MIX BY VALLIE M (Urban Deep Essentials)].mp3' for the first time"
"2025-06-05 19:41:20","Someone viewed 'RISE  Episode 1  Buddynice Rise Mix.mp3' for the first time"
"2025-06-01 08:20:33","Someone viewed 'La Rose - Smooth Shadows Episode 35 - Crack D.mp3' for the first time"`;
                    setJumpshareData(sampleData);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 rounded-lg transition-all text-sm"
                >
                  <FileText className="h-3 w-3" />
                  <span>Load Sample</span>
                </button>
              </div>
            </div>

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
                      <ul className="list-disc list-inside space-y-1 text-red-200 text-sm max-h-32 overflow-y-auto">
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

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
              <h2 className="text-2xl font-black text-orange-300 mb-4 flex items-center">
                <Search className="h-6 w-6 mr-2" />
                Extracted Mixes Preview
              </h2>
              
              {extractedMixes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {extractedMixes.slice(0, 10).map((mix, index) => (
                    <div key={index} className="p-3 bg-gray-700/30 rounded-lg">
                      <h3 className="text-white font-semibold text-sm">{mix.title}</h3>
                      <p className="text-orange-300 text-xs">{mix.artist}</p>
                      <p className="text-gray-400 text-xs">{mix.genre} • {mix.duration}</p>
                    </div>
                  ))}
                  {extractedMixes.length > 10 && (
                    <p className="text-gray-400 text-sm text-center">
                      And {extractedMixes.length - 10} more mixes...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No mixes extracted yet. Paste your Jumpshare data and click "Extract Mixes".
                </p>
              )}
            </div>

            <div className="bg-blue-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20">
              <h3 className="text-xl font-bold text-blue-300 mb-3">Next Steps:</h3>
              <ol className="text-gray-300 space-y-2 text-sm">
                <li>1. Extract mixes from your Jumpshare activity log</li>
                <li>2. Review the generated mix data and metadata</li>
                <li>3. Import all mixes into your VIP collection</li>
                <li>4. Update Jumpshare URLs with actual links in VIP Admin</li>
                <li>5. Your searchable mix library will be ready!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}