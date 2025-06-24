import CryptoJS from 'crypto-js';

// ACRCloud Configuration - Updated with your valid credentials
const ACRCLOUD_CONFIG = {
  host: 'identify-eu-west-1.acrcloud.com',
  endpoint: '/v1/identify',
  access_key: '24bc9727abe8b0d44002b9b8ef6469a0',
  access_secret: 'ETj5LGUvSZTvdpokx3Np6WACLWO8t6p0FbZK2d3r',
  data_type: 'audio',
  signature_version: '1'
};

// Shazam Configuration
const SHAZAM_CONFIG = {
  host: 'shazam.p.rapidapi.com',
  key: '5ec67b86e8msh3c31d0135522afbp1130a4jsn7d153b3bae25'
};

// DHR Logo URL
const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png';

export interface Track {
  id: string;
  title: string;
  album: string;
  artist: string;
  artwork?: string;
  timestamp: string;
  confidence?: number;
  service: 'ACRCloud' | 'Shazam';
  duration?: number;
  genre?: string;
  releaseDate?: string;
}

// Convert audio blob to ArrayBuffer for ACRCloud
const audioToArrayBuffer = (audioBlob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(audioBlob);
  });
};

// Convert audio blob to base64 for Shazam
const audioToBase64 = (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
      const base64 = btoa(binaryString);
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(audioBlob);
  });
};

// Generate ACRCloud signature
const generateACRCloudSignature = (method: string, uri: string, accessKey: string, dataType: string, signatureVersion: string, timestamp: number): string => {
  const stringToSign = [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
  return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(stringToSign, ACRCLOUD_CONFIG.access_secret));
};

// Get Dublin timezone timestamp as ISO string
const getDublinTimestamp = (): string => {
  const now = new Date();
  // Convert to Dublin timezone and return as ISO string for proper parsing
  const dublinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Dublin' }));
  return dublinTime.toISOString();
};

// Check if image URL is accessible
const checkImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true; // If no error, assume it's accessible
  } catch {
    return false;
  }
};

// Search for artwork on various platforms
const searchArtworkOnPlatforms = async (artist: string, title: string, album?: string): Promise<string | null> => {
  const searchQuery = encodeURIComponent(`${artist} ${title}`);
  const albumQuery = album ? encodeURIComponent(`${artist} ${album}`) : null;
  
  // List of potential artwork sources to try
  const artworkSources = [
    // Bandcamp search - try to find artist page
    `https://bandcamp.com/search?q=${searchQuery}`,
    // SoundCloud artwork (indirect - would need API)
    // Spotify artwork (indirect - would need API)
    // Last.fm artwork API (free tier available)
    `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=YOUR_LASTFM_KEY&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&format=json`,
    // MusicBrainz cover art (free)
    `https://coverartarchive.org/search?query=${searchQuery}`,
  ];

  // For now, we'll implement a basic search using available free APIs
  try {
    // Try Last.fm API (you would need to get a free API key)
    // This is a placeholder - in production you'd implement actual API calls
    console.log(`Searching for artwork: ${artist} - ${title}`);
    
    // Try to construct common artwork URLs based on patterns
    const commonArtworkPatterns = [
      // Bandcamp pattern
      `https://f4.bcbits.com/img/${searchQuery.toLowerCase().replace(/\s+/g, '')}.jpg`,
      // Generic music service patterns
      `https://i.scdn.co/image/${searchQuery.toLowerCase().replace(/\s+/g, '')}`, // Spotify-like
      `https://i1.sndcdn.com/artworks-${searchQuery.toLowerCase().replace(/\s+/g, '')}-large.jpg`, // SoundCloud-like
    ];

    // In a real implementation, you would:
    // 1. Use Last.fm API to search for track info and artwork
    // 2. Use MusicBrainz API to find cover art
    // 3. Use Bandcamp search API if available
    // 4. Use SoundCloud API with proper authentication
    // 5. Use Spotify Web API with proper authentication

    // For now, return null to use DHR logo as fallback
    return null;
  } catch (error) {
    console.error('Error searching for artwork:', error);
    return null;
  }
};

// Enhanced artwork resolution with multiple sources and DHR fallback
const resolveArtwork = async (primaryArtwork: string | undefined, artist: string, title: string, album?: string): Promise<string> => {
  // First, try the primary artwork from the identification service
  if (primaryArtwork) {
    try {
      // Test if the primary artwork URL is accessible
      const response = await fetch(primaryArtwork, { method: 'HEAD', mode: 'no-cors' });
      console.log(`Primary artwork found: ${primaryArtwork}`);
      return primaryArtwork;
    } catch (error) {
      console.log('Primary artwork not accessible, searching alternatives...');
    }
  }

  // Search for artwork on various platforms
  console.log(`Searching for artwork on music platforms for: ${artist} - ${title}`);
  const platformArtwork = await searchArtworkOnPlatforms(artist, title, album);
  
  if (platformArtwork) {
    console.log(`Platform artwork found: ${platformArtwork}`);
    return platformArtwork;
  }

  // Fallback to DHR logo
  console.log('No artwork found, using DHR logo as fallback');
  return DHR_LOGO_URL;
};

