import { VipMix } from "@shared/schema";

export interface VipAccess {
  canView: boolean;
  canPlay: boolean;
  canDownload: boolean;
  remainingDownloads: number;
  subscriptionTier: string;
  message?: string;
}

export class VipService {
  private static instance: VipService;
  private currentUser: any = null;

  static getInstance(): VipService {
    if (!VipService.instance) {
      VipService.instance = new VipService();
    }
    return VipService.instance;
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async fetchVipMixes(): Promise<VipMix[]> {
    try {
      const response = await fetch('/api/vip-mixes');
      if (!response.ok) {
        throw new Error('Failed to fetch VIP mixes');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching VIP mixes:', error);
      return [];
    }
  }

  async checkAccess(userId?: string): Promise<VipAccess> {
    if (!userId) {
      return {
        canView: true, // Everyone can view
        canPlay: false,
        canDownload: false,
        remainingDownloads: 0,
        subscriptionTier: 'free',
        message: 'Sign in to access premium features'
      };
    }

    try {
      const response = await fetch(`/api/download-limits/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to check access');
      }
      
      const data = await response.json();
      const tier = data.subscriptionTier || 'free';
      
      return {
        canView: true, // Everyone can view
        canPlay: ['dhr1', 'dhr2', 'vip'].includes(tier),
        canDownload: tier === 'vip' && data.remainingDownloads > 0,
        remainingDownloads: data.remainingDownloads || 0,
        subscriptionTier: tier,
        message: this.getAccessMessage(tier, data.remainingDownloads)
      };
    } catch (error) {
      console.error('Error checking access:', error);
      return {
        canView: true,
        canPlay: false,
        canDownload: false,
        remainingDownloads: 0,
        subscriptionTier: 'free',
        message: 'Unable to verify subscription status'
      };
    }
  }

  private getAccessMessage(tier: string, remainingDownloads: number): string {
    switch (tier) {
      case 'free':
        return 'Subscribe to DHR1 (€3+) to play mixes, or VIP (€10+) to download';
      case 'dhr1':
        return 'Upgrade to VIP (€10+) to download mixes';
      case 'dhr2':
        return 'Upgrade to VIP (€10+) to download mixes';
      case 'vip':
        return remainingDownloads > 0 
          ? `${remainingDownloads} of 2 downloads remaining today`
          : 'Daily download limit reached (2/day, resets tomorrow)';
      default:
        return 'Unknown subscription status';
    }
  }

  async downloadMix(mixId: number, userId: string): Promise<{ success: boolean; downloadUrl?: string; message: string }> {
    try {
      const response = await fetch(`/api/download/${mixId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Download failed'
        };
      }

      // Open Jumpshare download in new tab
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      }

      return {
        success: true,
        message: `Download started! ${data.remainingDownloads} downloads remaining today`
      };

    } catch (error) {
      console.error('Error downloading mix:', error);
      return {
        success: false,
        message: 'Download failed due to network error'
      };
    }
  }

  getTierColor(tier: string): string {
    switch (tier) {
      case 'vip':
        return 'from-orange-500 to-orange-600';
      case 'dhr2':
        return 'from-purple-500 to-purple-600';
      case 'dhr1':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  }

  getTierName(tier: string): string {
    switch (tier) {
      case 'vip':
        return 'VIP';
      case 'dhr2':
        return 'DHR2';
      case 'dhr1':
        return 'DHR1';
      default:
        return 'Free';
    }
  }
}

export const vipService = VipService.getInstance();