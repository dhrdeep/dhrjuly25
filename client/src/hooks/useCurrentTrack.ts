import { useState, useEffect } from 'react';

interface Track {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  bpm?: number;
  energy?: number;
  mood?: string;
}

interface TrackData {
  current_track?: {
    title: string;
    artist: string;
    album?: string;
    artwork?: string;
  };
  listeners?: number;
}

export function useCurrentTrack(apiUrl?: string, isPlaying: boolean = false) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl || !isPlaying) {
      setCurrentTrack(null);
      return;
    }

    const fetchTrackData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: TrackData = await response.json();
        
        if (data.current_track) {
          const track: Track = {
            title: data.current_track.title || 'Unknown Track',
            artist: data.current_track.artist || 'Unknown Artist',
            album: data.current_track.album,
            genre: inferGenre(data.current_track.title, data.current_track.artist),
            bpm: estimateBPM(data.current_track.title, data.current_track.artist),
            energy: estimateEnergy(data.current_track.title, data.current_track.artist)
          };

          setCurrentTrack(track);
        } else {
          setCurrentTrack(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch track data');
        setCurrentTrack(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchTrackData();

    // Set up polling interval
    const interval = setInterval(fetchTrackData, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [apiUrl, isPlaying]);

  return { currentTrack, isLoading, error };
}

// Helper function to infer genre from track metadata
function inferGenre(title: string, artist: string): string {
  const titleLower = title.toLowerCase();
  const artistLower = artist.toLowerCase();

  if (titleLower.includes('deep') || artistLower.includes('deep')) {
    return 'Deep House';
  }
  
  if (titleLower.includes('progressive') || artistLower.includes('progressive')) {
    return 'Progressive House';
  }
  
  if (titleLower.includes('tech') || artistLower.includes('tech')) {
    return 'Tech House';
  }
  
  if (titleLower.includes('minimal') || artistLower.includes('minimal')) {
    return 'Minimal';
  }
  
  if (titleLower.includes('ambient') || artistLower.includes('ambient')) {
    return 'Ambient';
  }

  return 'Electronic';
}

// Helper function to estimate BPM from track metadata
function estimateBPM(title: string, artist: string): number {
  const titleLower = title.toLowerCase();
  
  // Extract BPM if mentioned in title
  const bpmMatch = titleLower.match(/(\d{2,3})\s*bpm/);
  if (bpmMatch) {
    return parseInt(bpmMatch[1]);
  }

  // Estimate based on genre/style keywords
  if (titleLower.includes('minimal') || titleLower.includes('ambient')) {
    return 110 + Math.floor(Math.random() * 10); // 110-120 BPM
  }
  
  if (titleLower.includes('deep')) {
    return 120 + Math.floor(Math.random() * 8); // 120-128 BPM
  }
  
  if (titleLower.includes('progressive')) {
    return 125 + Math.floor(Math.random() * 10); // 125-135 BPM
  }
  
  if (titleLower.includes('tech')) {
    return 128 + Math.floor(Math.random() * 8); // 128-136 BPM
  }

  // Default house music range
  return 120 + Math.floor(Math.random() * 12); // 120-132 BPM
}

// Helper function to estimate energy level
function estimateEnergy(title: string, artist: string): number {
  const titleLower = title.toLowerCase();
  
  // High energy keywords
  if (titleLower.includes('uplifting') || titleLower.includes('energetic') || 
      titleLower.includes('peak') || titleLower.includes('driving')) {
    return 80 + Math.floor(Math.random() * 20); // 80-100
  }
  
  // Medium energy
  if (titleLower.includes('progressive') || titleLower.includes('tech')) {
    return 60 + Math.floor(Math.random() * 25); // 60-85
  }
  
  // Low energy
  if (titleLower.includes('chill') || titleLower.includes('ambient') || 
      titleLower.includes('minimal') || titleLower.includes('relax')) {
    return 20 + Math.floor(Math.random() * 30); // 20-50
  }
  
  // Default medium energy
  return 50 + Math.floor(Math.random() * 30); // 50-80
}