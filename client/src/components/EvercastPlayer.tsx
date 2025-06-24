import React from 'react';

interface EvercastPlayerProps {
  width?: string;
  serverId?: number;
}

export default function EvercastPlayer({ width = "1000px", serverId = 1 }: EvercastPlayerProps) {
  // Create a simple HTML5 audio player with basic controls
  return (
    <div style={{ width, minHeight: "200px" }} className="bg-black rounded-lg p-6">
      <div className="text-center mb-6">
        <div className="text-6xl font-black text-white tracking-wider mb-2">DHR</div>
        <div className="text-sm font-medium text-orange-400">DEEPHOUSE-RADIO.COM</div>
      </div>
      
      <div className="bg-orange-500 rounded-lg p-4 mb-4">
        <div className="text-black font-bold">Now Playing</div>
        <div className="text-black text-sm">Live Stream - DHR1 Premium</div>
      </div>
      
      <div className="flex justify-center mb-4">
        <audio 
          controls 
          className="w-full max-w-md"
          src="https://ec1.everestcast.host:2750/stream/1"
          preload="none"
        >
          Your browser does not support the audio element.
        </audio>
      </div>
      
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button className="bg-orange-500 text-white px-3 py-2 rounded text-sm hover:bg-orange-600">
          DHR1 Deep
        </button>
        <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700">
          DHR1 Tech
        </button>
        <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700">
          DHR1 Minimal
        </button>
        <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700">
          DHR1 Progressive
        </button>
      </div>
      
      <div className="text-center text-gray-400 text-sm">
        Premium Deep House Music • 320kbps Quality
      </div>
    </div>
  );
}