// ACRCloud identification
export const identifyWithACRCloud = async (audioBlob: Blob): Promise<Track | null> => {
  try {
    console.log('Starting ACRCloud identification with blob size:', audioBlob.size);
    
    // Convert to ArrayBuffer for ACRCloud
    const audioBuffer = await audioToArrayBuffer(audioBlob);
    console.log('Converted to ArrayBuffer, length:', audioBuffer.byteLength);
    
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateACRCloudSignature(
      'POST',
      ACRCLOUD_CONFIG.endpoint,
      ACRCLOUD_CONFIG.access_key,
      ACRCLOUD_CONFIG.data_type,
      ACRCLOUD_CONFIG.signature_version,
      timestamp
    );

    // Create FormData with binary audio data
    const formData = new FormData();
    
    // Create a new Blob from the ArrayBuffer with proper MIME type
    const audioFile = new Blob([audioBuffer], { type: 'audio/wav' });
    formData.append('sample', audioFile, 'sample.wav');
    formData.append('sample_bytes', audioBuffer.byteLength.toString());
    formData.append('access_key', ACRCLOUD_CONFIG.access_key);
    formData.append('data_type', ACRCLOUD_CONFIG.data_type);
    formData.append('signature_version', ACRCLOUD_CONFIG.signature_version);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp.toString());

    console.log('Sending request to ACRCloud...');
    const response = await fetch(`https://${ACRCLOUD_CONFIG.host}${ACRCLOUD_CONFIG.endpoint}`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      console.error('ACRCloud response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('ACRCloud error response:', errorText);
      return null;
    }

    const result = await response.json();
    console.log('ACRCloud response:', result);

    if (result.status.code === 0 && result.metadata?.music?.length > 0) {
      const music = result.metadata.music[0];
      console.log('Track found:', music);
      
      const artist = music.artists?.[0]?.name || 'Unknown Artist';
      const title = music.title || 'Unknown Title';
      const album = music.album?.name || 'Unknown Album';
      
      // Enhanced artwork resolution
      const artwork = await resolveArtwork(
        music.album?.artwork_url_500 || music.album?.artwork_url_300,
        artist,
        title,
        album
      );
      
      return {
        id: `acrcloud_${Date.now()}`,
        title,
        artist,
        album,
        artwork,
        timestamp: getDublinTimestamp(),
        confidence: Math.round(music.score || 0),
        service: 'ACRCloud',
        duration: music.duration_ms ? Math.round(music.duration_ms / 1000) : undefined,
        releaseDate: music.release_date
      };
    } else {
      console.log('No music found in ACRCloud response, status:', result.status);
      
      // Log specific error codes for debugging
      if (result.status.code === 2004) {
        console.error('ACRCloud fingerprint generation failed - audio format may be incompatible');
      } else if (result.status.code === 1001) {
        console.log('No match found in ACRCloud database');
      }
    }

    return null;
  } catch (error) {
    console.error('ACRCloud identification error:', error);
    return null;
  }
};

// Shazam identification (fallback)
export const identifyWithShazam = async (audioBlob: Blob): Promise<Track | null> => {
  try {
    console.log('Starting Shazam identification with blob size:', audioBlob.size);
    
    const audioBase64 = await audioToBase64(audioBlob);
    console.log('Converted to base64 for Shazam, length:', audioBase64.length);
    
    console.log('Sending request to Shazam...');
    const response = await fetch('https://shazam.p.rapidapi.com/songs/v2/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-RapidAPI-Key': SHAZAM_CONFIG.key,
        'X-RapidAPI-Host': SHAZAM_CONFIG.host
      },
      body: audioBase64
    });

    if (!response.ok) {
      console.error('Shazam response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Shazam error response:', errorText);
      return null;
    }

    const result = await response.json();
    console.log('Shazam response:', result);

    if (result.track) {
      const track = result.track;
      console.log('Shazam track found:', track);
      
      const artist = track.subtitle || 'Unknown Artist';
      const title = track.title || 'Unknown Title';
      const album = track.sections?.[0]?.metadata?.find((m: any) => m.title === 'Album')?.text || 'Unknown Album';
      
      // Enhanced artwork resolution
      const artwork = await resolveArtwork(
        track.images?.coverart || track.images?.coverarthq,
        artist,
        title,
        album
      );
      
      return {
        id: `shazam_${Date.now()}`,
        title,
        artist,
        album,
        artwork,
        timestamp: getDublinTimestamp(),
        confidence: 85, // Shazam doesn't provide confidence score
        service: 'Shazam'
      };
    } else {
      console.log('No track found in Shazam response');
    }

    return null;
  } catch (error) {
    console.error('Shazam identification error:', error);
    return null;
  }
};

// Main identification function with fallback
export const identifyTrack = async (audioBlob: Blob): Promise<Track | null> => {
  try {
    console.log('Starting track identification process...');
    
    // Try ACRCloud first
    console.log('Attempting identification with ACRCloud...');
    let result = await identifyWithACRCloud(audioBlob);
    
    if (result) {
      console.log('Track identified with ACRCloud:', result);
      return result;
    }

    // Fallback to Shazam
    console.log('ACRCloud failed, trying Shazam...');
    result = await identifyWithShazam(audioBlob);
    
    if (result) {
      console.log('Track identified with Shazam:', result);
      return result;
    }

    console.log('No track identified by either service');
    return null;
  } catch (error) {
    console.error('Track identification error:', error);
    return null;
  }
};