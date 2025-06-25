import React from 'react';
import { ExternalLink, Download, Play } from 'lucide-react';

interface JumpsharePreviewProps {
  mix: {
    id: number;
    title: string;
    artist: string;
    jumpshareUrl?: string;
    jumpsharePreviewUrl?: string;
  };
  canPlay: boolean;
  canDownload: boolean;
  onPlay: () => void;
  onDownload: () => void;
}

export default function JumpsharePreview({ 
  mix, 
  canPlay, 
  canDownload, 
  onPlay, 
  onDownload 
}: JumpsharePreviewProps) {
  return (
    <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4 mt-4">
      <div className="flex items-center space-x-2 mb-3">
        <ExternalLink className="h-4 w-4 text-orange-400" />
        <span className="text-sm font-medium text-orange-300">Jumpshare Integration</span>
      </div>
      
      <p className="text-xs text-gray-400 mb-3">
        This mix is hosted on Jumpshare. Click below to stream or download directly.
      </p>
      
      <div className="flex space-x-2">
        {mix.jumpsharePreviewUrl && (
          <button
            onClick={onPlay}
            disabled={!canPlay}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              canPlay
                ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30'
                : 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600/30'
            }`}
          >
            <Play className="h-3 w-3" />
            <span>Stream on Jumpshare</span>
          </button>
        )}
        
        {mix.jumpshareUrl && (
          <button
            onClick={onDownload}
            disabled={!canDownload}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              canDownload
                ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30'
                : 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600/30'
            }`}
          >
            <Download className="h-3 w-3" />
            <span>Download from Jumpshare</span>
          </button>
        )}
      </div>
    </div>
  );
}