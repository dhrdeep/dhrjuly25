import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { storage } from './storage';
import { trackEnrichmentService } from './trackEnrichmentService';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface IdentifiedTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  confidence: number;
  service: string;
  timestamp: Date;
  duration?: number;
  releaseDate?: string;
}

interface ACRCloudResponse {
  status: {
    msg: string;
    code: number;
    version: string;
  };
  metadata?: {
    music?: Array<{
      title: string;
      artists: Array<{ name: string }>;
      album: { name: string };
      release_date: string;
      duration_ms: number;
      score: number;
      external_metadata?: {
        spotify?: { track: { preview_url: string } };
        deezer?: { track: { preview: string } };
      };
    }>;
  };
}

class StreamMonitor {
  private streamUrl: string;
  private accessKey: string;
  private accessSecret: string;
  private host: string;
  private recentTracks: IdentifiedTrack[] = [];
  private currentTrack: IdentifiedTrack | null = null;
  private isMonitoring = false;
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.streamUrl = 'https://ec1.everestcast.host:2775/stream';
    this.accessKey = process.env.VITE_ACRCLOUD_ACCESS_KEY || process.env.ACRCLOUD_ACCESS_KEY || '';
    this.accessSecret = process.env.VITE_ACRCLOUD_ACCESS_SECRET || process.env.ACRCLOUD_ACCESS_SECRET || '';
    this.host = 'identify-eu-west-1.acrcloud.com';
    
