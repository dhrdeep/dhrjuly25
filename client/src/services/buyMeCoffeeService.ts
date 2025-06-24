import { User, SubscriptionTier } from '../types/subscription';

export interface BuyMeCoffeeSupporter {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  total_donated: number;
  first_donation_date: string;
  last_donation_date: string;
  message?: string;
  is_private: boolean;
  currency: string;
}

export interface BuyMeCoffeeWebhookPayload {
  supporter_name: string;
  supporter_email: string;
  support_coffee_price: number;
  support_coffees: number;
  support_note: string;
  support_id: string;
  support_created_on: string;
  support_updated_on: string;
  is_refunded: boolean;
}

export class BuyMeCoffeeService {
  private static instance: BuyMeCoffeeService;
  private accessToken: string | null = null;

  static getInstance(): BuyMeCoffeeService {
    if (!BuyMeCoffeeService.instance) {
      BuyMeCoffeeService.instance = new BuyMeCoffeeService();
    }
    return BuyMeCoffeeService.instance;
  }

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    // Buy Me a Coffee API token (if available)
    this.accessToken = import.meta.env.VITE_BUYMEACOFFEE_ACCESS_TOKEN || null;
  }

  // Calculate DHR tier based on total support amount
  getDHRTierFromSupport(totalSupport: number): SubscriptionTier {
    // Convert to euros (assuming USD, adjust as needed)
    const supportInEuros = totalSupport; // Adjust conversion rate if needed
    
    if (supportInEuros >= 10) { // €10+ total support - VIP
      return 'vip';
    } else if (supportInEuros >= 5) { // €5+ total support - DHR2
      return 'dhr2';
    } else if (supportInEuros >= 3) { // €3+ total support - DHR1
      return 'dhr1';
    }
    
    return 'free';
  }

  // Get subscription expiration based on last donation (30 days from last donation)
  getSubscriptionEndDate(lastDonationDate: string): string {
    const lastDonation = new Date(lastDonationDate);
    const expirationDate = new Date(lastDonation);
    expirationDate.setDate(expirationDate.getDate() + 30); // 30-day access from last donation
    return expirationDate.toISOString();
  }

  // Convert Buy Me a Coffee supporter to User format
  convertSupporterToUser(supporter: BuyMeCoffeeSupporter): User {
    const tier = this.getDHRTierFromSupport(supporter.total_donated);
    const subscriptionEndDate = this.getSubscriptionEndDate(supporter.last_donation_date);
    const isActive = new Date(subscriptionEndDate) > new Date();

    return {
      id: `buymeacoffee_${supporter.id}`,
      email: supporter.email,
      username: supporter.name,
      subscriptionTier: tier,
      subscriptionStatus: isActive ? 'active' : 'expired',
      subscriptionSource: 'buymeacoffee',
      subscriptionStartDate: supporter.first_donation_date,
      subscriptionEndDate: subscriptionEndDate,
      preferences: {
        emailNotifications: true,
        newReleaseAlerts: true,
        eventNotifications: false,
        autoPlay: true,
        preferredGenres: ['deep-house']
      },
      createdAt: supporter.first_donation_date,
      lastLoginAt: new Date().toISOString(),
      amount: Math.round(supporter.total_donated * 100), // Convert to cents
      lastChargeDate: supporter.last_donation_date,
      lifetimeSupport: Math.round(supporter.total_donated * 100)
    };
  }

  // Sync Buy Me a Coffee supporters (mock data for now - replace with real API call)
  async syncSupporters(): Promise<{ success: number; errors: number; users: User[] }> {
    try {
      // TODO: Replace with actual Buy Me a Coffee API call
      // For now, return empty result - user can manually add supporters
      console.log('Buy Me a Coffee sync initiated - API integration pending');
      
      return {
        success: 0,
        errors: 0,
        users: []
      };
    } catch (error) {
      console.error('Buy Me a Coffee sync failed:', error);
      return {
        success: 0,
        errors: 1,
        users: []
      };
    }
  }

  // Process webhook payload from Buy Me a Coffee
  processWebhook(payload: BuyMeCoffeeWebhookPayload): User | null {
    try {
      const supporter: BuyMeCoffeeSupporter = {
        id: payload.support_id,
        name: payload.supporter_name,
        email: payload.supporter_email,
        total_donated: payload.support_coffee_price * payload.support_coffees,
        first_donation_date: payload.support_created_on,
        last_donation_date: payload.support_updated_on,
        message: payload.support_note,
        is_private: false,
        currency: 'USD' // Default to USD
      };

      return this.convertSupporterToUser(supporter);
    } catch (error) {
      console.error('Error processing Buy Me a Coffee webhook:', error);
      return null;
    }
  }

  // Manual supporter addition (for CSV imports or manual entry)
  createManualSupporter(
    name: string,
    email: string,
    totalSupport: number,
    lastDonationDate: string
  ): User {
    const supporter: BuyMeCoffeeSupporter = {
      id: `manual_${Date.now()}`,
      name,
      email,
      total_donated: totalSupport,
      first_donation_date: lastDonationDate,
      last_donation_date: lastDonationDate,
      is_private: false,
      currency: 'EUR'
    };

    return this.convertSupporterToUser(supporter);
  }

  isConfigured(): boolean {
    return !!this.accessToken;
  }

  getConfigStatus(): { isConfigured: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!this.accessToken) {
      issues.push('VITE_BUYMEACOFFEE_ACCESS_TOKEN not configured');
    }

    return {
      isConfigured: issues.length === 0,
      issues
    };
  }
}

export const buyMeCoffeeService = BuyMeCoffeeService.getInstance();