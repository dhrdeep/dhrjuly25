import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Music, Mic, Headphones, Search, Download, Share, Heart, RotateCcw, Settings, Zap, Clock, Activity, Disc3, Radio } from 'lucide-react';
import { identifyTrack, Track } from '../services/audioRecognition';

// Mock subscription service for demo
const mockSubscriptionService = {
  getCurrentUser: () => ({ subscriptionTier: 'vip', username: 'demo_user' })
};

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

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
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(64).fill(0));
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoIdentifyTimer = useRef<NodeJS.Timeout | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      
      sourceNodeRef.current.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      
      setAudioAnalyser(analyser);
      
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
      setIsRecording(true);
      setRecordingProgress(0);
      setIdentificationStatus('Capturing Audio From Stream...');
      
      const stream = await setupAudioCapture();
      if (!stream) {
        setIsIdentifying(false);
        setIsRecording(false);
        return;
      }

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/ogg;codecs=opus';
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Progress animation
      const progressInterval = setInterval(() => {
        setRecordingProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 1000);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setRecordingProgress(0);
        setIdentificationStatus('Analyzing Audio Fingerprint...');
        
        if (chunksRef.current.length === 0) {
          setIdentificationStatus('No Audio Data Captured. Check Stream Volume.');
          setIsIdentifying(false);
          setTimeout(() => setIdentificationStatus(''), 3000);
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        if (audioBlob.size < 5000) {
          setIdentificationStatus('Audio Sample Too Small. Increase Volume.');
          setIsIdentifying(false);
          setTimeout(() => setIdentificationStatus(''), 3000);
          return;
        }
        
        try {
          const track = await identifyTrack(audioBlob);
          
          if (track) {
            if (isDuplicateTrack(track, identifiedTracks)) {
              setIdentificationStatus('Track Already Identified Recently.');
              setIsIdentifying(false);
              setTimeout(() => setIdentificationStatus(''), 3000);
              return;
            }
            
            setCurrentTrack(track);
            setIdentifiedTracks(prev => [track, ...prev].slice(0, 50));
            setIdentificationStatus(`✨ Track Identified: ${track.title}`);
          } else {
            setIdentificationStatus('No Match Found. Try Again In A Few Seconds.');
          }
        } catch (error) {
          console.error('Track identification failed:', error);
          setIdentificationStatus('Identification Service Error. Please Try Again.');
        }
        
        setIsIdentifying(false);
        setTimeout(() => setIdentificationStatus(''), 5000);
      };

      mediaRecorder.start(1000);
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 20000);
      
    } catch (error) {
      console.error('Audio capture error:', error);
      setIsIdentifying(false);
      setIsRecording(false);
      setRecordingProgress(0);
      setIdentificationStatus('Audio Capture Failed. Check Browser Permissions.');
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
          setIdentificationStatus('Connecting To DHR Stream...');
          
          await audioRef.current.play();
          setIsPlaying(true);
          setConnectionStatus('connected');
          setIdentificationStatus('Connected! Ready To Identify Tracks.');
          setTimeout(() => setIdentificationStatus(''), 3000);
          
          setTimeout(async () => {
            await setupAudioVisualization();
          }, 1000);
          
        } catch (error) {
          console.error('Play error:', error);
          setConnectionStatus('error');
          setIdentificationStatus('Stream Connection Failed.');
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
      setIdentificationStatus('Please Start Playing The Stream First');
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

  const clearHistory = useCallback(() => {
    setIdentifiedTracks([]);
    setCurrentTrack(null);
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setIdentifiedTracks(prev => prev.filter(track => track.id !== trackId));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
    }
  }, [currentTrack]);

  const searchTrack = useCallback((track: Track) => {
    const query = encodeURIComponent(`${track.artist} ${track.title}`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  }, []);

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

  const formatDublinTime = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      return new Date().toLocaleString('en-IE', {
        timeZone: 'Europe/Dublin',
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short'
      });
    }
    
    return date.toLocaleString('en-IE', {
      timeZone: 'Europe/Dublin',
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/40 backdrop-blur-3xl rounded-3xl p-8 border border-purple-500/20 text-center shadow-2xl">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/50">
              <Headphones className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Track Identifier Access
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Advanced track identification is exclusively available to DHR subscribers. 
              Upgrade to access AI-powered music recognition.
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-400/30 backdrop-blur-sm">
              <div className="text-blue-400 font-bold text-lg">DHR1 - €3/month</div>
              <div className="text-sm text-gray-400">Track ID + Premium Stream</div>
            </div>
            <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-400/30 backdrop-blur-sm">
              <div className="text-purple-400 font-bold text-lg">DHR2 - €5/month</div>
              <div className="text-sm text-gray-400">Track ID + All Premium Features</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-2xl p-4 border border-orange-400/30 backdrop-blur-sm">
              <div className="text-orange-400 font-bold text-lg">VIP - €10/month</div>
              <div className="text-sm text-gray-400">Full Access + VIP Downloads</div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <a 
              href="https://patreon.com/deephouseradio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 px-6 py-3 rounded-2xl text-white font-bold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/50"
            >
              Subscribe Now
            </a>
            <Link 
              to="/" 
              className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 px-6 py-3 rounded-2xl text-white font-bold transition-all duration-300 text-center backdrop-blur-sm border border-gray-600/30"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            AI Track Identifier
          </h1>
          <p className="text-xl text-gray-300 mb-4 font-medium">
            Advanced Music Recognition • Real-Time Analysis • Deep House Specialist
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-400/30">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="text-purple-300">VIP Access</span>
            </div>
            <div className="flex items-center space-x-2 bg-orange-500/20 px-4 py-2 rounded-full border border-orange-400/30">
              <Activity className="h-4 w-4 text-orange-400" />
              <span className="text-orange-300">AI Powered</span>
            </div>
            <div className="flex items-center space-x-2 bg-pink-500/20 px-4 py-2 rounded-full border border-pink-400/30">
              <Radio className="h-4 w-4 text-pink-400" />
              <span className="text-pink-300">Live Stream</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Stream Player */}
          <div className="xl:col-span-1">
            <div className="bg-black/40 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl border border-purple-500/20">
              <h2 className="text-2xl font-black text-white mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                DHR Live Stream
              </h2>
              
              <div className="flex flex-col items-center space-y-8">
                {/* Main Play Button with Visualizer */}
                <div className="relative">
                  <div className="w-40 h-40 relative">
                    {/* Outer Ring with Visualizer */}
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
                    
                    {/* Visualizer Bars */}
                    {isPlaying && (
                      <div className="absolute inset-4 flex items-end justify-center space-x-1">
                        {visualizerData.slice(0, 16).map((value, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-full transition-all duration-150"
                            style={{
                              height: `${Math.max(4, (value / 255) * 80)}px`,
                              width: '3px',
                              opacity: 0.8
                            }}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Play Button */}
                    <button
                      onClick={handlePlay}
                      className="absolute inset-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center shadow-2xl shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                    >
                      {isPlaying ? (
                        <Pause className="h-12 w-12 text-white" />
                      ) : (
                        <Play className="h-12 w-12 text-white ml-2" />
                      )}
                    </button>
                  </div>
                  
                  {/* Connection Status */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className={`px-4 py-2 rounded-full text-xs font-bold border ${
                      connectionStatus === 'idle' ? 'bg-gray-600/50 text-gray-300 border-gray-500/30' :
                      connectionStatus === 'connecting' ? 'bg-yellow-600/50 text-yellow-200 border-yellow-500/30' :
                      connectionStatus === 'connected' ? 'bg-green-600/50 text-green-200 border-green-500/30' :
                      'bg-red-600/50 text-red-200 border-red-500/30'
                    }`}>
                      {connectionStatus === 'idle' ? '● Ready' :
                       connectionStatus === 'connecting' ? '● Connecting...' :
                       connectionStatus === 'connected' ? '● Live' : '● Error'}
                    </div>
                  </div>
                </div>

                {/* Stream Info */}
                <div className="text-center space-y-2">
                  <div className="text-xl font-bold text-white">Deep House Radio</div>
                  <div className="text-sm text-gray-400">320kbps • Live 24/7 • Dublin</div>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-4 w-full">
                  <button
                    onClick={toggleMute}
                    className="text-purple-400 hover:text-purple-300 transition-colors p-2 rounded-full hover:bg-purple-500/20"
                  >
                    {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
                      }}
                    />
                  </div>
                  <div className="text-sm text-gray-400 w-12 text-right">
                    {Math.round(volume * 100)}%
                  </div>
                </div>

                {/* Auto-Identify Toggle */}
                <div className="flex items-center justify-between w-full p-4 bg-gray-800/30 rounded-2xl border border-gray-700/30">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-purple-400" />
                    <span className="text-sm font-medium text-white">Auto-Identify</span>
                  </div>
                  <button
                    onClick={() => setAutoIdentify(!autoIdentify)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoIdentify ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg ${
                        autoIdentify ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <audio ref={audioRef} src={streamUrl} preload="none" />
            </div>
          </div>

          {/* Identification Interface */}
          <div className="xl:col-span-2 space-y-8">
            {/* Identify Button */}
            <div className="bg-black/40 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl border border-orange-500/20">
              <h2 className="text-2xl font-black text-white mb-8 text-center bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                Track Identification
              </h2>
              
              <div className="flex flex-col items-center space-y-6">
                {/* Large Identify Button */}
                <div className="relative">
                  <button
                    onClick={handleIdentifyTrack}
                    disabled={!isPlaying || connectionStatus !== 'connected' || isIdentifying}
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl transform hover:scale-110 ${
                      isIdentifying 
                        ? 'bg-gradient-to-br from-gray-600 to-gray-700 cursor-not-allowed animate-pulse shadow-gray-500/50' 
                        : !isPlaying || connectionStatus !== 'connected'
                        ? 'bg-gradient-to-br from-gray-600 to-gray-700 cursor-not-allowed shadow-gray-500/30'
                        : 'bg-gradient-to-br from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-orange-500/50 hover:shadow-orange-500/70'
                    }`}
                  >
                    {isIdentifying ? (
                      <div className="flex flex-col items-center">
                        <Disc3 className="h-8 w-8 text-white animate-spin mb-1" />
                        <div className="text-xs text-white font-medium">Listening...</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Mic className="h-10 w-10 text-white mb-1" />
                        <div className="text-xs text-white font-bold">Identify</div>
                      </div>
                    )}
                  </button>
                  
                  {/* Recording Progress Ring */}
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-orange-500/30"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 46}`}
                          strokeDashoffset={`${2 * Math.PI * 46 * (1 - recordingProgress / 100)}`}
                          className="text-orange-500 transition-all duration-1000"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Status Display */}
                {identificationStatus && (
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-purple-400/30 max-w-md w-full">
                    <div className="text-center">
                      <div className="text-white font-medium">
                        {identificationStatus}
                      </div>
                      {isRecording && (
                        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${recordingProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => window.open('https://www.shazam.com', '_blank')}
                    className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl transition-colors border border-blue-400/30 backdrop-blur-sm"
                    title="Open Shazam"
                  >
                    <Search className="h-5 w-5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => window.open('https://www.soundhound.com', '_blank')}
                    className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-colors border border-green-400/30 backdrop-blur-sm"
                    title="Open SoundHound"
                  >
                    <Headphones className="h-5 w-5 text-green-400" />
                  </button>
                  <button
                    onClick={clearHistory}
                    className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors border border-red-400/30 backdrop-blur-sm"
                    title="Clear History"
                  >
                    <RotateCcw className="h-5 w-5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Current Track */}
            {currentTrack && (
              <div className="bg-black/40 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl border border-green-500/20">
                <h2 className="text-2xl font-black text-white mb-6 text-center bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Currently Identified
                </h2>
                
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0 relative">
                    <img 
                      src={currentTrack.artwork || DHR_LOGO_URL} 
                      alt={`${currentTrack.title} artwork`}
                      className="w-24 h-24 rounded-2xl object-cover shadow-xl border-2 border-green-400/30"
                      onError={(e) => {
                        e.currentTarget.src = DHR_LOGO_URL;
                      }}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-green-400/10 blur-sm -z-10"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-white truncate mb-2">
                      {currentTrack.title}
                    </div>
                    <div className="text-xl text-gray-300 truncate mb-3">
                      {currentTrack.artist}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDublinTime(currentTrack.timestamp)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4" />
                        <span>{currentTrack.service}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => searchTrack(currentTrack)}
                      className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-colors border border-green-400/30 backdrop-blur-sm"
                      title="Search Track"
                    >
                      <Search className="h-5 w-5 text-green-400" />
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `${currentTrack.artist} - ${currentTrack.title}`,
                            text: `Check out this track I identified on DHR!`,
                            url: window.location.href
                          });
                        }
                      }}
                      className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl transition-colors border border-blue-400/30 backdrop-blur-sm"
                      title="Share Track"
                    >
                      <Share className="h-5 w-5 text-blue-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Track History */}
            {identifiedTracks.length > 0 && (
              <div className="bg-black/40 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl border border-pink-500/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Identified Tracks ({identifiedTracks.length})
                  </h2>
                  <button
                    onClick={clearHistory}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors border border-red-400/30 backdrop-blur-sm"
                    title="Clear All"
                  >
                    <RotateCcw className="h-4 w-4 text-red-400" />
                  </button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {identifiedTracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="bg-gray-800/30 border border-pink-400/20 rounded-2xl p-4 hover:bg-gray-700/30 transition-all duration-300 group backdrop-blur-sm"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 relative">
                          <img 
                            src={track.artwork || DHR_LOGO_URL} 
                            alt={`${track.title} artwork`}
                            className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform border border-pink-400/20"
                            onError={(e) => {
                              e.currentTarget.src = DHR_LOGO_URL;
                            }}
                          />
                          <div className="absolute top-0 left-0 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-tl-xl rounded-br-xl">
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold truncate group-hover:text-pink-200 transition-colors">
                            {track.title}
                          </div>
                          <div className="text-gray-300 truncate group-hover:text-gray-200 transition-colors">
                            {track.artist}
                          </div>
                          <div className="flex items-center space-x-3 mt-1 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDublinTime(track.timestamp)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Zap className="h-3 w-3" />
                              <span>{track.service}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => searchTrack(track)}
                            className="p-2 bg-pink-500/20 hover:bg-pink-500/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Search Track"
                          >
                            <Search className="h-4 w-4 text-pink-400" />
                          </button>
                          <button
                            onClick={() => removeTrack(track.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove Track"
                          >
                            <RotateCcw className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default TrackIdentPage;