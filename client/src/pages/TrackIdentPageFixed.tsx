import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Clock, Zap, Search, Headphones, History, Trash2, ExternalLink, ListMusic, Youtube, AlignJustify as Spotify } from 'lucide-react';
import { identifyTrack, Track } from '../services/audioRecognition';

// Mock subscription service for demo - replace with actual service
const mockSubscriptionService = {
  getCurrentUser: () => ({ subscriptionTier: 'vip', username: 'demo_user' })
};

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const TrackIdentPage: React.FC = () => {
  // ALL HOOKS DECLARED AT TOP
  const [subscriptionTier, setSubscriptionTier] = useState<string>('vip');
  const [hasAccess, setHasAccess] = useState<boolean>(true);
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

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoIdentifyTimer = useRef<NodeJS.Timeout | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Helper function to check if track is a duplicate
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

  // Handle artwork loading errors
  const handleArtworkError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DHR_LOGO_URL;
  }, []);

  const setupAudioCapture = useCallback(async () => {
    try {
      if (!audioRef.current) return null;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (!sourceNodeRef.current) {
        try {
          sourceNodeRef.current = audioContext.createMediaElementSource(audioRef.current);
          gainNodeRef.current = audioContext.createGain();
          gainNodeRef.current.gain.value = isMuted ? 0 : volume;
          destinationRef.current = audioContext.createMediaStreamDestination();
          
          sourceNodeRef.current.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioContext.destination);
          gainNodeRef.current.connect(destinationRef.current);
        } catch (error) {
          console.error('Error Creating Audio Nodes:', error);
          return null;
        }
      }

      return destinationRef.current?.stream || null;
    } catch (error) {
      console.error('Audio Capture Setup Error:', error);
      setIdentificationStatus('Audio Setup Failed');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return null;
    }
  }, [isMuted, volume]);

  const captureStreamAudio = useCallback(async () => {
    try {
      setIsIdentifying(true);
      setIdentificationStatus('Setting Up Audio Capture...');
      
      const stream = await setupAudioCapture();
      if (!stream) {
        setIsIdentifying(false);
        setIdentificationStatus('Failed To Setup Audio Capture');
        setTimeout(() => setIdentificationStatus(''), 3000);
        return;
      }

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        setIsIdentifying(false);
        setIdentificationStatus('No Audio Detected In Stream');
        setTimeout(() => setIdentificationStatus(''), 3000);
        return;
      }

      setIdentificationStatus('Capturing Stream Audio...');
      
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

      if (!mimeType || !MediaRecorder.isTypeSupported(mimeType)) {
        setIsIdentifying(false);
        setIdentificationStatus('Browser Audio Format Not Supported');
        setTimeout(() => setIdentificationStatus(''), 3000);
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
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
        setIdentificationStatus('Processing Audio...');
        
        if (chunksRef.current.length === 0) {
          setIdentificationStatus('No Audio Data Captured');
          setIsIdentifying(false);
          setTimeout(() => setIdentificationStatus(''), 3000);
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        if (audioBlob.size < 5000) {
          setIdentificationStatus('Audio Sample Too Small');
          setIsIdentifying(false);
          setTimeout(() => setIdentificationStatus(''), 3000);
          return;
        }
        
        setIdentificationStatus('Analyzing Audio...');
        
        try {
          const track = await identifyTrack(audioBlob);
          
          if (track) {
            if (isDuplicateTrack(track, identifiedTracks)) {
              setIdentificationStatus('Duplicate Track Skipped');
              setIsIdentifying(false);
              setTimeout(() => setIdentificationStatus(''), 3000);
              return;
            }
            
            setCurrentTrack(track);
            setIdentifiedTracks(prev => [track, ...prev].slice(0, 50));
            setIdentificationStatus(`Track Identified With ${track.service}!`);
          } else {
            setIdentificationStatus('No Match Found In Database');
          }
        } catch (error) {
          console.error('Identification Error:', error);
          setIdentificationStatus('Identification Service Error');
        }
        
        setIsIdentifying(false);
        setTimeout(() => setIdentificationStatus(''), 5000);
      };

      mediaRecorder.onerror = () => {
        setIdentificationStatus('Recording Error');
        setIsIdentifying(false);
        setTimeout(() => setIdentificationStatus(''), 3000);
      };

      mediaRecorder.start(1000);
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 20000);
      
    } catch (error) {
      console.error('Audio Capture Error:', error);
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
          setIdentificationStatus('Starting Stream...');
          
          await audioRef.current.play();
          setIsPlaying(true);
          setConnectionStatus('connected');
          setIdentificationStatus('Stream Connected!');
          setTimeout(() => setIdentificationStatus(''), 3000);
          
          setTimeout(async () => {
            await setupAudioCapture();
          }, 3000);
          
        } catch (error) {
          console.error('Error Playing Audio:', error);
          setConnectionStatus('error');
          setIdentificationStatus('Error Starting Stream');
          setTimeout(() => setIdentificationStatus(''), 3000);
        }
      }
    }
  }, [isPlaying, setupAudioCapture]);

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

  // ALL useEffect HOOKS
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
    if (autoIdentify && isPlaying && !isIdentifying && connectionStatus === 'connected') {
      autoIdentifyTimer.current = setInterval(() => {
        if (!isIdentifying && isPlaying && connectionStatus === 'connected') {
          captureStreamAudio();
        }
      }, 60000);
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

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Show access denied screen for free users
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-orange-400/20 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="h-10 w-10 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Track Identifier Access Required</h2>
            <p className="text-gray-300 mb-6">
              Track identification is available exclusively to DHR subscribers. 
              Upgrade to access this premium feature and support deep house music.
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20">
              <div className="text-blue-400 font-semibold">DHR1 - €3/month</div>
              <div className="text-sm text-gray-400">Track ID + DHR1 Premium Stream</div>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
              <div className="text-purple-400 font-semibold">DHR2 - €5/month</div>
              <div className="text-sm text-gray-400">Track ID + DHR1 + DHR2 Premium</div>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-400/20">
              <div className="text-orange-400 font-semibold">VIP - €10/month</div>
              <div className="text-sm text-gray-400">Track ID + All Streams + VIP Downloads</div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <a 
              href="https://patreon.com/deephouseradio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 bg-orange-500 hover:bg-orange-600 px-4 py-3 rounded-lg text-white font-semibold transition-colors"
            >
              Subscribe Now
            </a>
            <Link 
              to="/" 
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg text-white font-semibold transition-colors text-center"
            >
              Back To Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-4">Track Identifier</h1>
          <p className="text-gray-300 text-lg">Identify Deep House Tracks In Real-Time From DHR Stream</p>
        </div>

        {/* Audio Player */}
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-400/10 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-6">
              <button
                onClick={handlePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/50 transition-all duration-300 hover:scale-105"
              >
                {isPlaying ? <Pause className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 text-white ml-1" />}
              </button>

              <div className="text-white">
                <div className="text-lg font-semibold">DHR Radio Stream</div>
                <div className="text-sm text-gray-400">
                  {connectionStatus === 'idle' ? 'Ready To Connect' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   connectionStatus === 'connected' ? 'Connected' : 'Connection Failed'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={toggleMute} className="text-orange-400 hover:text-orange-300 transition-colors">
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
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

          <audio ref={audioRef} src={streamUrl} preload="none" />
        </div>

        {/* Track Identification */}
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-400/10 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <label className="text-sm text-orange-200">Auto-Identify (Every Minute)</label>
              <button
                onClick={() => setAutoIdentify(!autoIdentify)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoIdentify ? 'bg-orange-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoIdentify ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleIdentifyTrack}
              disabled={!isPlaying || connectionStatus !== 'connected' || isIdentifying}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg transform hover:scale-105 ${
                isIdentifying 
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
              }`}
            >
              <Headphones className="h-8 w-8 text-white" />
            </button>

            {identificationStatus && (
              <div className="mt-4 text-orange-200 bg-gray-800/50 rounded-lg px-4 py-2">
                {identificationStatus}
              </div>
            )}
          </div>
        </div>

        {/* Track History */}
        {identifiedTracks.length > 0 && (
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-400/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recently Identified ({identifiedTracks.length})</h2>
              <button
                onClick={clearHistory}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {identifiedTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-gray-700/20 border border-orange-400/10 rounded-xl p-4 hover:bg-gray-700/30 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <img 
                      src={track.artwork || DHR_LOGO_URL} 
                      alt={`${track.title} by ${track.artist}`}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={handleArtworkError}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">{track.title}</div>
                      <div className="text-gray-300 truncate">{track.artist}</div>
                      <div className="text-sm text-gray-400">
                        {track.service} • {new Date(track.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackIdentPage;