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
    // Buy Me a Coffee API token
    this.accessToken = import.meta.env.VITE_BUYMEACOFFEE_ACCESS_TOKEN || 
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5MTI5ZDIwMC1kYTdkLTRjY2MtOWQzZC01ODA0MTU0ZTgyMjYiLCJqdGkiOiJiYTZmZDI4NjkzZWU4YTUyMTQ1MTQzMmExZmQxODY1MmUyYTA2NDYxNDBlMDhkMTkzNjE2N2NlYTViYjJjMmI3MTNjZTI3YmM0MzdmZDY3ZCIsImlhdCI6MTc1MDc5NjA5NCwibmJmIjoxNzUwNzk2MDk0LCJleHAiOjE3NjY2MDcyOTQsInN1YiI6IjY4NDM1ODQiLCJzY29wZXMiOlsicmVhZC1vbmx5Il19.vurkvE6WBmmQCdTCUgcJdgb1z918bRtH7J6K3-fNglh23g_CT0AMeqmZLesyssyZfVMTwUZ4i6ldNjiEeAylGhyNJHDqcoTaU4k7dBOkXbn5JZjZPYBSDl3HL5Xj06Owe0U_tZSGE16CFNqy6wW_1snGmo-8afY2mVmxVatWWpJuEEZVDlF0lwMXzLIr0i62atRPkKvtq-aA1z2HtVX8WSgZqCow58fxRFOTOGS2z87fASiGkObQU8jpTIb3MPfS3KQPX63bce2uZ_u2IebSOiawyL2VjsVr0qUxlOk4ElcKRFGqdrVbT2dWHJvYi-t8Uue38Qk1uOj5WYpAP-zOwbzepI-tKeEgnOjC2dJctm1Do40u-3MQnzZbzb5RCusiiZQ4qE5Jw4RH_5883YcJlVf0A_HKusyh2cFaROkGC08i81PLKtDd7bC70omttMSuUcQEfggZxzLHnEuyZ_UXZ-03JuxozrHUX-Zx79DXfZdkt6tQbJiu0l4GkS7Jfs8ffAvuqGv5EcaoqQK99p4SFDvvji54uAYqOFCMhiuNdosTkgi6rwl4pKaox-FVFq1198-wa7pRDSJqpj8taDCsjTvQDYX0aicGOvX1TuOZzSB5RUXTTuChqek2iP18j4eo9B7H5kEZVtv4_StyVoKEYDsyypw2G5DZBcZYtyz76ac';
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

  // Sync Buy Me a Coffee supporters using real API
  async syncSupporters(): Promise<{ success: number; errors: number; users: User[] }> {
    if (!this.accessToken) {
      console.error('No Buy Me a Coffee access token available');
      return { success: 0, errors: 1, users: [] };
    }

    try {
      // Fetch all supporters with pagination
      let allSupporters: any[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        console.log(`Fetching Buy Me a Coffee subscribers/supporters page ${page}...`);
        
        // Try both supporters and subscriptions endpoints
        let response = await fetch(`https://developers.buymeacoffee.com/api/v1/subscriptions?page=${page}&per_page=50`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        // If subscriptions endpoint fails, fallback to supporters
        if (!response.ok) {
          console.log(`Subscriptions endpoint failed (${response.status}), trying supporters...`);
          response = await fetch(`https://developers.buymeacoffee.com/api/v1/supporters?page=${page}&per_page=50`, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
        }

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const supporters = data.data || [];
        
        console.log(`API Response for page ${page}:`, JSON.stringify(data, null, 2));
        
        if (supporters.length === 0) {
          hasMore = false;
        } else {
          allSupporters = [...allSupporters, ...supporters];
          page++;
          
          // Safety check to prevent infinite loops
          if (page > 100) {
            console.warn('Reached maximum page limit (100), stopping pagination');
            hasMore = false;
          }
        }
      }
      
      console.log(`Found ${allSupporters.length} total Buy Me a Coffee members/supporters across ${page - 1} pages`);
      
      if (allSupporters.length > 0) {
        console.log('Sample supporter data:', JSON.stringify(allSupporters[0], null, 2));
        console.log('All supporter keys:', Object.keys(allSupporters[0]));
      }
      
      const users: User[] = [];
      let errors = 0;

      for (const supporter of allSupporters) {
        try {
          console.log('Processing supporter:', JSON.stringify(supporter, null, 2));
          
          // Handle both subscription and supporter response formats
          const supporterData = {
            id: supporter.id || supporter.support_id || supporter.subscription_id || `bmc_${Date.now()}_${Math.random()}`,
            name: supporter.payer_name || supporter.supporter_name || supporter.name || supporter.full_name || supporter.member_name || 'Anonymous',
            email: supporter.payer_email || supporter.supporter_email || supporter.email || supporter.member_email || `supporter_${supporter.id || 'unknown'}@buymeacoffee.com`,
            total_donated: supporter.total_amount || 
                          supporter.subscription_price ||
                          supporter.membership_amount ||
                          (supporter.support_coffee_price && supporter.support_coffees ? supporter.support_coffee_price * supporter.support_coffees : null) ||
                          supporter.amount || 
                          supporter.coffee_price || 
                          5, // Default minimum
            first_donation_date: supporter.created_on || supporter.support_created_on || supporter.first_support_date || supporter.created_at || supporter.subscription_start_date || new Date().toISOString(),
            last_donation_date: supporter.updated_on || supporter.support_updated_on || supporter.last_support_date || supporter.updated_at || supporter.subscription_renews_on || new Date().toISOString(),
            message: supporter.support_note || supporter.message || supporter.note || '',
            is_private: supporter.is_private || false,
            currency: supporter.currency || supporter.subscription_currency || 'USD'
          };
          
          console.log('Converted supporter data:', JSON.stringify(supporterData, null, 2));
          
          const user = this.convertSupporterToUser(supporterData);
          users.push(user);
        } catch (error) {
          console.error('Error converting supporter:', supporter, error);
          errors++;
        }
      }

      console.log(`Successfully converted ${users.length} supporters, ${errors} errors`);
      
      return {
        success: users.length,
        errors,
        users
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

  // Parse CSV data from Buy Me a Coffee export
  parseCsvData(csvContent: string): User[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const users: User[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length < headers.length) continue;
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      // Only process active subscriptions
      if (row['Subscription status'] !== 'Active') continue;
      
      const supporter: BuyMeCoffeeSupporter = {
        id: `bmc_${Date.now()}_${i}`,
        name: row['Member Name'] || 'Anonymous',
        email: row['Member Email'],
        total_donated: parseFloat(row['Membership amount']) || 0,
        first_donation_date: row['Membership start date'] || new Date().toISOString(),
        last_donation_date: row['Membership renews on'] || new Date().toISOString(),
        is_private: false,
        currency: row['Membership amount currency'] || 'EUR'
      };
      
      users.push(this.convertSupporterToUser(supporter));
    }
    
    return users;
  }
  
  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
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