    console.log('StreamMonitor initialized with ACRCloud credentials:', {
      hasAccessKey: !!this.accessKey,
      accessKeyPreview: this.accessKey ? this.accessKey.substring(0, 8) + '...' : 'missing',
      hasAccessSecret: !!this.accessSecret,
      streamUrl: this.streamUrl
    });
  }

  private buildStringToSign(method: string, uri: string, accessKey: string, dataType: string, signatureVersion: string, timestamp: string): string {
    return [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
  }

  private sign(signString: string, accessSecret: string): string {
    return crypto.createHmac('sha1', accessSecret)
      .update(Buffer.from(signString, 'utf-8'))
      .digest()
      .toString('base64');
  }

  private async captureStreamAudio(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const tempFile = path.join(__dirname, '..', 'temp_audio.wav');
      
      // Use FFmpeg to capture 15 seconds of audio from the stream
      const ffmpeg = spawn('ffmpeg', [
        '-i', this.streamUrl,
        '-t', '15',              // 15 seconds duration
        '-ar', '44100',          // 44.1kHz sample rate (ACRCloud standard)
        '-ac', '1',              // Mono channel
        '-f', 'wav',             // WAV format
        '-y',                    // Overwrite output file
        tempFile
      ]);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          try {
            const audioBuffer = fs.readFileSync(tempFile);
            fs.unlinkSync(tempFile); // Clean up temp file
            console.log(`Stream audio captured: ${audioBuffer.length} bytes`);
            resolve(audioBuffer);
          } catch (error) {
            reject(new Error(`Failed to read captured audio: ${error}`));
          }
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg spawn error: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        ffmpeg.kill('SIGKILL');
        reject(new Error('Audio capture timeout'));
      }, 30000);
    });
  }

  private async identifyWithACRCloud(audioBuffer: Buffer): Promise<IdentifiedTrack | null> {
    try {
      const method = 'POST';
      const uri = '/v1/identify';
      const dataType = 'audio';
      const signatureVersion = '1';
      const timestamp = new Date().getTime().toString();

      const stringToSign = this.buildStringToSign(method, uri, this.accessKey, dataType, signatureVersion, timestamp);
      const signature = this.sign(stringToSign, this.accessSecret);

      const formData = new FormData();
      formData.append('sample', audioBuffer, {
        filename: 'sample.wav',
        contentType: 'audio/wav'
      });
      formData.append('access_key', this.accessKey);
      formData.append('data_type', dataType);
      formData.append('signature_version', signatureVersion);
      formData.append('signature', signature);
      formData.append('sample_bytes', audioBuffer.length.toString());
      formData.append('timestamp', timestamp);

      const response = await fetch(`https://${this.host}${uri}`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`ACRCloud API responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as ACRCloudResponse;
      
      if (result.status.code === 0 && result.metadata?.music?.length) {
        const music = result.metadata.music[0];
        const baseTrack = {
          id: crypto.randomUUID(),
          title: music.title,
          artist: music.artists.map(a => a.name).join(', '),
          album: music.album?.name,
          confidence: music.score,
          service: 'ACRCloud',
          timestamp: new Date(),
          duration: music.duration_ms ? Math.round(music.duration_ms / 1000) : undefined,
          releaseDate: music.release_date
        };

        // Enrich track with artwork and streaming links
        const enrichedData = await trackEnrichmentService.enrichTrack(baseTrack.title, baseTrack.artist);
        
        const track: IdentifiedTrack = {
          ...baseTrack,
          artwork: enrichedData.artwork,
        };

        // Save to database with enriched data
        try {
          await storage.saveIdentifiedTrack({
            trackId: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album,
            confidence: track.confidence,
            service: track.service,
            duration: track.duration,
            releaseDate: track.releaseDate,
            artwork: enrichedData.artwork,
            youtubeUrl: enrichedData.youtubeUrl,
            soundcloudUrl: enrichedData.soundcloudUrl,
            spotifyUrl: enrichedData.spotifyUrl
          });
          console.log(`💾 Track saved to database: ${track.title} by ${track.artist}`);
        } catch (error) {
          console.error('Failed to save track to database:', error);
        }

        console.log(`✅ Track identified: ${track.artist} - ${track.title} (${track.confidence}% confidence)`);
        return track;
      } else {
        console.log(`❌ No track identified. Status: ${result.status.msg} (${result.status.code})`);
        return null;
      }
    } catch (error) {
      console.error('ACRCloud identification error:', error);
      return null;
    }
  }

  private isDuplicateTrack(newTrack: IdentifiedTrack): boolean {
    const recent = this.recentTracks.slice(-3); // Check last 3 tracks
    return recent.some(track => 
      track.title === newTrack.title && 
      track.artist === newTrack.artist &&
      (Date.now() - track.timestamp.getTime()) < 300000 // Within 5 minutes
    );
  }

  private async performIdentification(): Promise<void> {
    try {
      console.log('🎵 Starting stream monitoring cycle...');
      
      // Capture audio from stream
      const audioBuffer = await this.captureStreamAudio();
      
      // Identify track with ACRCloud
      const identifiedTrack = await this.identifyWithACRCloud(audioBuffer);
      
      if (identifiedTrack && !this.isDuplicateTrack(identifiedTrack)) {
        // Update current track
        this.currentTrack = identifiedTrack;
        
        // Add to recent tracks list (keep last 50)
        this.recentTracks.unshift(identifiedTrack);
        if (this.recentTracks.length > 50) {
          this.recentTracks = this.recentTracks.slice(0, 50);
        }
        
        console.log(`🎶 New track added to playlist: ${identifiedTrack.artist} - ${identifiedTrack.title}`);
      }
      
    } catch (error) {
      console.error('Stream monitoring error:', error);
    }
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('Stream monitoring already running');
      return;
    }

    if (!this.accessKey || !this.accessSecret) {
      console.error('ACRCloud credentials not found in environment variables');
      return;
    }

    console.log('🚀 Starting DHR stream monitoring with ACRCloud...');
    this.isMonitoring = true;

    // Start immediately
    this.performIdentification();

    // Then repeat every 2 minutes
    this.monitorInterval = setInterval(() => {
      this.performIdentification();
    }, 120000);
  }

  public stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('Stream monitoring stopped');
  }

  public getCurrentTrack(): IdentifiedTrack | null {
    return this.currentTrack;
  }

  public getRecentTracks(): IdentifiedTrack[] {
    return this.recentTracks;
  }

  public isActive(): boolean {
    return this.isMonitoring;
  }
}

export const streamMonitor = new StreamMonitor();