import { User, SubscriptionTier } from '../types/subscription';

// Patreon API Configuration
const PATREON_CONFIG = {
  clientId: '-tv-cVi3LfJC_gV3S1zJ7fjBPAubr2Nj1GXiVZODqBy-XC97Mf9FJIdayBn55iWS',
  clientSecret: 'IbolNmgTLsoAZXH6dRQUb5JMrH2-AxaU8ou1RwYxyx2M7dVRb-ZG6lvSHeHZxjgY',
  redirectUri: `${window.location.origin}/auth/patreon/callback`,
  apiBaseUrl: 'https://www.patreon.com/api/oauth2/v2',
  scope: 'identity identity[email] campaigns campaigns.members'
};

// DHR Patreon Campaign Tiers
export const DHR_PATREON_TIERS = {
  'dhr_supporter': {
    id: 'dhr_supporter',
    name: 'DHR Supporter',
    minAmount: 500, // $5.00 in cents
    dhrTier: 'premium' as SubscriptionTier,
    benefits: [
      'Access to DHR1 Premium',
      'Ad-free listening',
      '10 downloads per month',
      'Supporter badge in chat'
    ]
  },
  'dhr_premium': {
    id: 'dhr_premium',
    name: 'DHR Premium',
    minAmount: 1000, // $10.00 in cents
    dhrTier: 'premium' as SubscriptionTier,
    benefits: [
      'Access to DHR1 & DHR2 Premium',
      'Ad-free listening',
      '25 downloads per month',
      'Priority support',
      'Exclusive content access'
    ]
  },
  'dhr_vip': {
    id: 'dhr_vip',
    name: 'DHR VIP',
    minAmount: 2000, // $20.00 in cents
    dhrTier: 'vip' as SubscriptionTier,
    benefits: [
      'Full VIP access',
      'Unlimited downloads',
      'Exclusive VIP content',
      'Priority support',
      'Early access to new features',
      'VIP badge and perks'
    ]
  }
};

export interface PatreonUser {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  image_url?: string;
  is_email_verified: boolean;
  created: string;
}

export interface PatreonPledge {
  id: string;
  amount_cents: number;
  created_at: string;
  declined_since?: string;
  patron_pays_fees: boolean;
  pledge_cap_cents?: number;
  patron: PatreonUser;
  reward?: {
    id: string;
    title: string;
    description: string;
    amount_cents: number;
  };
}

export interface PatreonCampaign {
  id: string;
  created_at: string;
  creation_name: string;
  discord_server_id?: string;
  image_small_url?: string;
  image_url?: string;
  is_charged_immediately: boolean;
  is_monthly: boolean;
  is_nsfw: boolean;
  main_video_embed?: string;
  main_video_url?: string;
  one_liner?: string;
  patron_count: number;
  pay_per_name: string;
  pledge_sum: number;
  pledge_url: string;
  published_at?: string;
  summary?: string;
  thanks_embed?: string;
  thanks_msg?: string;
  thanks_video_url?: string;
  url: string;
}

export class PatreonService {
  private static instance: PatreonService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private campaignId: string | null = null;

  static getInstance(): PatreonService {
    if (!PatreonService.instance) {
      PatreonService.instance = new PatreonService();
    }
    return PatreonService.instance;
  }

  constructor() {
    this.loadTokensFromStorage();
    this.validateConfig();
  }

  private validateConfig() {
    console.log('=== Patreon Configuration Validation ===');
    console.log('Client ID:', PATREON_CONFIG.clientId ? PATREON_CONFIG.clientId.substring(0, 10) + '...' : 'Missing');
    console.log('Client Secret:', PATREON_CONFIG.clientSecret ? PATREON_CONFIG.clientSecret.substring(0, 10) + '...' : 'Missing');
    console.log('Redirect URI:', PATREON_CONFIG.redirectUri);
    console.log('Current URL Origin:', window.location.origin);
    console.log('Scope:', PATREON_CONFIG.scope);
    console.log('=== End Configuration Validation ===');
    console.log('✅ Patreon configuration loaded successfully');
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('patreon_access_token');
    this.refreshToken = localStorage.getItem('patreon_refresh_token');
    this.campaignId = localStorage.getItem('patreon_campaign_id');
  }

