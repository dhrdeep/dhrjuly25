import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Headphones } from 'lucide-react';
import { identifyTrack, Track } from '../services/audioRecognition';

// Mock subscription service for demo
const mockSubscriptionService = {
  getCurrentUser: () => ({ subscriptionTier: 'vip', username: 'demo_user' })
};

const TrackIdentPage: React.FC = () => {
  // All hooks declared at the top level
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [autoIdentify, setAutoIdentify] = useState(true);
  const [identifiedTracks, setIdentifiedTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [streamUrl] = useState('https://streaming.shoutcast.com/dhr');
  const [identificationStatus, setIdentificationStatus] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'connecting' | 'error'>('idle');
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(32).fill(0));

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoIdentifyTimer = useRef<NodeJS.Timeout | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const user = mockSubscriptionService.getCurrentUser();
    if (user) {
      setSubscriptionTier(user.subscriptionTier);
      setHasAccess(['dhr1', 'dhr2', 'vip'].includes(user.subscriptionTier));
    } else {
      setSubscriptionTier('vip');
      setHasAccess(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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

  const setupAudioVisualization = useCallback(async () => {
    if (!audioRef.current || !audioContextRef.current) return;

    try {
      if (!sourceNodeRef.current) {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      }

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      
      sourceNodeRef.current.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        setVisualizerData(Array.from(dataArray));
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    } catch (error) {
      console.error('Visualization setup error:', error);
    }
  }, []);

  const setupAudioCapture = useCallback(async () => {
    try {
      if (!audioRef.current) {
        console.error('Audio element not available');
        return null;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (!sourceNodeRef.current) {
        sourceNodeRef.current = audioContext.createMediaElementSource(audioRef.current);
        gainNodeRef.current = audioContext.createGain();
        gainNodeRef.current.gain.value = isMuted ? 0 : volume;
        destinationRef.current = audioContext.createMediaStreamDestination();
        
        sourceNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContext.destination);
        gainNodeRef.current.connect(destinationRef.current);
      }

      return destinationRef.current?.stream || null;
    } catch (error) {
      console.error('Audio capture setup error:', error);
      setIdentificationStatus('Audio Setup Failed. Check Browser Permissions.');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return null;
    }
  }, [isMuted, volume]);

  const captureStreamAudio = useCallback(async () => {
    try {
      setIsIdentifying(true);
      setIdentificationStatus('Identifying...');
      
      const stream = await setupAudioCapture();
      if (!stream) {
        setIsIdentifying(false);
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIdentificationStatus('Processing...');
        
        if (chunksRef.current.length === 0) {
          setIdentificationStatus('No Audio Data Captured');
          setIsIdentifying(false);
          setTimeout(() => setIdentificationStatus(''), 3000);
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size < 5000) {
          setIdentificationStatus('Audio Sample Too Small');
          setIsIdentifying(false);
          setTimeout(() => setIdentificationStatus(''), 3000);
          return;
        }
        
        try {
          const track = await identifyTrack(audioBlob);
          
          if (track) {
            if (isDuplicateTrack(track, identifiedTracks)) {
              setIdentificationStatus('Track Already Identified Recently');
              setIsIdentifying(false);
              setTimeout(() => setIdentificationStatus(''), 3000);
              return;
            }
            
            setCurrentTrack(track);
            setIdentifiedTracks(prev => [track, ...prev].slice(0, 50));
            setIdentificationStatus(`Found: ${track.title} - ${track.artist}`);
          } else {
            setIdentificationStatus('No Match Found');
          }
        } catch (error) {
          console.error('Track identification failed:', error);
          setIdentificationStatus('Identification Failed');
        }
        
        setIsIdentifying(false);
        setTimeout(() => setIdentificationStatus(''), 5000);
      };

      mediaRecorder.start(1000);
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 15000);
      
    } catch (error) {
      console.error('Audio capture error:', error);
      setIsIdentifying(false);
      setIdentificationStatus('Audio Capture Failed');
      setTimeout(() => setIdentificationStatus(''), 3000);
    }
  }, [setupAudioCapture, isDuplicateTrack, identifiedTracks]);

  const handlePlay = useCallback(async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setConnectionStatus('idle');
      } else {
        try {
          setConnectionStatus('connecting');
          setIdentificationStatus('Connecting...');
          
          await audioRef.current.play();
          setIsPlaying(true);
          setConnectionStatus('connected');
          setIdentificationStatus('Ready To Identify Tracks...');
          setTimeout(() => setIdentificationStatus(''), 3000);
          
          setTimeout(async () => {
            await setupAudioVisualization();
          }, 1000);
          
        } catch (error) {
          console.error('Play error:', error);
          setConnectionStatus('error');
          setIdentificationStatus('Connection Failed');
          setTimeout(() => setIdentificationStatus(''), 3000);
        }
      }
    }
  }, [isPlaying, setupAudioVisualization]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : newVolume;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  const handleIdentifyTrack = useCallback(() => {
    if (!isPlaying) {
      setIdentificationStatus('Please Start Playing First');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return;
    }
    
    if (connectionStatus !== 'connected') {
      setIdentificationStatus('Stream Not Connected');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return;
    }
    
    if (!isIdentifying) {
      captureStreamAudio();
    }
  }, [isPlaying, connectionStatus, isIdentifying, captureStreamAudio]);

  // Auto-identify effect
  useEffect(() => {
    if (autoIdentify && isPlaying && !isIdentifying && connectionStatus === 'connected') {
      const interval = setInterval(() => {
        if (!isIdentifying && isPlaying && connectionStatus === 'connected') {
          captureStreamAudio();
        }
      }, 60000);
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
  }, [autoIdentify, isPlaying, isIdentifying, connectionStatus, captureStreamAudio]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Track Identifier Access</h2>
            <p className="text-slate-300 mb-6">
              Track identification requires a DHR subscription. Upgrade to access AI-powered music recognition.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <a 
              href="https://patreon.com/deephouseradio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg text-white font-bold transition-colors"
            >
              Subscribe Now
            </a>
            <Link 
              to="/" 
              className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg text-white font-bold transition-colors text-center"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
              <span className="text-white font-bold text-lg">DHR</span>
            </div>
            <h1 className="text-3xl font-bold text-orange-400">DHR Track Identifier</h1>
          </div>
          <p className="text-slate-300 text-lg">Live Radio With Intelligent Track Identification</p>
          
          {/* Connection Status */}
          <div className="mt-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
              connectionStatus === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-600/20 text-slate-400'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connectionStatus === 'connected' ? 'bg-green-400' :
                connectionStatus === 'connecting' ? 'bg-yellow-400' :
                connectionStatus === 'error' ? 'bg-red-400' :
                'bg-slate-400'
              }`}></div>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting' :
               connectionStatus === 'error' ? 'Error' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
          {/* Visualizer */}
          <div className="flex items-end justify-center space-x-1 h-24 mb-8">
            {visualizerData.slice(0, 16).map((value, index) => (
              <div
                key={index}
                className="bg-orange-500 rounded-full transition-all duration-150"
                style={{
                  height: `${Math.max(4, (value / 255) * 80)}px`,
                  width: '8px',
                  opacity: isPlaying ? 0.8 : 0.3
                }}
              />
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlay}
              className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors shadow-lg"
            >
              {isPlaying ? (
                <div className="flex space-x-1">
                  <div className="w-1.5 h-6 bg-white rounded"></div>
                  <div className="w-1.5 h-6 bg-white rounded"></div>
                </div>
              ) : (
                <Play className="h-8 w-8 text-white ml-1" />
              )}
            </button>

            {/* Identify Button */}
            <button
              onClick={handleIdentifyTrack}
              disabled={!isPlaying || connectionStatus !== 'connected' || isIdentifying}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                isIdentifying 
                  ? 'bg-slate-600 cursor-not-allowed' 
                  : !isPlaying || connectionStatus !== 'connected'
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {isIdentifying ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Headphones className="h-8 w-8 text-white" />
              )}
            </button>

            {/* Volume Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Auto-Identify Toggle */}
          <div className="flex items-center justify-center mb-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <span className="text-slate-300">Auto-Identify</span>
              <div
                onClick={() => setAutoIdentify(!autoIdentify)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  autoIdentify ? 'bg-orange-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    autoIdentify ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
          </div>

          {/* Status */}
          {identificationStatus && (
            <div className="text-center mb-6">
              <p className="text-slate-300">{identificationStatus}</p>
            </div>
          )}

          {/* Current Track */}
          {currentTrack && (
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-orange-400 mb-2">Now Playing</h3>
              <p className="text-white font-medium">{currentTrack.title}</p>
              <p className="text-slate-300">{currentTrack.artist}</p>
              {currentTrack.album && currentTrack.album !== 'Unknown Album' && (
                <p className="text-slate-400 text-sm">{currentTrack.album}</p>
              )}
            </div>
          )}

          {/* Track History */}
          {identifiedTracks.length > 0 && (
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-orange-400 mb-4">Recent Tracks</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {identifiedTracks.slice(0, 10).map((track) => (
                  <div key={track.id} className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
                    {track.artwork && (
                      <img
                        src={track.artwork}
                        alt="Album Art"
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{track.title}</p>
                      <p className="text-slate-300 text-sm truncate">{track.artist}</p>
                      <p className="text-slate-400 text-xs">
                        {new Date(track.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={streamUrl}
          preload="none"
          crossOrigin="anonymous"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default TrackIdentPage;