import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Clock, Zap, Search, Headphones, History, Trash2, ExternalLink, ListMusic, Youtube, AlignJustify as Spotify } from 'lucide-react';
import { identifyTrack, Track } from '../services/audioRecognition';

// Mock subscription service for demo - replace with actual service
const mockSubscriptionService = {
  getCurrentUser: () => ({ subscriptionTier: 'vip', username: 'demo_user' })
};

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const TrackIdentPage: React.FC = () => {
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

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoIdentifyTimer = useRef<NodeJS.Timeout | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

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
    };
  }, []);

  const isDuplicateTrack = (newTrack: Track, existingTracks: Track[]) => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    
    return existingTracks.some(track => {
      const trackTime = new Date(track.timestamp).getTime();
      return (
        track.title.toLowerCase() === newTrack.title.toLowerCase() &&
        track.artist.toLowerCase() === newTrack.artist.toLowerCase() &&
        trackTime > twoHoursAgo
      );
    });
  };

  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Artwork Failed To Load, Using DHR Logo Fallback');
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const setupAudioCapture = async () => {
    try {
      if (!audioRef.current) {
        console.error('Audio Element Not Available');
        return null;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('Created New AudioContext');
      }

      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('Resumed AudioContext');
      }

      if (!sourceNodeRef.current) {
        try {
          sourceNodeRef.current = audioContext.createMediaElementSource(audioRef.current);
          console.log('Created MediaElementSource');
          
          gainNodeRef.current = audioContext.createGain();
          gainNodeRef.current.gain.value = isMuted ? 0 : volume;
          
          destinationRef.current = audioContext.createMediaStreamDestination();
          
          sourceNodeRef.current.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioContext.destination);
          gainNodeRef.current.connect(destinationRef.current);
          
          console.log('Audio Nodes Connected Successfully');
        } catch (error) {
          console.error('Error Creating Audio Nodes:', error);
          return null;
        }
      }

      return destinationRef.current?.stream || null;
    } catch (error) {
      console.error('Audio Capture Setup Error:', error);
      setIdentificationStatus('Audio Setup Failed. Check Browser Permissions.');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return null;
    }
  };

  const captureStreamAudio = async () => {
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
        console.error('No Audio Tracks In Stream');
        setIsIdentifying(false);
        setIdentificationStatus('No Audio Detected In Stream');
        setTimeout(() => setIdentificationStatus(''), 3000);
        return;
      }

      console.log('Audio Tracks Found:', audioTracks.length);
      setIdentificationStatus('Capturing Stream Audio...');
      
      let mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm;codecs=opus';
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
      }

      if (!mimeType) {
        console.error('No supported audio format found');
        setIsIdentifying(false);
        setIdentificationStatus('Browser Audio Format Not Supported');
        setTimeout(() => setIdentificationStatus(''), 3000);
        return;
      }

      console.log('Using MIME Type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 320000 // Higher quality for better fingerprinting
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
        setIdentificationStatus('Processing Captured Audio...');
        
        if (chunksRef.current.length === 0) {
          console.error('No Audio Data Captured');
          setIdentificationStatus('No Audio Data Captured. Check Stream Volume.');
          setIsIdentifying(false);
          setTimeout(() => setIdentificationStatus(''), 3000);
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log('Audio Blob Created:', audioBlob.size, 'bytes');
        
        if (audioBlob.size < 5000) {
          console.error('Audio Sample Too Small:', audioBlob.size);
          setIdentificationStatus('Audio Sample Too Small. Increase Volume Or Check Stream.');
          setIsIdentifying(false);
          setTimeout(() => setIdentificationStatus(''), 3000);
          return;
        }
        
        setIdentificationStatus('Analyzing Audio Sample...');
        
        try {
          const track = await identifyTrack(audioBlob);
          
          if (track) {
            console.log('Track Successfully Identified:', track);
            
            if (isDuplicateTrack(track, identifiedTracks)) {
              console.log('Duplicate Track Detected, Skipping');
              setIdentificationStatus('Same Track Recently Identified, Skipping Duplicate.');
              setIsIdentifying(false);
              setTimeout(() => setIdentificationStatus(''), 3000);
              return;
            }
            
            setCurrentTrack(track);
            setIdentifiedTracks(prev => [track, ...prev].slice(0, 50));
            setIdentificationStatus(`Track Identified Successfully With ${track.service}!`);
          } else {
            console.log('No Track Match Found');
            setIdentificationStatus('No Match Found In Music Database. Try Again In A Few Seconds.');
          }
        } catch (error) {
          console.error('Track Identification Failed:', error);
          setIdentificationStatus('Identification Service Error. Please Try Again.');
        }
        
        setIsIdentifying(false);
        setTimeout(() => setIdentificationStatus(''), 5000);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder Error:', event);
        setIdentificationStatus('Audio Recording Error Occurred');
        setIsIdentifying(false);
        setTimeout(() => setIdentificationStatus(''), 3000);
      };

      console.log('Starting Audio Recording...');
      mediaRecorder.start(1000);
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('Stopping Audio Recording...');
          mediaRecorderRef.current.stop();
        }
      }, 20000);
      
    } catch (error) {
      console.error('Audio Capture Error:', error);
      setIsIdentifying(false);
      setIdentificationStatus('Audio Capture Failed. Check Browser Permissions.');
      setTimeout(() => setIdentificationStatus(''), 3000);
    }
  };

  const handlePlay = async () => {
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
          setIdentificationStatus('Stream Connected Successfully! Ready To Identify Tracks.');
          setTimeout(() => setIdentificationStatus(''), 3000);
          
          setTimeout(async () => {
            await setupAudioCapture();
          }, 3000);
          
        } catch (error) {
          console.error('Error Playing Audio:', error);
          setConnectionStatus('error');
          setIdentificationStatus('Error Starting Stream. Check Browser Settings.');
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

  const handleIdentifyTrack = () => {
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
  };

  const clearHistory = () => {
    setIdentifiedTracks([]);
    setCurrentTrack(null);
  };

  const removeTrack = (trackId: string) => {
    setIdentifiedTracks(prev => prev.filter(track => track.id !== trackId));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
    }
  };

  const searchTrack = (track: Track) => {
    const query = encodeURIComponent(`${track.artist} ${track.title}`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  // Auto-identify effect
  useEffect(() => {
    if (autoIdentify && isPlaying && !isIdentifying && connectionStatus === 'connected') {
      console.log('Setting Up Auto-Identification Timer');
      const interval = setInterval(() => {
        if (!isIdentifying && isPlaying && connectionStatus === 'connected') {
          console.log('Auto-Identification Triggered');
          captureStreamAudio();
        }
      }, 60000);
      autoIdentifyTimer.current = interval;
    } else if (autoIdentifyTimer.current) {
      console.log('Clearing Auto-Identification Timer');
      clearInterval(autoIdentifyTimer.current);
      autoIdentifyTimer.current = null;
    }

    return () => {
      if (autoIdentifyTimer.current) {
        clearInterval(autoIdentifyTimer.current);
      }
    };
  }, [autoIdentify, isPlaying, isIdentifying, connectionStatus]);

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

  const createYouTubePlaylist = () => {
    if (identifiedTracks.length === 0) {
      setIdentificationStatus('No Tracks To Add To Playlist. Identify Some Tracks First!');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return;
    }

    const trackList = identifiedTracks.slice(0, 20).map((track, index) => 
      `${index + 1}. ${track.artist} - ${track.title}`
    ).join('\n');
    
    const firstTrack = identifiedTracks[0];
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${firstTrack.artist} ${firstTrack.title}`)}`;
    
    navigator.clipboard.writeText(trackList).then(() => {
      setIdentificationStatus('Track List Copied To Clipboard! Opening YouTube...');
      setTimeout(() => {
        setIdentificationStatus('Create A New Playlist On YouTube And Search For Each Track Manually.');
      }, 2000);
      setTimeout(() => setIdentificationStatus(''), 8000);
    }).catch(() => {
      setIdentificationStatus('Opening YouTube With First Track...');
      setTimeout(() => setIdentificationStatus(''), 3000);
    });
    
    window.open(youtubeSearchUrl, '_blank');
  };

  const createSpotifyPlaylist = () => {
    if (identifiedTracks.length === 0) {
      setIdentificationStatus('No Tracks To Add To Playlist. Identify Some Tracks First!');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return;
    }

    const trackList = identifiedTracks.slice(0, 20).map((track, index) => 
      `${index + 1}. ${track.artist} - ${track.title}`
    ).join('\n');
    
    const firstTrack = identifiedTracks[0];
    const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${firstTrack.artist} ${firstTrack.title}`)}`;
    
    navigator.clipboard.writeText(trackList).then(() => {
      setIdentificationStatus('Track List Copied To Clipboard! Opening Spotify...');
      setTimeout(() => {
        setIdentificationStatus('Create A New Playlist On Spotify And Search For Each Track Manually.');
      }, 2000);
      setTimeout(() => setIdentificationStatus(''), 8000);
    }).catch(() => {
      setIdentificationStatus('Opening Spotify With First Track...');
      setTimeout(() => setIdentificationStatus(''), 3000);
    });
    
    window.open(spotifySearchUrl, '_blank');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            Track Identifier
          </h1>
          <p className="text-gray-300 text-lg">
            Identify Deep House Tracks In Real-Time From DHR Stream
          </p>
          <div className="text-sm text-orange-300 mt-2">
            VIP Access • Enhanced Audio Recognition • Live Stream Analysis
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-400/10">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Stream Player</h2>
              
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-orange-500/50">
                    <div className="w-28 h-28 rounded-full bg-gray-900 flex items-center justify-center">
                      <button
                        onClick={handlePlay}
                        className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/50 transition-all duration-300 hover:scale-105"
                      >
                        {isPlaying ? (
                          <Pause className="h-10 w-10 text-white" />
                        ) : (
                          <Play className="h-10 w-10 text-white ml-1" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      connectionStatus === 'idle' ? 'bg-gray-600 text-gray-300' :
                      connectionStatus === 'connecting' ? 'bg-yellow-600 text-yellow-100' :
                      connectionStatus === 'connected' ? 'bg-green-600 text-green-100' :
                      'bg-red-600 text-red-100'
                    }`}>
                      {connectionStatus === 'idle' ? 'Ready' :
                       connectionStatus === 'connecting' ? 'Connecting...' :
                       connectionStatus === 'connected' ? 'Live' : 'Error'}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-semibold text-white">DHR Radio Stream</div>
                  <div className="text-sm text-gray-400">Deep House Radio • Live 24/7</div>
                </div>

                <div className="flex items-center space-x-4 w-full">
                  <button
                    onClick={toggleMute}
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 accent-orange-500"
                  />
                  <div className="text-sm text-gray-400 w-12 text-right">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              </div>

              <audio ref={audioRef} src={streamUrl} preload="none" />
            </div>

            <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-400/10">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Track Identification</h2>
              
              <div className="flex flex-col items-center space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <label className="text-sm text-orange-200">Auto-Identify Tracks (Every Minute)</label>
                  <button
                    onClick={() => setAutoIdentify(!autoIdentify)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoIdentify ? 'bg-orange-500 shadow-lg shadow-orange-500/50' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg ${
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
                      ? 'bg-gray-600 cursor-not-allowed animate-pulse' 
                      : !isPlaying || connectionStatus !== 'connected'
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-orange-400 shadow-orange-500/50'
                  }`}
                  title={
                    isIdentifying ? 'Identifying...' : 
                    !isPlaying ? 'Start Playing First' : 
                    connectionStatus !== 'connected' ? 'Stream Not Connected' :
                    'Identify Current Track From Stream'
                  }
                >
                  <Headphones className="h-8 w-8" />
                </button>

                {identificationStatus && (
                  <div className="text-center">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-3 border border-orange-400/20">
                      <div className="text-orange-200 font-medium">
                        {identificationStatus}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {currentTrack && (
              <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-400/10">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Now Identified</h2>
                
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0 relative">
                    <img 
                      src={currentTrack.artwork || DHR_LOGO_URL} 
                      alt={`Album Artwork For ${currentTrack.title} By ${currentTrack.artist}`}
                      className="w-24 h-24 rounded-xl object-cover shadow-lg border border-orange-400/20"
                      onError={handleArtworkError}
                    />
                    <div className="absolute inset-0 rounded-xl bg-orange-400/10 blur-sm -z-10"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-bold text-white truncate mb-1">
                      {currentTrack.title}
                    </div>
                    <div className="text-lg text-gray-300 truncate mb-2">
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
                  
                  <button
                    onClick={() => searchTrack(currentTrack)}
                    className="flex-shrink-0 p-3 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors border border-orange-400/20"
                    title="Search Track Online"
                  >
                    <Search className="h-5 w-5 text-orange-400" />
                  </button>
                </div>
              </div>
            )}

            {identifiedTracks.length > 0 && (
              <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-400/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Track History ({identifiedTracks.length})
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={createYouTubePlaylist}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors border border-red-500/20"
                      title="Create YouTube Playlist"
                    >
                      <Youtube className="h-4 w-4 text-red-400" />
                    </button>
                    <button
                      onClick={createSpotifyPlaylist}
                      className="p-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors border border-green-500/20"
                      title="Create Spotify Playlist"
                    >
                      <Spotify className="h-4 w-4 text-green-400" />
                    </button>
                    <button
                      onClick={clearHistory}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors border border-red-400/20"
                      title="Clear History"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                      <span className="text-sm hidden sm:inline">Clear</span>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {identifiedTracks.map((track) => (
                    <div
                      key={track.id}
                      className="bg-gray-700/20 border border-orange-400/10 rounded-xl p-4 hover:bg-gray-700/30 transition-all duration-200 group backdrop-blur-sm"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 relative">
                          <img 
                            src={track.artwork || DHR_LOGO_URL} 
                            alt={`Album Artwork For ${track.title} By ${track.artist}`}
                            className="w-16 h-16 rounded-lg object-cover group-hover:scale-105 transition-transform border border-orange-400/10"
                            onError={handleArtworkError}
                          />
                          <div className="absolute inset-0 rounded-lg bg-orange-400/5 blur-sm -z-10 group-hover:bg-orange-400/10"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="text-white font-semibold truncate group-hover:text-orange-200 transition-colors">
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
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => searchTrack(track)}
                                className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Search Track"
                              >
                                <Search className="h-4 w-4 text-orange-400" />
                              </button>
                              <button
                                onClick={() => removeTrack(track.id)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove Track"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </button>
                            </div>
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
      </div>
    </div>
  );
};

export default TrackIdentPage;