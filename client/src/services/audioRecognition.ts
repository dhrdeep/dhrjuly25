// Track identification service - uses server-side API endpoints
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

// Convert audio blob to base64 for server transmission
const audioToBase64 = (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
};

// Main track identification function using server-side API
export const identifyTrack = async (audioBlob: Blob): Promise<Track | null> => {
  try {
    console.log('Starting track identification process...');
    console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type);

    // Convert audio to base64 for server transmission
    const audioBase64 = await audioToBase64(audioBlob);
    console.log('Converted to base64, length:', audioBase64.length);

    // Send to server-side identification endpoint
    const response = await fetch('/api/identify-track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64: audioBase64
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server identification error:', response.status, response.statusText, errorText);
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Server identification result:', result);

    if (result.track) {
      console.log('Track identified:', result.track.title, 'by', result.track.artist, 'via', result.track.service);
      return result.track;
    } else {
      console.log('No track identified by server');
      return null;
    }

  } catch (error) {
    console.error('Track identification failed:', error);
    throw error;
  }
};

// Fallback identification function for offline mode (returns null)
export const identifyTrackOffline = async (audioBlob: Blob): Promise<Track | null> => {
  console.log('Offline mode - track identification not available');
  return null;
};

// Helper function to validate audio format
export const isValidAudioFormat = (audioBlob: Blob): boolean => {
  const validTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/mpeg'];
  return validTypes.some(type => audioBlob.type.includes(type));
};

// Helper function to check if audio is large enough for identification
export const isAudioSizeValid = (audioBlob: Blob): boolean => {
  // Minimum 5KB for meaningful audio data
  return audioBlob.size >= 5000;
};