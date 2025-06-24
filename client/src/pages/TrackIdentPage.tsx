import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Clock, Zap, Search, Headphones, History, Trash2, ExternalLink, ListMusic, Youtube, AlignJustify as Spotify } from 'lucide-react';
import { identifyTrack, Track } from '../services/audioRecognition';

const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

const TrackIdentPage: React.FC = () => {
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

  // Handle artwork loading errors
  const handleArtworkError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Artwork Failed To Load, Using DHR Logo Fallback');
    e.currentTarget.src = DHR_LOGO_URL;
  };

  const AudioVisualizer = () => (
    <div className="flex items-end space-x-1 h-12" role="img" aria-label="Audio Visualizer">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`bg-gradient-to-t from-orange-400 to-orange-200 rounded-full transition-all duration-75 ${
            isPlaying && connectionStatus === 'connected' ? 'animate-pulse' : ''
          }`}
          style={{
            width: '3px',
            height: isPlaying && connectionStatus === 'connected' ? `${Math.random() * 100 + 20}%` : '20%',
            animationDelay: `${i * 50}ms`
          }}
        />
      ))}
    </div>
  );

  // Create YouTube playlist with identified tracks
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

  // Create Spotify playlist
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

  // Export tracks as text file
  const exportTracksAsText = () => {
    if (identifiedTracks.length === 0) {
      setIdentificationStatus('No Tracks To Export. Identify Some Tracks First!');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return;
    }

    const playlistContent = [
      `DHR Radio Track List - ${new Date().toLocaleDateString('en-IE', { 
        timeZone: 'Europe/Dublin',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`,
      '',
      'Identified Tracks:',
      '================',
      '',
      ...identifiedTracks.map((track, index) => {
        const time = new Date(track.timestamp).toLocaleString('en-IE', {
          timeZone: 'Europe/Dublin',
          hour: '2-digit',
          minute: '2-digit',
          day: 'numeric',
          month: 'short'
        });
        return `${index + 1}. ${track.artist} - ${track.title}${track.album !== 'Unknown Album' ? ` (${track.album})` : ''} [${time}]`;
      }),
      '',
      `Total Tracks: ${identifiedTracks.length}`,
      'Generated By DHR Track Identifier'
    ].join('\n');

    const blob = new Blob([playlistContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DHR-Radio-Tracks-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIdentificationStatus('Track List Exported As Text File!');
    setTimeout(() => setIdentificationStatus(''), 3000);
  };

  const setupAudioCapture = async () => {
    try {
      if (!audioRef.current) {
        console.error('Audio Element Not Available');
        return null;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
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
        } catch (error) {
          console.error('Error Creating MediaElementSource:', error);
          return null;
        }
        
        gainNodeRef.current = audioContext.createGain();
        gainNodeRef.current.gain.value = isMuted ? 0 : volume;
        
        destinationRef.current = audioContext.createMediaStreamDestination();
        
        sourceNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContext.destination);
        gainNodeRef.current.connect(destinationRef.current);
        
        console.log('Connected Audio Nodes With Gain Control');
      }

      return destinationRef.current.stream;
    } catch (error) {
      console.error('Error Setting Up Audio Capture:', error);
      setIdentificationStatus('Error Setting Up Audio Capture. Please Try Again.');
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
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      console.log('Using MIME Type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data Available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording Stopped, Processing Audio...');
        setIdentificationStatus('Processing Captured Audio...');
        
        if (chunksRef.current.length === 0) {
          console.error('No Audio Data Captured');
          setIdentificationStatus('No Audio Data Captured. Stream May Be Silent.');
          setIsIdentifying(false);
          setTimeout(() => setIdentificationStatus(''), 3000);
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { 
          type: mimeType
        });
        
        console.log('Created Audio Blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
        
        if (audioBlob.size < 10000) {
          console.error('Audio Blob Too Small:', audioBlob.size);
          setIdentificationStatus('Captured Audio Too Small. Stream May Be Silent Or Very Quiet.');
          setIsIdentifying(false);
          setTimeout(() => setIdentificationStatus(''), 3000);
          return;
        }
        
        setIdentificationStatus('Identifying Track From Stream...');
        console.log('Sending To Identification Service...');
        
        try {
          const track = await identifyTrack(audioBlob);
          
          if (track) {
            console.log('Track Identified:', track);
            
            if (isDuplicateTrack(track, identifiedTracks)) {
              console.log('Duplicate Track Detected, Skipping:', track.title, 'by', track.artist);
              setIdentificationStatus('Same Track Detected, Skipping Duplicate.');
              setIsIdentifying(false);
              setTimeout(() => setIdentificationStatus(''), 3000);
              return;
            }
            
            setCurrentTrack(track);
            setIdentifiedTracks(prev => {
              return [track, ...prev].slice(0, 50);
            });
            setIdentificationStatus(`New Track Identified With ${track.service}!`);
          } else {
            console.log('No Track Identified');
            setIdentificationStatus('No Track Identified. The Song May Not Be In The Database Or Stream May Be Silent.');
          }
        } catch (error) {
          console.error('Identification Error:', error);
          setIdentificationStatus('Error During Identification. Please Try Again.');
        }
        
        setIsIdentifying(false);
        setTimeout(() => setIdentificationStatus(''), 5000);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder Error:', event);
        setIdentificationStatus('Recording Error Occurred');
        setIsIdentifying(false);
        setTimeout(() => setIdentificationStatus(''), 3000);
      };

      console.log('Starting MediaRecorder...');
      mediaRecorder.start(500);
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('Stopping MediaRecorder...');
          mediaRecorderRef.current.stop();
        }
      }, 25000);
      
    } catch (error) {
      console.error('Error Capturing Stream Audio:', error);
      setIsIdentifying(false);
      setIdentificationStatus('Error Capturing Stream Audio. Please Try Again.');
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
          setIdentificationStatus('Stream Connected Successfully!');
          setTimeout(() => setIdentificationStatus(''), 3000);
          console.log('Audio Started Playing');
          
          setTimeout(async () => {
            await setupAudioCapture();
            console.log('Audio Capture Setup Completed');
          }, 3000);
          
        } catch (error) {
          console.error('Error Playing Audio:', error);
          setConnectionStatus('error');
          setIdentificationStatus('Error Starting Stream. Please Try Again.');
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
      setIdentificationStatus('Please Start Playing The Stream First.');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return;
    }
    
    if (connectionStatus !== 'connected') {
      setIdentificationStatus('Stream Not Connected. Please Wait For Connection.');
      setTimeout(() => setIdentificationStatus(''), 3000);
      return;
    }
    
    if (!isIdentifying) {
      console.log('Manual Identification Triggered');
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
      autoIdentifyTimer.current = setInterval(() => {
        if (!isIdentifying && isPlaying && connectionStatus === 'connected') {
          console.log('Auto-Identification Triggered');
          captureStreamAudio();
        }
      }, 60000);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Format timestamp for Dublin, Ireland timezone
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      return 'Just Now';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just Now';
    if (diffMins < 60) return `${diffMins}m Ago`;
    if (diffHours < 24) return `${diffHours}h Ago`;
    if (diffDays < 7) return `${diffDays}d Ago`;
    
    return date.toLocaleDateString('en-IE', {
      timeZone: 'Europe/Dublin',
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-orange-400';
      case 'connecting': return 'text-orange-300';
      case 'error': return 'text-orange-600';
      case 'idle': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      case 'idle': return 'Press Play To Connect';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen text-white py-8 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="relative">
              <img 
                src={DHR_LOGO_URL} 
                alt="DHR Logo"
                className="h-16 w-16 rounded-xl shadow-2xl border-2 border-orange-400/30 bg-gray-800/50 backdrop-blur-sm"
                onError={handleArtworkError}
              />
              <div className="absolute inset-0 rounded-xl bg-orange-400/10 blur-md -z-10"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold elegant-text bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent">
                DHR Track Identifier
              </h1>
              <p className="text-gray-300 mt-1">Live Radio With Intelligent Track Identification</p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-orange-400 shadow-lg shadow-orange-400/50' :
              connectionStatus === 'connecting' ? 'bg-orange-400 animate-pulse shadow-lg shadow-orange-400/50' :
              connectionStatus === 'error' ? 'bg-orange-600 shadow-lg shadow-orange-600/50' :
              'bg-gray-400 shadow-lg shadow-gray-400/50'
            }`}></div>
            <span className={`text-sm ${getConnectionStatusColor()}`}>
              {getConnectionStatusText()}
            </span>
          </div>
        </header>

        {/* Main Player */}
        <main className="max-w-4xl mx-auto">
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-400/10 mb-8">
            {/* Audio Element */}
            <audio
              ref={audioRef}
              src={streamUrl}
              onPlay={() => {
                console.log('Audio Playing');
                setIsPlaying(true);
                setConnectionStatus('connected');
              }}
              onPause={() => {
                console.log('Audio Paused');
                if (!isPlaying) {
                  setConnectionStatus('idle');
                }
              }}
              onError={(e) => {
                console.error('Audio Error:', e);
                setConnectionStatus('error');
                setIdentificationStatus('Stream Connection Error. Please Try Again.');
                setTimeout(() => setIdentificationStatus(''), 3000);
              }}
              crossOrigin="anonymous"
              preload="none"
              className="hidden"
              aria-label="DHR Radio Stream"
            />

            {/* Current Track Display */}
            {currentTrack && (
              <section className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-2xl p-6 mb-6 border border-orange-400/20 backdrop-blur-sm">
                <h2 className="sr-only">Currently Playing Track</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img 
                      src={currentTrack.artwork || DHR_LOGO_URL} 
                      alt={`Album Artwork For ${currentTrack.title} By ${currentTrack.artist}`}
                      className="w-20 h-20 rounded-lg object-cover shadow-lg border border-orange-400/20"
                      onError={handleArtworkError}
                    />
                    <div className="absolute inset-0 rounded-lg bg-orange-400/5 blur-sm -z-10"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">{currentTrack.title}</h3>
                    <p className="text-orange-200">{currentTrack.artist}</p>
                    <p className="text-sm text-gray-300">{currentTrack.album}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-sm text-orange-300" title={formatDublinTime(currentTrack.timestamp)}>
                          {formatTimestamp(currentTrack.timestamp)}
                        </span>
                      </div>
                      {currentTrack.confidence && (
                        <span className="text-sm text-orange-400">
                          {currentTrack.confidence}% Match
                        </span>
                      )}
                      <div className="flex items-center space-x-1">
                        {currentTrack.service === 'ACRCloud' ? (
                          <Zap className="h-4 w-4 text-orange-400" />
                        ) : (
                          <Search className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="text-sm text-gray-300">{currentTrack.service}</span>
                      </div>
                      {currentTrack.duration && (
                        <span className="text-sm text-gray-300">
                          {formatDuration(currentTrack.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => searchTrack(currentTrack)}
                    className="p-2 rounded-full bg-orange-500/20 hover:bg-orange-500/30 transition-all duration-200 border border-orange-400/20 hover:scale-105"
                    title="Search For This Track"
                  >
                    <ExternalLink className="h-5 w-5 text-orange-300" />
                  </button>
                </div>
              </section>
            )}

            {/* Audio Visualizer */}
            <div className="flex justify-center mb-6">
              <AudioVisualizer />
            </div>

            {/* Main Controls */}
            <div className="relative flex items-center justify-center space-x-6 mb-6">
              <button
                onClick={handlePlay}
                className={`w-20 h-20 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200 border-2 flex items-center justify-center ${
                  connectionStatus === 'error'
                    ? 'bg-orange-600 hover:bg-orange-700 border-orange-500 shadow-orange-600/50'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-orange-400 shadow-orange-500/50'
                }`}
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </button>
              
              <button
                onClick={handleIdentifyTrack}
                disabled={isIdentifying || !isPlaying || connectionStatus !== 'connected'}
                className={`w-20 h-20 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200 border-2 flex items-center justify-center ${
                  isIdentifying 
                    ? 'bg-orange-600 animate-pulse border-orange-500 shadow-orange-600/50' 
                    : !isPlaying || connectionStatus !== 'connected'
                    ? 'bg-gray-600 cursor-not-allowed border-gray-500 shadow-gray-600/50'
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
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button 
                onClick={toggleMute} 
                className="text-orange-300 hover:text-orange-100 transition-colors hover:scale-110 transform duration-200"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-sm text-orange-300 w-10">{Math.round(volume * 100)}%</span>
            </div>

            {/* Auto-Identify Toggle */}
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

            {/* Status */}
            {(isIdentifying || identificationStatus || connectionStatus === 'idle' || connectionStatus === 'connecting' || connectionStatus === 'error') && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-3 text-sm text-orange-200 bg-gray-800/50 rounded-lg px-4 py-2 backdrop-blur-sm">
                  {(isIdentifying || connectionStatus === 'connecting') && (
                    <div className="relative w-5 h-5">
                      <img 
                        src={DHR_LOGO_URL} 
                        alt=""
                        className="w-5 h-5 rounded-sm"
                        style={{
                          animation: 'spin 2s linear infinite'
                        }}
                        onError={handleArtworkError}
                      />
                    </div>
                  )}
                  <span>
                    {connectionStatus === 'idle' ? 'Press Play To Connect' :
                     connectionStatus === 'connecting' ? 'Connecting To Stream...' : 
                     connectionStatus === 'error' ? 'Connection Failed. Please Try Again.' :
                     identificationStatus || 'Ready To Identify Tracks...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Recently Played Section */}
          {identifiedTracks.length > 0 && (
            <section className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-400/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <History className="h-6 w-6 text-orange-400" />
                  <h2 className="text-2xl font-bold text-white">Recently Played</h2>
                  <span className="text-sm text-orange-300 bg-orange-500/20 px-2 py-1 rounded-full">
                    {identifiedTracks.length} Tracks
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={createYouTubePlaylist}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-all duration-200 text-orange-300 hover:text-orange-200 border border-orange-400/20 hover:scale-105 transform"
                    title="Create YouTube Playlist"
                  >
                    <Youtube className="h-4 w-4" />
                    <span className="text-sm hidden sm:inline">YouTube</span>
                  </button>
                  
                  <button
                    onClick={createSpotifyPlaylist}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-all duration-200 text-orange-300 hover:text-orange-200 border border-orange-400/20 hover:scale-105 transform"
                    title="Create Spotify Playlist"
                  >
                    <Spotify className="h-4 w-4" />
                    <span className="text-sm hidden sm:inline">Spotify</span>
                  </button>
                  
                  <button
                    onClick={exportTracksAsText}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-all duration-200 text-orange-300 hover:text-orange-200 border border-orange-400/20 hover:scale-105 transform"
                    title="Export As Text File"
                  >
                    <ListMusic className="h-4 w-4" />
                    <span className="text-sm hidden sm:inline">Export</span>
                  </button>
                  
                  <button
                    onClick={clearHistory}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 rounded-lg transition-all duration-200 text-orange-300 hover:text-orange-200 border border-orange-500/20 hover:scale-105 transform"
                    title="Clear All History"
                  >
                    <Trash2 className="h-4 w-4" />
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
                            <h3 className="font-semibold text-lg truncate text-white">{track.title}</h3>
                            <p className="text-orange-200 truncate">{track.artist}</p>
                            <p className="text-sm text-gray-300 truncate">{track.album}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => searchTrack(track)}
                              className="p-2 rounded-full bg-orange-500/20 hover:bg-orange-500/30 transition-all duration-200 opacity-0 group-hover:opacity-100 border border-orange-400/20 hover:scale-105 transform"
                              title="Search For This Track"
                            >
                              <ExternalLink className="h-4 w-4 text-orange-300" />
                            </button>
                            <button
                              onClick={() => removeTrack(track.id)}
                              className="p-2 rounded-full bg-orange-600/20 hover:bg-orange-600/30 transition-all duration-200 opacity-0 group-hover:opacity-100 border border-orange-500/20 hover:scale-105 transform"
                              title="Remove From History"
                            >
                              <Trash2 className="h-4 w-4 text-orange-300" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-orange-400" />
                            <span className="text-xs text-orange-300" title={formatDublinTime(track.timestamp)}>
                              {formatTimestamp(track.timestamp)}
                            </span>
                          </div>
                          
                          {track.confidence && (
                            <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">
                              {track.confidence}% Match
                            </span>
                          )}
                          
                          <div className="flex items-center space-x-1">
                            {track.service === 'ACRCloud' ? (
                              <Zap className="h-3 w-3 text-orange-400" />
                            ) : (
                              <Search className="h-3 w-3 text-orange-500" />
                            )}
                            <span className="text-xs text-gray-300">{track.service}</span>
                          </div>
                          
                          {track.duration && (
                            <span className="text-xs text-gray-300 bg-gray-600/30 px-2 py-1 rounded-full">
                              {formatDuration(track.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default TrackIdentPage;