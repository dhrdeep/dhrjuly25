import { User } from '@shared/schema';

export type AccessTier = 'free' | 'dhr1' | 'dhr2' | 'vip';

export interface AccessPermissions {
  canAccessDHR1: boolean;
  canAccessDHR2: boolean;
  canAccessVIP: boolean;
  canComment: boolean;
  canDownload: boolean;
  canAutoSignInChat: boolean;
  dailyDownloadLimit: number;
}

export function getAccessPermissions(user: User | null): AccessPermissions {
  if (!user) {
    return {
      canAccessDHR1: false,
      canAccessDHR2: false,
      canAccessVIP: false,
      canComment: false,
      canDownload: false,
      canAutoSignInChat: false,
      dailyDownloadLimit: 0,
    };
  }

  const tier = user.subscriptionTier as AccessTier;
  
  // Check if subscription is active and not expired
  const isActiveSubscription = user.subscriptionStatus === 'active' && 
    (!user.subscriptionExpiry || new Date(user.subscriptionExpiry) > new Date());

  if (!isActiveSubscription) {
    return {
      canAccessDHR1: false,
      canAccessDHR2: false,
      canAccessVIP: false,
      canComment: false,
      canDownload: false,
      canAutoSignInChat: false,
      dailyDownloadLimit: 0,
    };
  }

  switch (tier) {
    case 'vip':
      return {
        canAccessDHR1: true,
        canAccessDHR2: true,
        canAccessVIP: true,
        canComment: true,
        canDownload: true,
        canAutoSignInChat: true,
        dailyDownloadLimit: 2,
      };
    
    case 'dhr2':
      return {
        canAccessDHR1: true,
        canAccessDHR2: true,
        canAccessVIP: false,
        canComment: true,
        canDownload: false,
        canAutoSignInChat: true,
        dailyDownloadLimit: 0,
      };
    
    case 'dhr1':
      return {
        canAccessDHR1: true,
        canAccessDHR2: false,
        canAccessVIP: false,
        canComment: true,
        canDownload: false,
        canAutoSignInChat: true,
        dailyDownloadLimit: 0,
      };
    
    case 'free':
    default:
      return {
        canAccessDHR1: false,
        canAccessDHR2: false,
        canAccessVIP: false,
        canComment: false,
        canDownload: false,
        canAutoSignInChat: false,
        dailyDownloadLimit: 0,
      };
  }
}

export function requiresSubscription(tier: AccessTier): boolean {
  return tier !== 'free';
}

export function getSubscriptionAmountFromTier(tier: AccessTier): number {
  switch (tier) {
    case 'dhr1': return 3;
    case 'dhr2': return 5;
    case 'vip': return 10;
    default: return 0;
  }
}

export function getTierFromAmount(amount: number): AccessTier {
  if (amount >= 10) return 'vip';
  if (amount >= 5) return 'dhr2';
  if (amount >= 3) return 'dhr1';
  return 'free';
}

export function getTierDisplayName(tier: AccessTier): string {
  switch (tier) {
    case 'dhr1': return 'DHR1 Subscriber';
    case 'dhr2': return 'DHR2 Subscriber';
    case 'vip': return 'VIP Member';
    case 'free': return 'Free User';
    default: return 'Unknown';
  }
}

export function getTierColor(tier: AccessTier): string {
  switch (tier) {
    case 'dhr1': return 'text-orange-500';
    case 'dhr2': return 'text-amber-500';
    case 'vip': return 'text-yellow-500';
    case 'free': return 'text-gray-500';
    default: return 'text-gray-500';
  }
}