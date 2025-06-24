# DHR - Deep House Radio

A comprehensive deep house radio platform with intelligent track identification, premium streaming, and Patreon integration.

## 🚨 IMPORTANT: Patreon Setup Required

The error `{"error":"invalid_client"}` indicates that Patreon credentials need to be configured. Follow these steps:

### 1. Create Patreon Application

1. Go to [Patreon Developer Portal](https://www.patreon.com/portal/registration/register-clients)
2. Click "Create Client"
3. Fill in your application details:
   - **App Name**: DHR Admin Dashboard
   - **Description**: Admin dashboard for DHR subscriber management
   - **App Category**: Creator Tools
   - **Redirect URIs**: `http://localhost:5173/auth/patreon/callback` (for development)
4. Save and note down your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace the placeholder values:
   ```bash
   VITE_PATREON_CLIENT_ID=your_actual_client_id_here
   VITE_PATREON_CLIENT_SECRET=your_actual_client_secret_here
   VITE_PATREON_REDIRECT_URI=http://localhost:5173/auth/patreon/callback
   ```

### 3. Restart Development Server

After updating `.env`, restart your development server:
```bash
npm run dev
```

### 4. Test Connection

1. Navigate to `/admin`
2. Go to the "Patreon" tab
3. Click "Connect to Patreon"
4. You should be redirected to Patreon for authorization

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

## DHR Patreon Tiers

The system automatically maps Patreon pledge amounts to DHR access levels:

- **$5+ (DHR Supporter)** → Premium Access (DHR1 + 10 downloads/month)
- **$10+ (DHR Premium)** → Premium Access (DHR1 & DHR2 + 25 downloads/month)
- **$20+ (DHR VIP)** → VIP Access (Full access + unlimited downloads)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Patreon Creator Account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Patreon application (see above)

4. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Patreon credentials
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173)

### Admin Access

Navigate to `/admin` to access the admin dashboard.

## Troubleshooting

### "invalid_client" Error

This error occurs when:
1. **Missing credentials**: `.env` file not created or empty
2. **Wrong credentials**: Client ID/Secret don't match your Patreon app
3. **Redirect URI mismatch**: The redirect URI in your Patreon app doesn't match the one in `.env`

**Solution**: Follow the Patreon setup steps above carefully.

### "Configuration Required" Warning

The admin dashboard will show configuration warnings if:
- Environment variables are not set
- Credentials are still using placeholder values
- Redirect URI doesn't match current domain

### Debug Information

The browser console will show detailed information about:
- Configuration validation
- OAuth flow steps
- API request/response details
- Error messages with specific causes

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

Make sure to update your Patreon app's redirect URI to match your production domain.

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