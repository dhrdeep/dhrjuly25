import React, { useState, useEffect } from 'react';
import { Volume2, Clock, ExternalLink } from 'lucide-react';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const PlayerPopoutPage: React.FC = () => {
  const [liveTrackInfo, setLiveTrackInfo] = useState<{artist: string, title: string} | null>(null);

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  };

  // Fetch live track metadata
  useEffect(() => {
    const fetchLiveMetadata = async () => {
      try {
        const response = await fetch('/api/live-metadata');
        if (response.ok) {
          const data = await response.json();
          if (data.artist && data.title) {
            setLiveTrackInfo({ artist: data.artist, title: data.title });
          }
        }
      } catch (error) {
        console.error('Failed to fetch live metadata:', error);
      }
    };

    // Fetch immediately and then every 30 seconds
    fetchLiveMetadata();
    const metadataInterval = setInterval(fetchLiveMetadata, 30000);

    return () => clearInterval(metadataInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-orange-400/30">
          {/* Player Header */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              <img 
                src={DHR_LOGO_URL} 
                alt="DHR Logo"
                className="h-20 w-20 rounded-2xl shadow-2xl border-2 border-orange-400/50 mx-auto"
                onError={handleArtworkError}
              />
              <div className="absolute inset-0 rounded-2xl bg-orange-400/20 animate-pulse"></div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">DHR Live Stream</h1>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-orange-400">LIVE NOW</span>
            </div>
            
            {/* Live Track Info */}
            {liveTrackInfo && (
              <div className="mt-4 p-4 bg-orange-500/10 rounded-lg border border-orange-400/20">
                <div className="text-center">
                  <div className="text-sm text-orange-400 font-semibold mb-1">Now Playing:</div>
                  <div className="text-white font-medium">{liveTrackInfo.artist}</div>
                  <div className="text-gray-300 text-sm">"{liveTrackInfo.title}"</div>
                </div>
              </div>
            )}
          </div>

          {/* Audio Player */}
          <div className="mb-6">
            <audio 
              controls 
              autoPlay
              className="w-full rounded-lg"
              src="https://streaming.shoutcast.com/dhr"
              preload="none"
              style={{
                background: '#1f2937',
                borderRadius: '8px'
              }}
            >
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* Player Controls */}
          <div className="flex justify-center space-x-4 mb-6">
            <button 
              onClick={() => window.open('https://deephouse-radio.com', '_blank')}
              className="flex items-center space-x-2 bg-orange-500/20 hover:bg-orange-500/30 px-4 py-2 rounded-lg text-orange-400 hover:text-orange-300 transition-colors"
              title="Visit Main Site"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">Main Site</span>
            </button>
            
            <button 
              onClick={() => {
                const minutes = prompt('Sleep timer (minutes):');
                if (minutes && !isNaN(Number(minutes))) {
                  setTimeout(() => {
                    const audio = document.querySelector('audio');
                    if (audio) audio.pause();
                    alert('Sleep timer activated - player stopped');
                  }, Number(minutes) * 60 * 1000);
                  alert(`Sleep timer set for ${minutes} minutes`);
                }
              }}
              className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
              title="Sleep Timer"
            >
              <Clock className="h-4 w-4" />
              <span className="text-sm">Sleep Timer</span>
            </button>
          </div>

          {/* Stream Info */}
          <div className="text-center text-sm text-gray-400">
            <p className="mb-2">
              <Volume2 className="h-4 w-4 inline mr-1" />
              128kbps • Free Stream • 24/7
            </p>
            <p className="text-orange-400 font-medium">Deep House Radio</p>
            <p className="text-xs mt-2">The Deepest Beats On The Net</p>
            <p className="mt-2 text-xs text-orange-400">Upgrade For 320kbps Premium Streams</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPopoutPage;