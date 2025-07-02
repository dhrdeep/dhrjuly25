import { User, SubscriptionTier, SubscriptionFeatures, PatreonTier, BuyMeCoffeeSupport } from '../types/subscription';

// Patreon tier mapping
export const PATREON_TIERS: PatreonTier[] = [
  {
    id: 'dhr1',
    name: 'DHR1',
    amount: 3,
    dhrTier: 'dhr1',
    features: {
      canAccessDHR1: true,
      canAccessDHR2: false,
      canAccessVIP: false,
      canDownload: true,
      adFree: false,
      maxDownloadsPerMonth: 10,
      canUploadMixes: false,
      prioritySupport: false,
      exclusiveContent: false
    }
  },
  {
    id: 'dhr2',
    name: 'DHR2',
    amount: 5,
    dhrTier: 'dhr2',
    features: {
      canAccessDHR1: true,
      canAccessDHR2: true,
      canAccessVIP: false,
      canDownload: true,
      adFree: true,
      maxDownloadsPerMonth: 50,
      canUploadMixes: true,
      prioritySupport: false,
      exclusiveContent: false
    }
  },
  {
    id: 'vip',
    name: 'VIP',
    amount: 10,
    dhrTier: 'vip',
    features: {
      canAccessDHR1: true,
      canAccessDHR2: true,
      canAccessVIP: true,
      canDownload: true,
      adFree: true,
      maxDownloadsPerMonth: -1, // Unlimited
      canUploadMixes: true,
      prioritySupport: true,
      exclusiveContent: true
    }
  }
];

// Buy Me a Coffee tier mapping
export const getBuyMeCoffeeFeatures = (totalSupport: number): BuyMeCoffeeSupport => {
  if (totalSupport >= 50) {
    return {
      isSupporter: true,
      totalSupport,
      lastSupportDate: new Date().toISOString(),
      dhrTier: 'vip'
    };
  } else if (totalSupport >= 20) {
    return {
      isSupporter: true,
      totalSupport,
      lastSupportDate: new Date().toISOString(),
      dhrTier: 'dhr2'
    };
  } else if (totalSupport >= 5) {
    return {
      isSupporter: true,
      totalSupport,
      lastSupportDate: new Date().toISOString(),
      dhrTier: 'dhr1'
    };
  }
  
  return {
    isSupporter: false,
    totalSupport,
    lastSupportDate: new Date().toISOString(),
    dhrTier: 'free'
  };
};

// Get subscription features based on tier
export const getSubscriptionFeatures = (tier: SubscriptionTier): SubscriptionFeatures => {
  switch (tier) {
    case 'vip':
      return {
        canAccessDHR1: true,
        canAccessDHR2: true,
        canAccessVIP: true,
        canDownload: true,
        adFree: true,
        maxDownloadsPerMonth: -1, // Unlimited
        canUploadMixes: true,
        prioritySupport: true,
        exclusiveContent: true
      };
    case 'dhr2':
      return {
        canAccessDHR1: true,
        canAccessDHR2: true,
        canAccessVIP: false,
        canDownload: true,
        adFree: true,
        maxDownloadsPerMonth: 50,
        canUploadMixes: true,
        prioritySupport: false,
        exclusiveContent: false
      };
    case 'dhr1':
      return {
        canAccessDHR1: true,
        canAccessDHR2: false,
        canAccessVIP: false,
        canDownload: true,
        adFree: false,
        maxDownloadsPerMonth: 10,
        canUploadMixes: false,
        prioritySupport: false,
        exclusiveContent: false
      };
    case 'free':
    default:
      return {
        canAccessDHR1: false,
        canAccessDHR2: false,
        canAccessVIP: false,
        canDownload: false,
        adFree: false,
        maxDownloadsPerMonth: 0,
        canUploadMixes: false,
        prioritySupport: false,
        exclusiveContent: false
      };
  }
};

// Subscription service class
export class SubscriptionService {
  private static instance: SubscriptionService;
  private users: Map<string, User> = new Map();
  private currentUser: User | null = null;

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  // Initialize with demo data for development
  constructor() {}

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('dhr_user');
  }

  getCurrentUser(): User | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('dhr_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    }
    return this.currentUser;
  }

  // Subscription management
  getUserFeatures(user?: User): SubscriptionFeatures {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser) {
      return getSubscriptionFeatures('free');
    }
    return getSubscriptionFeatures(currentUser.subscriptionTier);
  }

  canAccessContent(contentType: 'dhr1' | 'dhr2' | 'vip', user?: User): boolean {
    const features = this.getUserFeatures(user);
    switch (contentType) {
      case 'dhr1':
        return features.canAccessDHR1;
      case 'dhr2':
        return features.canAccessDHR2;
      case 'vip':
        return features.canAccessVIP;
      default:
        return false;
    }
  }

  canDownload(user?: User): boolean {
    const features = this.getUserFeatures(user);
    return features.canDownload;
  }

  getRemainingDownloads(user?: User): number {
    const currentUser = user || this.getCurrentUser();
    const features = this.getUserFeatures(currentUser);
    
    if (features.maxDownloadsPerMonth === -1) {
      return -1; // Unlimited
    }
    
    // In production, track actual downloads from database
    return features.maxDownloadsPerMonth;
  }

  // Patreon integration methods
  async syncPatreonSubscription(patreonUserId: string): Promise<void> {
    // This would sync with Patreon API to get current subscription status
    console.log('Syncing Patreon subscription for user:', patreonUserId);
  }

  // Buy Me a Coffee integration methods
  async syncBuyMeCoffeeSupport(email: string): Promise<void> {
    // This would sync with Buy Me a Coffee API
    console.log('Syncing Buy Me a Coffee support for:', email);
  }

  // Wix migration methods
  async importWixSubscribers(wixData: any[]): Promise<void> {
    // This would import existing Wix subscribers
    console.log('Importing Wix subscribers:', wixData.length);
  }

  // Subscription upgrade/downgrade
  async upgradeSubscription(newTier: SubscriptionTier): Promise<boolean> {
    const user = this.getCurrentUser();
    if (!user) return false;

    user.subscriptionTier = newTier;
    this.users.set(user.id, user);
    localStorage.setItem('dhr_user', JSON.stringify(user));
    return true;
  }
}

// Export singleton instance
export const subscriptionService = SubscriptionService.getInstance();