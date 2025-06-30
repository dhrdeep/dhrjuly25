import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Mic, MicOff, RotateCcw, Music, Headphones, Radio, Search } from 'lucide-react';

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

export default function DragonPage() {
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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
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







  // Auto-identification timer effect
  useEffect(() => {
    if (autoIdentify && isPlaying && !isIdentifying && connectionStatus === 'connected') {
      if (autoIdentifyTimer.current) {
        clearInterval(autoIdentifyTimer.current);
      }
      
      autoIdentifyTimer.current = setInterval(() => {
        if (isPlaying && !isIdentifying && connectionStatus === 'connected') {
          captureStreamAudio();
        }
      }, 60000); // 60 second intervals
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

  // Search for artwork on music platforms
  const searchForArtwork = async (artist: string, title: string): Promise<string | null> => {
    try {
      console.log(`Searching for artwork: ${artist} - ${title}`);
      
      // Try iTunes API first
      const itunesQuery = encodeURIComponent(`${artist} ${title}`);
      const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${itunesQuery}&media=music&limit=1`);
      const itunesData = await itunesResponse.json();
      
      if (itunesData.results && itunesData.results.length > 0) {
        const artwork = itunesData.results[0].artworkUrl100?.replace('100x100', '600x600');
        if (artwork) {
          console.log('Found artwork on iTunes:', artwork);
          return artwork;
        }
      }
      
      console.log('No artwork found, using DHR logo as fallback');
      return null;
    } catch (error) {
      console.error('Artwork search error:', error);
      return null;
    }
  };

  // Auto-identification timer
  useEffect(() => {
    if (autoIdentify && isPlaying && !isIdentifying && connectionStatus === 'connected') {
      const interval = setInterval(() => {
        if (!isIdentifying && isPlaying && connectionStatus === 'connected') {
          captureStreamAudio();
        }
      }, 60000); // Every 60 seconds as per documentation
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

  // Prevent duplicate tracks within 2 hours
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

  // Setup audio capture from live stream
  const setupAudioCapture = async () => {
    try {
      if (!audioRef.current) return null;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (!sourceNodeRef.current) {
        sourceNodeRef.current = audioContext.createMediaElementSource(audioRef.current);
        gainNodeRef.current = audioContext.createGain();
        destinationRef.current = audioContext.createMediaStreamDestination();
        
        sourceNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContext.destination);
        gainNodeRef.current.connect(destinationRef.current);
      }

      return destinationRef.current.stream;
    } catch (error) {
      console.error('Audio capture setup error:', error);
      return null;
    }
  };

  // Client-side ACRCloud identification (matching working approach)
  const identifyWithACRCloud = async (audioBlob: Blob) => {
    console.log('Starting ACRCloud identification with blob size:', audioBlob.size);
    
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log('Converted to ArrayBuffer, length:', arrayBuffer.byteLength);
      
      const timestamp = Math.floor(Date.now() / 1000);
      const accessKey = import.meta.env.VITE_ACRCLOUD_ACCESS_KEY;
      const accessSecret = import.meta.env.VITE_ACRCLOUD_ACCESS_SECRET;
      
      if (!accessKey || !accessSecret) {
        console.log('ACRCloud credentials not available');
        return null;
      }
      
      // Generate signature for ACRCloud
      const signString = `POST\n/v1/identify\n${accessKey}\naudio\n1\n${timestamp}`;
      const signature = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(accessSecret),
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      ).then(key => 
        crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signString))
      ).then(signature => 
        btoa(String.fromCharCode(...new Uint8Array(signature)))
      );
      
      const formData = new FormData();
      formData.append('sample', new Blob([arrayBuffer], { type: audioBlob.type }), 'sample.webm');
      formData.append('sample_bytes', arrayBuffer.byteLength.toString());
      formData.append('access_key', accessKey);
      formData.append('data_type', 'audio');
      formData.append('signature_version', '1');
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      
      console.log('Sending request to ACRCloud...');
      const response = await fetch('https://identify-eu-west-1.acrcloud.com/v1/identify', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        console.error('ACRCloud response not ok:', response.status, response.statusText);
        return null;
      }
      
      const result = await response.json();
      console.log('ACRCloud response:', result);
      
      if (result.status.code === 0 && result.metadata?.music?.length > 0) {
        const music = result.metadata.music[0];
        return {
          id: `acrcloud_${Date.now()}`,
          title: music.title || 'Unknown Title',
          artist: music.artists?.[0]?.name || 'Unknown Artist',
          album: music.album?.name || 'Unknown Album',
          artwork: music.album?.artwork_url_500 || music.album?.artwork_url_300 || 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png',
          confidence: Math.round(music.score || 0),
          service: 'ACRCloud',
          duration: music.duration_ms ? Math.round(music.duration_ms / 1000) : undefined,
          releaseDate: music.release_date,
          timestamp: new Date().toISOString()
        };
      } else {
        console.log('No music found in ACRCloud response, status:', result.status);
        console.log('No match found in ACRCloud database');
        return null;
      }
    } catch (error) {
      console.error('ACRCloud identification error:', error);
      return null;
    }
  };

  // Client-side Shazam identification (matching working approach)
  const identifyWithShazam = async (audioBlob: Blob) => {
    console.log('Starting Shazam identification with blob size:', audioBlob.size);
    
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      console.log('Converted to base64 for Shazam, length:', base64Audio.length);
      
      const shazamKey = import.meta.env.VITE_SHAZAM_API_KEY;
      
      if (!shazamKey) {
        console.log('Shazam API key not available');
        return null;
      }
      
      console.log('Sending request to Shazam...');
      const response = await fetch('https://shazam.p.rapidapi.com/songs/v2/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-RapidAPI-Key': shazamKey,
          'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
        },
        body: base64Audio
      });
      
      if (!response.ok) {
        console.log('Shazam response not ok:', response.status);
        const errorText = await response.text();
        try {
          console.log('Shazam error response:', JSON.parse(errorText));
        } catch {
          console.log('Shazam error response:', errorText);
        }
        return null;
      }
      
      const result = await response.json();
      console.log('Shazam response:', result);
      
      if (result.track) {
        const track = result.track;
        return {
          id: `shazam_${Date.now()}`,
          title: track.title || 'Unknown Title',
          artist: track.subtitle || 'Unknown Artist',
          album: track.sections?.[0]?.metadata?.find((m: any) => m.title === 'Album')?.text || 'Unknown Album',
          artwork: track.images?.coverart || track.images?.coverarthq || 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png',
          confidence: 85,
          service: 'Shazam',
          duration: undefined,
          releaseDate: undefined,
          timestamp: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Shazam identification error:', error);
      return null;
    }
  };

  // Capture 15 seconds of audio for identification - EXACT REPLICA of working thedeepbeat.com system
  const captureStreamAudio = useCallback(async () => {
    try {
      setIsIdentifying(true);
      setIdentificationStatus('Recording 15 Seconds For Identification...');
      
      if (!audioRef.current) {
        throw new Error('Audio element not available');
      }

      // Ensure audio is playing and has data
      if (audioRef.current.paused) {
        console.log('Audio is paused, starting playback...');  
        await audioRef.current.play();
        // Wait a moment for audio to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('Audio element state:', {
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration,
        readyState: audioRef.current.readyState,
        networkState: audioRef.current.networkState
      });

      console.log('Manual Identification Triggered');
      console.log('Created New AudioContext');
      
      // Create AudioContext exactly like working system
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioRef.current);
      const destination = audioContext.createMediaStreamDestination();
      const gainNode = audioContext.createGain();
      
      console.log('Created MediaElementSource');
      
      // Connect audio nodes exactly like working system
      source.connect(gainNode);
      gainNode.connect(destination);
      gainNode.connect(audioContext.destination); // Still output to speakers
      
      console.log('Connected Audio Nodes With Gain Control');
      console.log('Clearing Auto-Identification Timer');
      console.log('Audio Tracks Found:', destination.stream.getAudioTracks().length);
      
      // Try different MIME type to see if we can get larger files
      let mimeType = 'audio/webm';
      let options = {};
      
      // Test what MIME types are supported
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=pcm')) {
        mimeType = 'audio/webm;codecs=pcm';
        console.log('Using PCM codec for larger files');
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
        console.log('Using WAV format for larger files');
      } else {
        mimeType = 'audio/webm;codecs=opus';
        console.log('Fallback to Opus codec');
      }
      
      console.log(`Using MIME Type: ${mimeType}`);
      
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 384000 // Specific bitrate to match 402KB target
      });
      
      console.log('Starting MediaRecorder...');
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log(`Data Available: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Stopping MediaRecorder...');
        console.log('Recording Stopped, Processing Audio...');
        
        const audioBlob = new Blob(chunks, { type: mimeType });
        console.log(`Created Audio Blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        console.log('Sending To Identification Service...');
        
        try {
          setIdentificationStatus('Processing Audio For Identification...');
          console.log('Attempting identification with ACRCloud...');
          
          // Try ACRCloud first
          let track = await identifyWithACRCloud(audioBlob);
          if (track) {
            console.log('ACRCloud identification successful');
          } else {
            console.log('ACRCloud failed, trying Shazam...');
            // Try Shazam as fallback
            track = await identifyWithShazam(audioBlob);
            if (track) {
              console.log('Shazam identification successful');
            } else {
              console.log('No track identified by either service');
            }
          }
          
          if (track) {
            if (!isDuplicateTrack(track, identifiedTracks)) {
              setCurrentTrack(track);
              setIdentifiedTracks(prev => [track, ...prev].slice(0, 50));
              setIdentificationStatus(`Track Identified: ${track.title} by ${track.artist} (${track.service})`);
              console.log(`Track Identified: ${JSON.stringify(track)}`);
            } else {
              setIdentificationStatus('Track Already Identified Recently');
            }
          } else {
            setIdentificationStatus('No Track Match Found - Song May Not Be In Database');
            console.log('No Track Identified');
          }
        } catch (error) {
          console.error('Identification error:', error);
          setIdentificationStatus('Identification Error - Please Try Again');
        }
        
        setIsIdentifying(false);
        
        // Clean up AudioContext
        audioContext.close();
        
        setTimeout(() => {
          if (!autoIdentify) {
            setIdentificationStatus('');
          }
        }, 5000);
      };

      console.log('Audio Capture Setup Completed');
      mediaRecorder.start(100); // Small timeslice to force more data chunks like working system
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 15000); // Back to 15 seconds like working system with optimized chunking
      
    } catch (error) {
      console.error('Audio capture error:', error);
      setIsIdentifying(false);
      setIdentificationStatus('Audio Capture Failed');
      setTimeout(() => setIdentificationStatus(''), 3000);
    }
  }, [isDuplicateTrack, identifiedTracks, autoIdentify]);

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
    setCurrentTrack(null);
    setIdentificationStatus('History Cleared');
    setTimeout(() => setIdentificationStatus(''), 2000);
  };

  const searchTrack = (track: Track) => {
    const query = encodeURIComponent(`${track.artist} ${track.title}`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  const getDublinTimestamp = () => {
    return new Date().toLocaleString('en-IE', {
      timeZone: 'Europe/Dublin',
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTimestamp = (timestamp: string) => {
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
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mr-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-orange-400">DHR Track Identifier</h1>
              <p className="text-slate-300 text-lg mt-2">ACRCloud AI Music Recognition</p>
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

        {/* Current Track Display */}
        {currentTrack && (
          <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {currentTrack.artwork && (
                  <img 
                    src={currentTrack.artwork} 
                    alt="Album artwork"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                  <p className="text-orange-300">{currentTrack.artist}</p>
                  {currentTrack.album && (
                    <p className="text-slate-400 text-sm">{currentTrack.album}</p>
                  )}
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                    <span>via {currentTrack.service}</span>
                    {currentTrack.confidence && <span>{currentTrack.confidence}% match</span>}
                    <span>{formatTimestamp(currentTrack.timestamp)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => searchTrack(currentTrack)}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </div>
        )}

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
            <h2 className="text-2xl font-bold text-orange-400 mb-2">Track Identification System</h2>
            <p className="text-slate-400">15-Second Audio Capture • ACRCloud API</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
            <button
              onClick={() => {
                console.log('Identify button clicked, isPlaying:', isPlaying, 'isIdentifying:', isIdentifying);
                captureStreamAudio();
              }}
              disabled={!isPlaying || isIdentifying}
              className={`px-6 py-3 rounded-xl flex items-center space-x-2 font-medium transition-colors ${
                !isPlaying || isIdentifying
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {isIdentifying ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
              <span className="text-slate-300">Auto-Identify (60s intervals)</span>
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

        {/* Identified Tracks History */}
        {identifiedTracks.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center">
              <Music className="w-5 h-5 mr-2" />
              Identified Tracks ({identifiedTracks.length})
            </h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {identifiedTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {track.artwork && (
                        <img 
                          src={track.artwork} 
                          alt="Album artwork"
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-lg truncate">{track.title}</h4>
                        <p className="text-slate-300 truncate">{track.artist}</p>
                        {track.album && (
                          <p className="text-slate-400 text-sm truncate">{track.album}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                          <span>{formatTimestamp(track.timestamp)}</span>
                          {track.service && <span>via {track.service}</span>}
                          {track.confidence && <span>{track.confidence}% match</span>}
                          {track.duration && <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => searchTrack(track)}
                      className="px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 text-sm flex-shrink-0 ml-4"
                    >
                      Search
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500">
          <p className="text-sm">
            Powered By ACRCloud API • 15-Second Audio Capture • Dublin Timezone
          </p>
        </div>
      </div>
    </div>
  );
}