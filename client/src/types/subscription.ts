export interface User {
  id: string;
  email: string;
  username: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionSource: SubscriptionSource;
  subscriptionStartDate: string;
  subscriptionEndDate?: string;
  patreonTier?: string;
  buyMeCoffeeSupporter?: boolean;
  wixSubscriberId?: string;
  preferences: UserPreferences;
  createdAt: string;
  lastLoginAt: string;
  // Additional Patreon-specific fields
  amount?: number;
  lastChargeDate?: string;
  nextChargeDate?: string;
  lifetimeSupport?: number;
}

export interface UserPreferences {
  emailNotifications: boolean;
  newReleaseAlerts: boolean;
  eventNotifications: boolean;
  autoPlay: boolean;
  preferredGenres: string[];
}

export type SubscriptionTier = 'free' | 'premium' | 'vip';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export type SubscriptionSource = 'patreon' | 'buymeacoffee' | 'wix' | 'direct';

export interface SubscriptionFeatures {
  canAccessDHR1: boolean;
  canAccessDHR2: boolean;
  canAccessVIP: boolean;
  canDownload: boolean;
  adFree: boolean;
  maxDownloadsPerMonth: number;
  canUploadMixes: boolean;
  prioritySupport: boolean;
  exclusiveContent: boolean;
}

export interface PatreonTier {
  id: string;
  name: string;
  amount: number;
  dhrTier: SubscriptionTier;
  features: SubscriptionFeatures;
}

export interface BuyMeCoffeeSupport {
  isSupporter: boolean;
  totalSupport: number;
  lastSupportDate: string;
  dhrTier: SubscriptionTier;
}