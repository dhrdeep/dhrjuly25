import React, { useState, useRef, useEffect } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  frequency: string;
  url: string;
  description: string;
  genre: string;
}

interface RadioDialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStationSelect: (station: Station) => void;
  currentStation?: Station;
}

const stations: Station[] = [
  {
    id: 'dhr1',
    name: 'DHR1 Premium',
    frequency: '88.1',
    url: 'https://ec1.everestcast.host:2750/stream',
    description: 'Deep House Radio Premium Channel',
    genre: 'Deep House'
  },
  {
    id: 'dhr2',
    name: 'DHR2 Exclusive',
    frequency: '92.5',
    url: 'https://ec1.everestcast.host:1480/stream',
    description: 'Exclusive DJ Sets & Underground',
    genre: 'Underground'
  },
  {
    id: 'free',
    name: 'DHR Free',
    frequency: '95.7',
    url: 'https://stream.dhr-free.com',
    description: 'Free Deep House Stream',
    genre: 'Deep House'
  },
  {
    id: 'vip',
    name: 'DHR VIP',
    frequency: '101.3',
    url: 'https://stream.dhr-vip.com',
    description: 'VIP Exclusive Content',
    genre: 'Exclusive'
  }
];

export default function RadioDialOverlay({ isOpen, onClose, onStationSelect, currentStation }: RadioDialOverlayProps) {
  const [selectedStation, setSelectedStation] = useState<Station>(currentStation || stations[0]);
  const [dialAngle, setDialAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate dial position based on selected station
  useEffect(() => {
    const stationIndex = stations.findIndex(s => s.id === selectedStation.id);
    const angle = (stationIndex / (stations.length - 1)) * 180 - 90; // -90 to 90 degrees
    setDialAngle(angle);
  }, [selectedStation]);

  // Handle mouse/touch events for dial interaction
  const handleDialStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dialRef.current) return;
    
    setIsDragging(true);
    const rect = dialRef.current.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    e.preventDefault();
  };

  const handleDialMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - centerRef.current.x;
    const deltaY = clientY - centerRef.current.y;
    
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = Math.max(-90, Math.min(90, angle)); // Constrain to -90 to 90 degrees
    
    setDialAngle(angle);
    
    // Find closest station based on angle
    const normalizedAngle = (angle + 90) / 180; // 0 to 1
    const stationIndex = Math.round(normalizedAngle * (stations.length - 1));
    const newStation = stations[Math.max(0, Math.min(stations.length - 1, stationIndex))];
    
    if (newStation.id !== selectedStation.id) {
      setSelectedStation(newStation);
    }
  };

  const handleDialEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDialMove);
      document.addEventListener('mouseup', handleDialEnd);
      document.addEventListener('touchmove', handleDialMove);
      document.addEventListener('touchend', handleDialEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDialMove);
        document.removeEventListener('mouseup', handleDialEnd);
        document.removeEventListener('touchmove', handleDialMove);
        document.removeEventListener('touchend', handleDialEnd);
      };
    }
  }, [isDragging]);

  const handleStationSelect = () => {
    onStationSelect(selectedStation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-amber-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-200 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Radio Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-amber-100 mb-2">DHR Radio Dial</h2>
          <p className="text-amber-300 text-sm">Tune to your favorite station</p>
        </div>

        {/* Frequency Display */}
        <div className="bg-black/30 rounded-lg p-4 mb-6 border-2 border-amber-600">
          <div className="text-center">
            <div className="text-3xl font-mono text-green-400 mb-1 tracking-wider">
              {selectedStation.frequency} FM
            </div>
            <div className="text-amber-200 font-semibold">{selectedStation.name}</div>
            <div className="text-amber-300 text-sm">{selectedStation.description}</div>
          </div>
        </div>

        {/* Radio Dial */}
        <div className="relative mb-6">
          <div className="w-64 h-32 mx-auto relative">
            {/* Dial Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-full border-4 border-amber-700"></div>
            
            {/* Frequency Markings */}
            <div className="absolute inset-0">
              {stations.map((station, index) => {
                const angle = (index / (stations.length - 1)) * 180 - 90;
                const markAngle = angle * (Math.PI / 180);
                const markX = Math.cos(markAngle) * 110 + 128;
                const markY = Math.sin(markAngle) * 110 + 120;
                
                return (
                  <div
                    key={station.id}
                    className="absolute text-xs text-amber-200 font-mono transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: markX,
                      top: markY,
                    }}
                  >
                    {station.frequency}
                  </div>
                );
              })}
            </div>

            {/* Dial Pointer */}
            <div
              ref={dialRef}
              className={`absolute w-6 h-24 cursor-pointer transform-gpu transition-transform ${
                isDragging ? '' : 'duration-300 ease-out'
              }`}
              style={{
                left: '50%',
                top: '100%',
                transformOrigin: '50% 0%',
                transform: `translateX(-50%) rotate(${dialAngle}deg)`,
              }}
              onMouseDown={handleDialStart}
              onTouchStart={handleDialStart}
            >
              <div className="w-full h-full bg-gradient-to-t from-red-600 to-red-400 rounded-full shadow-lg border-2 border-red-700">
                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
              </div>
            </div>

            {/* Center Knob */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full border-2 border-amber-700 shadow-lg"></div>
          </div>
        </div>

        {/* Volume Control */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-amber-200 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseInt(e.target.value));
                  if (parseInt(e.target.value) > 0) setIsMuted(false);
                }}
                className="w-full h-2 bg-amber-800 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #f79e02 0%, #f79e02 ${isMuted ? 0 : volume}%, #92400e ${isMuted ? 0 : volume}%, #92400e 100%)`
                }}
              />
            </div>
            <span className="text-amber-200 text-sm font-mono w-8">
              {isMuted ? '0' : volume}
            </span>
          </div>
        </div>

        {/* Station Info */}
        <div className="bg-black/20 rounded-lg p-3 mb-6 border border-amber-600">
          <div className="text-amber-200 text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold">Genre:</span>
              <span>{selectedStation.genre}</span>
            </div>
            <div className="text-xs text-amber-300">
              Now tuned to {selectedStation.frequency} FM - {selectedStation.name}
            </div>
          </div>
        </div>

        {/* Tune Button */}
        <button
          onClick={handleStationSelect}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Tune to {selectedStation.name}
        </button>
      </div>
    </div>
  );
}