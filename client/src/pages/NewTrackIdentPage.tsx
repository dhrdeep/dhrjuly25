import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Mic, MicOff, RotateCcw, Music, Headphones, Radio } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  confidence?: number;
  service?: string;
  duration?: number;
  releaseDate?: string;
  timestamp: string;
}

export default function NewTrackIdentPage() {
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  
  // Track identification state
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationStatus, setIdentificationStatus] = useState('');
  const [identifiedTracks, setIdentifiedTracks] = useState<Track[]>([]);
  const [autoIdentify, setAutoIdentify] = useState(false);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoIdentifyTimer = useRef<NodeJS.Timeout | null>(null);

  // Stream URL - using DHR stream
  const streamUrl = "https://streaming.shoutcast.com/dhr";

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (autoIdentifyTimer.current) {
        clearInterval(autoIdentifyTimer.current);
      }
    };
  }, []);

  // Auto-identification timer
  useEffect(() => {
    if (autoIdentify && isPlaying && !isIdentifying && connectionStatus === 'connected') {
      const interval = setInterval(() => {
        if (!isIdentifying && isPlaying && connectionStatus === 'connected') {
          handleIdentifyTrack();
        }
      }, 30000); // Every 30 seconds
      autoIdentifyTimer.current = interval;
    } else if (autoIdentifyTimer.current) {
      clearInterval(autoIdentifyTimer.current);
      autoIdentifyTimer.current = null;
    }

    return () => {
      if (autoIdentifyTimer.current) {
        clearInterval(autoIdentifyTimer.current);
      }
    };
  }, [autoIdentify, isPlaying, isIdentifying, connectionStatus]);

  const isDuplicateTrack = useCallback((newTrack: Track, existingTracks: Track[]) => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    
    return existingTracks.some(track => {
      const trackTime = new Date(track.timestamp).getTime();
      return (
        track.title.toLowerCase() === newTrack.title.toLowerCase() &&
        track.artist.toLowerCase() === newTrack.artist.toLowerCase() &&
        trackTime > twoHoursAgo
      );
    });
  }, []);

  const setupAudioCapture = async () => {
    try {
      if (!audioRef.current) {
        console.error('Audio element not available');
        return null;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioElement = audioRef.current;
      const audioContext = audioContextRef.current;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaElementSource(audioElement);
      const destination = audioContext.createMediaStreamDestination();
      
      if (!gainNodeRef.current) {
        gainNodeRef.current = audioContext.createGain();
        gainNodeRef.current.gain.value = isMuted ? 0 : volume;
      }

      source.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContext.destination);
      gainNodeRef.current.connect(destination);

      return destination.stream;
    } catch (error) {
      console.error('Audio capture setup error:', error);
      return null;
    }
  };

  const handleIdentifyTrack = useCallback(async () => {
    if (!isPlaying) {
      setIdentificationStatus('Please Start Playing Audio First');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return;
    }

    if (connectionStatus !== 'connected') {
      setIdentificationStatus('Audio Stream Not Connected');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return;
    }

    setIsIdentifying(true);
    setIdentificationStatus('Recording 14 Seconds For Track Identification...');

    try {
      const stream = await setupAudioCapture();
      if (!stream) {
        throw new Error('Failed to capture audio');
      }

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available');
      }

      console.log('Audio Tracks Found:', audioTracks.length);
      
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/ogg;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = '';
            }
          }
        }
      }

      if (!mimeType) {
        throw new Error('No supported audio format found');
      }

      console.log('Using MIME Type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 320000 // High quality for better fingerprinting
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('Audio chunk captured:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording Stopped, Processing Audio...');
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log('Audio Blob Created:', audioBlob.size, 'bytes');
        
        try {
          setIdentificationStatus('Processing Audio For Identification...');
          
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const arrayBuffer = reader.result as ArrayBuffer;
              const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              
              console.log('Starting track identification process...');
              console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
              console.log('Converted to base64, length:', base64Audio.length);

              const response = await fetch('/api/identify-track', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  audioBase64: base64Audio
                }),
              });

              const result = await response.json();
              console.log('Server identification result:', result);

              if (result.track) {
                const track: Track = {
                  id: result.track.id || `track_${Date.now()}`,
                  title: result.track.title,
                  artist: result.track.artist,
                  album: result.track.album,
                  artwork: result.track.artwork,
                  confidence: result.track.confidence,
                  service: result.track.service,
                  duration: result.track.duration,
                  releaseDate: result.track.releaseDate,
                  timestamp: new Date().toISOString()
                };

                if (!isDuplicateTrack(track, identifiedTracks)) {
                  setIdentifiedTracks(prev => [track, ...prev]);
                  setIdentificationStatus(`Track Identified: ${track.title} by ${track.artist}`);
                  console.log('Track identified and added:', track);
                } else {
                  setIdentificationStatus('Track Already Identified Recently');
                  console.log('Duplicate track detected, not adding');
                }
              } else {
                console.log('No track identified by server');
                setIdentificationStatus('No Track Match Found');
              }
            } catch (error) {
              console.error('Identification error:', error);
              setIdentificationStatus('Identification Failed');
            }
          };
          
          reader.readAsArrayBuffer(audioBlob);
        } catch (error) {
          console.error('Audio processing error:', error);
          setIdentificationStatus('Audio Processing Failed');
        }
        
        setIsIdentifying(false);
        setTimeout(() => {
          if (!autoIdentify) {
            setIdentificationStatus('');
          }
        }, 5000);
      };

      console.log('Starting Audio Recording...');
      mediaRecorder.start(1000); // Capture in 1-second chunks
      
      // Stop recording after 14 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 14000);
      
    } catch (error) {
      console.error('Audio capture error:', error);
      setIsIdentifying(false);
      setIdentificationStatus('Audio Capture Failed');
      setTimeout(() => setIdentificationStatus(''), 3000);
    }
  }, [isPlaying, connectionStatus, setupAudioCapture, isDuplicateTrack, identifiedTracks, autoIdentify]);

  const handlePlay = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setConnectionStatus('idle');
        setAutoIdentify(false);
      } else {
        try {
          setConnectionStatus('connecting');
          setIdentificationStatus('Connecting To Stream...');
          
          await audioRef.current.play();
          setIsPlaying(true);
          setConnectionStatus('connected');
          setIdentificationStatus('Stream Connected - Ready To Identify');
          setTimeout(() => setIdentificationStatus(''), 3000);
          
        } catch (error) {
          console.error('Play error:', error);
          setConnectionStatus('error');
          setIdentificationStatus('Connection Failed');
          setTimeout(() => setIdentificationStatus(''), 3000);
        }
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : newVolume;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newMuted ? 0 : volume;
    }
  };

  const clearHistory = () => {
    setIdentifiedTracks([]);
    setIdentificationStatus('History Cleared');
    setTimeout(() => setIdentificationStatus(''), 2000);
  };

  const searchTrack = (track: Track) => {
    const query = encodeURIComponent(`${track.artist} ${track.title}`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  const formatDublinTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IE', {
      timeZone: 'Europe/Dublin',
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mr-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-orange-400">Advanced Track Identifier</h1>
              <p className="text-slate-300 text-lg mt-2">AI-Powered Music Recognition System</p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="mt-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
              connectionStatus === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              <Radio className="w-4 h-4 mr-2" />
              {connectionStatus === 'connected' ? 'Stream Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'error' ? 'Connection Error' :
               'Stream Disconnected'}
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-8">
          <audio
            ref={audioRef}
            src={streamUrl}
            crossOrigin="anonymous"
            preload="none"
          />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePlay}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              
              <div className="flex items-center space-x-2">
                <button onClick={toggleMute} className="text-slate-400 hover:text-white">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 accent-orange-500"
                />
              </div>
            </div>

            <div className="text-sm text-slate-400">
              <span className="flex items-center">
                <Headphones className="w-4 h-4 mr-1" />
                DHR Live Stream
              </span>
            </div>
          </div>
        </div>

        {/* Track Identification Controls */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-orange-400 mb-2">Track Identification</h2>
            <p className="text-slate-400">14-Second Audio Capture For Optimal Recognition</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
            <button
              onClick={handleIdentifyTrack}
              disabled={!isPlaying || isIdentifying}
              className={`px-6 py-3 rounded-xl flex items-center space-x-2 font-medium transition-colors ${
                !isPlaying || isIdentifying
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>{isIdentifying ? 'Identifying...' : 'Identify Track'}</span>
            </button>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoIdentify}
                onChange={(e) => setAutoIdentify(e.target.checked)}
                disabled={!isPlaying}
                className="rounded border-slate-600 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-slate-300">Auto-Identify (30s intervals)</span>
            </label>

            <button
              onClick={clearHistory}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          </div>

          {identificationStatus && (
            <div className="text-center text-sm text-slate-300 bg-slate-700/50 rounded-lg p-3">
              {identificationStatus}
            </div>
          )}
        </div>

        {/* Identified Tracks */}
        {identifiedTracks.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-orange-400 mb-4">
              Identified Tracks ({identifiedTracks.length})
            </h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {identifiedTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-lg">{track.title}</h4>
                      <p className="text-slate-300">{track.artist}</p>
                      {track.album && (
                        <p className="text-slate-400 text-sm">{track.album}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                        <span>{formatDublinTime(track.timestamp)}</span>
                        {track.service && <span>via {track.service}</span>}
                        {track.confidence && <span>{track.confidence}% match</span>}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => searchTrack(track)}
                      className="px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 text-sm"
                    >
                      Search
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}