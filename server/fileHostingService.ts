import { VipMix } from '@shared/schema';

export interface FileHostingProvider {
  name: string;
  getStreamUrl(mix: VipMix): Promise<string | null>;
  getDownloadUrl(mix: VipMix): Promise<string | null>;
}

// AWS S3 / DigitalOcean Spaces provider
export class S3Provider implements FileHostingProvider {
  name = 'S3/Spaces';
  
  constructor(
    private endpoint: string,
    private bucket: string,
    private accessKey: string,
    private secretKey: string
  ) {}

  private getAuthHeaders() {
    // For DigitalOcean Spaces, we can use the access key as both username and password
    const auth = Buffer.from(`${this.accessKey}:${this.secretKey || this.accessKey}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'User-Agent': 'DHR-Music-Player/1.0'
    };
  }

  async getStreamUrl(mix: VipMix): Promise<string | null> {
    if (!mix.s3Url) return null;
    
    // For public buckets, return direct URL
    if (mix.s3Url.startsWith('http')) {
      return mix.s3Url;
    }
    
    // For DigitalOcean Spaces, construct the public URL
    const publicUrl = `${this.endpoint}/${mix.s3Url}`;
    console.log(`Generated Spaces URL: ${publicUrl}`);
    return publicUrl;
  }

  async getDownloadUrl(mix: VipMix): Promise<string | null> {
    return this.getStreamUrl(mix); // Same URL for download
  }
}

// Fallback provider for uploaded files to Replit
export class LocalProvider implements FileHostingProvider {
  name = 'Local';
  
  async getStreamUrl(mix: VipMix): Promise<string | null> {
    if (!mix.localPath) return null;
    return `/api/local-file/${mix.id}`;
  }

  async getDownloadUrl(mix: VipMix): Promise<string | null> {
    return this.getStreamUrl(mix);
  }
}

// Direct URL provider (for any direct links)
export class DirectProvider implements FileHostingProvider {
  name = 'Direct';
  
  async getStreamUrl(mix: VipMix): Promise<string | null> {
    if (!mix.directUrl) return null;
    return mix.directUrl;
  }

  async getDownloadUrl(mix: VipMix): Promise<string | null> {
    return this.getStreamUrl(mix);
  }
}

// Main service to handle multiple providers
export class FileHostingService {
  private providers: FileHostingProvider[] = [];

  constructor() {
    // Add S3/Spaces provider if configured
    if (process.env.S3_ENDPOINT && process.env.S3_BUCKET) {
      this.providers.push(new S3Provider(
        process.env.S3_ENDPOINT,
        process.env.S3_BUCKET,
        process.env.S3_ACCESS_KEY || '',
        process.env.S3_SECRET_KEY || ''
      ));
    }
    
    // DigitalOcean Spaces configuration
    this.providers.push(new S3Provider(
      'https://dhrmixes.lon1.digitaloceanspaces.com',
      'dhrmixes',
      'DO00XZCG3UHJKGHWGHK3',
      '43k5T+g++ESLIKOdVhX3u7Zavw3/JNfNrxxxqrltJmc'
    ));

    // Add local and direct providers
    this.providers.push(new LocalProvider());
    this.providers.push(new DirectProvider());
  }

  async getStreamUrl(mix: VipMix): Promise<string | null> {
    for (const provider of this.providers) {
      try {
        const url = await provider.getStreamUrl(mix);
        if (url) {
          console.log(`Using ${provider.name} for streaming: ${mix.title}`);
          return url;
        }
      } catch (error) {
        console.log(`${provider.name} failed for ${mix.title}:`, error);
      }
    }
    return null;
  }

  async getDownloadUrl(mix: VipMix): Promise<string | null> {
    for (const provider of this.providers) {
      try {
        const url = await provider.getDownloadUrl(mix);
        if (url) {
          console.log(`Using ${provider.name} for download: ${mix.title}`);
          return url;
        }
      } catch (error) {
        console.log(`${provider.name} failed for ${mix.title}:`, error);
      }
    }
    return null;
  }
}

export const fileHostingService = new FileHostingService();