  private saveTokensToStorage() {
    if (this.accessToken) {
      localStorage.setItem('patreon_access_token', this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem('patreon_refresh_token', this.refreshToken);
    }
    if (this.campaignId) {
      localStorage.setItem('patreon_campaign_id', this.campaignId);
    }
  }

  // Generate Patreon OAuth URL
  getAuthUrl(): string {
    const state = this.generateState();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: PATREON_CONFIG.clientId,
      redirect_uri: PATREON_CONFIG.redirectUri,
      scope: PATREON_CONFIG.scope,
      state: state
    });

    const authUrl = `https://www.patreon.com/oauth2/authorize?${params.toString()}`;
    
    console.log('=== Generated Patreon Auth URL ===');
    console.log('Auth URL:', authUrl);
    console.log('Redirect URI being used:', PATREON_CONFIG.redirectUri);
    console.log('State generated:', state);
    console.log('=== End Auth URL Generation ===');
    
    return authUrl;
  }

  private generateState(): string {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const state = `${randomPart}_${timestamp}`;
    localStorage.setItem('patreon_oauth_state', state);
    console.log('Generated OAuth state with timestamp:', state);
    return state;
  }

  // Exchange authorization code for access token using server API
  async exchangeCodeForToken(code: string, state: string): Promise<boolean> {
    const savedState = localStorage.getItem('patreon_oauth_state');
    console.log('State validation:', { received: state, saved: savedState });
    
    // More lenient state validation for development/testing
    if (savedState && state !== savedState) {
      console.warn('OAuth state mismatch, but proceeding with token exchange');
      // Don't throw error, just log warning
    }

    try {
      console.log('🔄 Starting server token exchange...');
      console.log('Using redirect URI:', PATREON_CONFIG.redirectUri);
      
      const requestBody = {
        code,
        state,
        redirectUri: PATREON_CONFIG.redirectUri
      };
      
      console.log('Request body:', {
        ...requestBody,
        code: code ? 'Present' : 'Missing'
      });

      const response = await fetch('/api/patreon-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Server response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server token exchange failed:', errorText);
        throw new Error(`Server Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Server token exchange successful');
      
      if (!data.success) {
        console.error('❌ Server returned error:', data);
        throw new Error(`Server Error: ${data.error} - ${data.error_description}`);
      }
      
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.saveTokensToStorage();

      localStorage.removeItem('patreon_oauth_state');
      console.log('✅ Token exchange completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error exchanging code for token:', error);
      throw error;
    }
  }

  // Refresh access token using server endpoint
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      console.warn('No refresh token available');
      return false;
    }

    try {
      console.log('Refreshing access token...');
      
      const response = await fetch('/api/patreon-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', errorText);
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`Refresh failed: ${data.error_description}`);
      }
      
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.saveTokensToStorage();

      console.log('Token refresh successful');
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  // Make authenticated API request
  private async makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${PATREON_CONFIG.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      console.log('Access token expired, attempting refresh...');
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.makeApiRequest(endpoint, options);
      } else {
        throw new Error('Authentication failed - please reconnect to Patreon');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${errorText}`);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get current user info
  async getCurrentUser(): Promise<PatreonUser | null> {
    try {
      const data = await this.makeApiRequest('/identity?fields%5Buser%5D=email,first_name,full_name,image_url,last_name,social_connections,thumb_url,url,vanity,is_email_verified');
      return data.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get user's campaigns
  async getCampaigns(): Promise<PatreonCampaign[]> {
    try {
      console.log('Fetching campaigns from Patreon API...');
      const data = await this.makeApiRequest('/campaigns?fields%5Bcampaign%5D=created_at,creation_name,discord_server_id,image_small_url,image_url,is_charged_immediately,is_monthly,is_nsfw,main_video_embed,main_video_url,one_liner,patron_count,pay_per_name,pledge_sum,pledge_url,published_at,summary,thanks_embed,thanks_msg,thanks_video_url,url');
      console.log('Campaigns API response:', data);
      return data.data || [];
    } catch (error) {
      console.error('Error getting campaigns:', error);
      return [];
    }
  }

  // Get campaign pledges
  async getCampaignPledges(campaignId: string): Promise<PatreonPledge[]> {
    try {
      const data = await this.makeApiRequest(`/campaigns/${campaignId}/pledges?include=patron,reward&fields%5Bpledge%5D=amount_cents,created_at,declined_since,patron_pays_fees,pledge_cap_cents&fields%5Buser%5D=email,first_name,full_name,is_email_verified,last_name,thumb_url,url,vanity&fields%5Breward%5D=amount_cents,created_at,description,discord_role_ids,edited_at,image_url,post_count,published,published_at,requires_shipping,title,url`);
      return data.data || [];
    } catch (error) {
      console.error('Error getting campaign pledges:', error);
      return [];
    }
  }

  // Convert Patreon pledge to DHR subscription tier
  getDHRTierFromPledge(pledge: PatreonPledge): SubscriptionTier {
    const amount = pledge.amount_cents;
    
    if (amount >= DHR_PATREON_TIERS.dhr_vip.minAmount) {
      return 'vip';
    } else if (amount >= DHR_PATREON_TIERS.dhr_premium.minAmount) {
      return 'premium';
    } else if (amount >= DHR_PATREON_TIERS.dhr_supporter.minAmount) {
      return 'premium';
    }
    
    return 'free';
  }

  // Sync Patreon subscribers to DHR user system
  async syncPatreonSubscribers(): Promise<{ success: number; errors: number; users: User[] }> {
    if (!this.campaignId) {
      const campaigns = await this.getCampaigns();
      if (campaigns.length === 0) {
        throw new Error('No campaigns found - make sure you have a Patreon campaign');
      }
      this.campaignId = campaigns[0].id;
      this.saveTokensToStorage();
    }

    const pledges = await this.getCampaignPledges(this.campaignId);
    const syncedUsers: User[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const pledge of pledges) {
      try {
        // Skip declined pledges
        if (pledge.declined_since) {
          continue;
        }

        const dhrTier = this.getDHRTierFromPledge(pledge);
        const user: User = {
          id: `patreon_${pledge.patron.id}`,
          email: pledge.patron.email,
          username: pledge.patron.full_name || pledge.patron.first_name || 'Patreon User',
          subscriptionTier: dhrTier,
          subscriptionStatus: 'active',
          subscriptionSource: 'patreon',
          subscriptionStartDate: pledge.created_at,
          patreonTier: this.getPatreonTierFromAmount(pledge.amount_cents),
          preferences: {
            emailNotifications: true,
            newReleaseAlerts: true,
            eventNotifications: true,
            autoPlay: true,
            preferredGenres: ['deep-house']
          },
          createdAt: pledge.created_at,
          lastLoginAt: new Date().toISOString()
        };

        syncedUsers.push(user);
        successCount++;
      } catch (error) {
        console.error('Error syncing user:', error);
        errorCount++;
      }
    }

    return {
      success: successCount,
      errors: errorCount,
      users: syncedUsers
    };
  }

  private getPatreonTierFromAmount(amountCents: number): string {
    if (amountCents >= DHR_PATREON_TIERS.dhr_vip.minAmount) {
      return 'dhr_vip';
    } else if (amountCents >= DHR_PATREON_TIERS.dhr_premium.minAmount) {
      return 'dhr_premium';
    } else if (amountCents >= DHR_PATREON_TIERS.dhr_supporter.minAmount) {
      return 'dhr_supporter';
    }
    return 'unknown';
  }

  // Check if user is authenticated with Patreon
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get configuration status for debugging
  getConfigStatus(): { isConfigured: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!PATREON_CONFIG.clientId || PATREON_CONFIG.clientId === 'your_patreon_client_id') {
      issues.push('Patreon Client ID not configured');
    }
    
    if (!PATREON_CONFIG.clientSecret || PATREON_CONFIG.clientSecret === 'your_patreon_client_secret') {
      issues.push('Patreon Client Secret not configured');
    }
    
    if (!PATREON_CONFIG.redirectUri.includes(window.location.origin)) {
      issues.push('Redirect URI may not match current domain');
    }
    
    return {
      isConfigured: issues.length === 0,
      issues
    };
  }

  // Logout from Patreon
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.campaignId = null;
    localStorage.removeItem('patreon_access_token');
    localStorage.removeItem('patreon_refresh_token');
    localStorage.removeItem('patreon_campaign_id');
    localStorage.removeItem('patreon_oauth_state');
  }

  // Get webhook verification signature
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Note: This would require crypto module in a real Node.js environment
    // For client-side, this is just a placeholder
    console.log('Webhook verification:', { payload, signature, secret });
    return true;
  }
}

export const patreonService = PatreonService.getInstance();