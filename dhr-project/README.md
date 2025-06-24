# DHR - Deep House Radio

A comprehensive deep house radio platform with intelligent track identification, premium streaming, and Patreon integration.

## Features

- 🎵 **Live Radio Streaming** - 24/7 deep house music
- 🎯 **Track Identification** - AI-powered track recognition using ACRCloud and Shazam
- 👑 **Premium Subscriptions** - DHR1, DHR2, and VIP tiers
- 🛍️ **Merchandise Shop** - Official DHR gear and collectibles
- 💬 **Live Chat** - Real-time community chat
- 📱 **Responsive Design** - Works on all devices
- 🔗 **Patreon Integration** - Automated subscriber management

## Admin Dashboard

The admin dashboard provides comprehensive control over:

### 📊 **Dashboard Overview**
- User statistics and analytics
- Revenue tracking
- Subscription tier breakdown
- Quick action buttons

### 👥 **User Management**
- View all users with filtering and search
- Export user data to CSV
- Manage subscription levels
- Track user activity

### 👑 **Patreon Integration**
- Connect to Patreon OAuth
- Sync subscribers automatically
- Map Patreon tiers to DHR access levels
- Real-time status monitoring

### 📈 **Analytics** (Coming Soon)
- Revenue trends
- User engagement metrics
- Subscription analytics
- Growth tracking

## Patreon Setup

### 1. Create Patreon Application

1. Go to [Patreon Developer Portal](https://www.patreon.com/portal/registration/register-clients)
2. Create a new client application
3. Set redirect URI to: `http://localhost:5173/auth/patreon/callback` (for development)
4. Note down your Client ID and Client Secret

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Patreon credentials:

```bash
VITE_PATREON_CLIENT_ID=your_patreon_client_id_here
VITE_PATREON_CLIENT_SECRET=your_patreon_client_secret_here
VITE_PATREON_REDIRECT_URI=http://localhost:5173/auth/patreon/callback
```

### 3. DHR Patreon Tiers

The system automatically maps Patreon pledge amounts to DHR access levels:

- **$5+ (DHR Supporter)** → Premium Access (DHR1 + 10 downloads/month)
- **$10+ (DHR Premium)** → Premium Access (DHR1 & DHR2 + 25 downloads/month)
- **$20+ (DHR VIP)** → VIP Access (Full access + unlimited downloads)

### 4. Connect and Sync

1. Navigate to `/admin` in your application
2. Go to the "Patreon" tab
3. Click "Connect to Patreon"
4. Authorize the application
5. Click "Sync Subscribers" to import your patrons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Fill in your Patreon credentials in `.env`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173)

### Admin Access

Navigate to `/admin` to access the admin dashboard. In production, you should add proper authentication to protect this route.

## API Integration

### Patreon API

The system uses Patreon's OAuth 2.0 API to:
- Authenticate campaign owners
- Fetch campaign information
- Retrieve patron pledges
- Sync subscription data

### Track Identification

Uses multiple services for track identification:
- **ACRCloud** - Primary identification service
- **Shazam** - Fallback service

## Deployment

### Environment Variables for Production

Update your `.env` for production:

```bash
VITE_PATREON_REDIRECT_URI=https://yourdomain.com/auth/patreon/callback
```

### Security Considerations

1. **Admin Route Protection** - Add authentication to `/admin`
2. **API Key Security** - Store sensitive keys server-side
3. **HTTPS** - Use HTTPS in production
4. **CORS** - Configure proper CORS settings

## Support

For support with Patreon integration or general questions:
- Email: deephouseradio@outlook.com
- Check the admin dashboard for sync status
- Review browser console for detailed error messages

## License

This project is proprietary software for DHR - Deep House Radio.