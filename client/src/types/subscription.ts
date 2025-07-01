export interface User {
  id: string;
  email: string;
  username: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionSource: SubscriptionSource;
  subscriptionStartDate: string;
  subscriptionExpiry?: string;
  patreonTier?: string;
  pledgeAmount?: number; // Amount in cents
  joinDate?: string;
  cancelDate?: string;
  notes?: string;
  privateUrls?: Record<string, string>; // Store private URLs for this user
  accessHistory?: any[]; // Track access patterns
  lifetimeSupport?: number; // Total lifetime contribution in cents
  lastChargeDate?: string;
  nextChargeDate?: string;
  totalDownloads?: number;
  preferences: UserPreferences;
  createdAt: string;
  lastLoginAt: string;
  // Legacy fields for compatibility
  subscriptionEndDate?: string;
  buyMeCoffeeSupporter?: boolean;
  wixSubscriberId?: string;
  amount?: number;
}

export interface UserPreferences {
  emailNotifications: boolean;
  newReleaseAlerts: boolean;
  eventNotifications: boolean;
  autoPlay: boolean;
  preferredGenres: string[];
}

export type SubscriptionTier = 'free' | 'dhr1' | 'dhr2' | 'vip';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export type SubscriptionSource = 'patreon' | 'buymeacoffee' | 'bmac' | 'wix' | 'direct' | 'manual';

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