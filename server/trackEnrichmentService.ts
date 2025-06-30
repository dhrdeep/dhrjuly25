import fetch from 'node-fetch';

interface EnrichedTrackData {
  artwork?: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  spotifyUrl?: string;
}

export class TrackEnrichmentService {
  private youtubeApiKey: string;
  
  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  }

  async enrichTrack(title: string, artist: string): Promise<EnrichedTrackData> {
    const enrichedData: EnrichedTrackData = {};

    try {
      // Fetch artwork and links in parallel
      const [artwork, youtubeUrl, soundcloudUrl, spotifyUrl] = await Promise.allSettled([
        this.fetchArtwork(title, artist),
        this.searchYoutube(title, artist),
        this.searchSoundcloud(title, artist),
        this.searchSpotify(title, artist)
      ]);

      if (artwork.status === 'fulfilled' && artwork.value) {
        enrichedData.artwork = artwork.value;
      }
      if (youtubeUrl.status === 'fulfilled' && youtubeUrl.value) {
        enrichedData.youtubeUrl = youtubeUrl.value;
      }
      if (soundcloudUrl.status === 'fulfilled' && soundcloudUrl.value) {
        enrichedData.soundcloudUrl = soundcloudUrl.value;
      }
      if (spotifyUrl.status === 'fulfilled' && spotifyUrl.value) {
        enrichedData.spotifyUrl = spotifyUrl.value;
      }

      console.log(`🎨 Enriched track "${title}" by ${artist}:`, {
        hasArtwork: !!enrichedData.artwork,
        hasYoutube: !!enrichedData.youtubeUrl,
        hasSoundcloud: !!enrichedData.soundcloudUrl,
        hasSpotify: !!enrichedData.spotifyUrl
      });

    } catch (error) {
      console.error('Error enriching track:', error);
    }

    return enrichedData;
  }

  private async fetchArtwork(title: string, artist: string): Promise<string | null> {
    try {
      // Try multiple sources for artwork
      const sources = [
        () => this.fetchLastFmArtwork(title, artist),
        () => this.fetchDiscogsArtwork(title, artist),
        () => this.fetchMusicBrainzArtwork(title, artist)
      ];

      for (const source of sources) {
        try {
          const artwork = await source();
          if (artwork) return artwork;
        } catch (error) {
          continue; // Try next source
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching artwork:', error);
      return null;
    }
  }

  private async fetchLastFmArtwork(title: string, artist: string): Promise<string | null> {
    try {
      const query = encodeURIComponent(`${artist} ${title}`);
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${query}&api_key=YOUR_LASTFM_KEY&format=json`,
        { timeout: 5000 }
      );

      if (!response.ok) return null;
      
      const data = await response.json() as any;
      const tracks = data?.results?.trackmatches?.track;
      
      if (Array.isArray(tracks) && tracks.length > 0) {
        const images = tracks[0].image;
        if (Array.isArray(images)) {
          const largeImage = images.find((img: any) => img.size === 'large' || img.size === 'extralarge');
          return largeImage?.['#text'] || null;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private async fetchDiscogsArtwork(title: string, artist: string): Promise<string | null> {
    try {
      const query = encodeURIComponent(`${artist} ${title}`);
      const response = await fetch(
        `https://api.discogs.com/database/search?q=${query}&type=release&per_page=1`,
        {
          headers: { 'User-Agent': 'DHR-TrackIdentifier/1.0' },
          timeout: 5000
        }
      );

      if (!response.ok) return null;
      
      const data = await response.json() as any;
      const results = data?.results;
      
      if (Array.isArray(results) && results.length > 0) {
        return results[0].cover_image || results[0].thumb || null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private async fetchMusicBrainzArtwork(title: string, artist: string): Promise<string | null> {
    try {
      const query = encodeURIComponent(`"${title}" AND artist:"${artist}"`);
      const response = await fetch(
        `https://musicbrainz.org/ws/2/recording/?query=${query}&fmt=json&limit=1`,
        {
          headers: { 'User-Agent': 'DHR-TrackIdentifier/1.0' },
          timeout: 5000
        }
      );

      if (!response.ok) return null;
      
      const data = await response.json() as any;
      const recordings = data?.recordings;
      
      if (Array.isArray(recordings) && recordings.length > 0) {
        const releaseId = recordings[0].releases?.[0]?.id;
        if (releaseId) {
          // Fetch cover art from Cover Art Archive
          const artResponse = await fetch(
            `https://coverartarchive.org/release/${releaseId}/front`,
            { timeout: 5000, redirect: 'manual' }
          );
          
          if (artResponse.status === 302 || artResponse.status === 307) {
            return artResponse.headers.get('location');
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private async searchYoutube(title: string, artist: string): Promise<string | null> {
    if (!this.youtubeApiKey) return null;

    try {
      const query = encodeURIComponent(`${artist} ${title}`);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${this.youtubeApiKey}`,
        { timeout: 5000 }
      );

      if (!response.ok) return null;
      
      const data = await response.json() as any;
      const items = data?.items;
      
      if (Array.isArray(items) && items.length > 0) {
        return `https://www.youtube.com/watch?v=${items[0].id.videoId}`;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private async searchSoundcloud(title: string, artist: string): Promise<string | null> {
    try {
      // SoundCloud search using their public API
      const query = encodeURIComponent(`${artist} ${title}`);
      const response = await fetch(
        `https://soundcloud.com/search/sounds?q=${query}`,
        {
          headers: { 'User-Agent': 'DHR-TrackIdentifier/1.0' },
          timeout: 5000
        }
      );

      if (!response.ok) return null;
      
      const html = await response.text();
      
      // Extract first track URL from HTML (simplified parsing)
      const urlMatch = html.match(/https:\/\/soundcloud\.com\/[^"'\s]+\/[^"'\s]+/);
      
      if (urlMatch) {
        return urlMatch[0];
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private async searchSpotify(title: string, artist: string): Promise<string | null> {
    try {
      // Note: This would require Spotify Web API credentials
      // For now, we'll return null but structure is ready for implementation
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const trackEnrichmentService = new TrackEnrichmentService();