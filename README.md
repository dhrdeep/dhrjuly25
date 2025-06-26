# Deep House Radio (DHR) - Premium Music Streaming Platform

A sophisticated web application for Deep House Radio that provides comprehensive cross-platform audio streaming with advanced content management and robust admin tools.

## 🎵 Features

### Streaming Channels
- **DHR1** - Premium deep house music (€3/month)
- **DHR2** - Exclusive DJ sets (€5/month)
- **VIP** - Full access to 1TB+ exclusive content library (€10/month)

### Core Functionality
- **Live Metadata Display** - Real-time track identification from stream
- **Track Identifier** - AI-powered track recognition for subscribers
- **VIP Content System** - 1000+ exclusive mix collection with search and filtering
- **Download Management** - Daily download limits for VIP subscribers
- **Community Forum** - User discussions and music news
- **Admin Dashboard** - Comprehensive user and subscriber management
- **Patreon Integration** - Subscription tier management with 1123+ patrons

### Technical Highlights
- **DigitalOcean Spaces Integration** - Secure file hosting with signed URLs
- **Bulk Import System** - CSV support for managing large collections
- **Real-time Metadata** - Authentic track data extraction from live streams
- **Multi-device Casting** - Sonos, Chromecast, AirPlay support
- **Responsive Design** - Mobile-first approach with dark theme

## 🚀 Tech Stack

- **Frontend**: React 18 with TypeScript, Tailwind CSS, Wouter routing
- **Backend**: Express.js with TypeScript
- **Database**: Neon PostgreSQL with Drizzle ORM
- **File Storage**: DigitalOcean Spaces (AWS S3 compatible)
- **Authentication**: Patreon OAuth integration
- **Streaming**: Shoutcast/Icecast with real-time metadata
- **Build Tool**: Vite with HMR support

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/deep-house-radio.git
cd deep-house-radio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy example environment file
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_PATREON_CLIENT_ID` - Patreon OAuth client ID
- `VITE_PATREON_CLIENT_SECRET` - Patreon OAuth client secret
- `VITE_PATREON_REDIRECT_URI` - OAuth redirect URI
- `DIGITALOCEAN_SPACES_KEY` - DigitalOcean Spaces access key
- `DIGITALOCEAN_SPACES_SECRET` - DigitalOcean Spaces secret key

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## 🎯 Usage

### For Listeners
1. Visit the homepage and choose your subscription tier
2. Connect via Patreon OAuth for premium access
3. Stream DHR1, DHR2, or access VIP content based on subscription
4. Use Track Identifier to recognize playing songs
5. Download VIP mixes (2 per day for VIP subscribers)

### For Admins
1. Access `/admin-dashboard` for system overview
2. Sync Patreon subscribers via `/sync`
3. Manage VIP content via `/vip-admin`
4. Bulk import mixes via `/bulk-import`
5. Configure storage via `/storage-setup`

## 🏗️ Architecture

### Database Schema
- `users` - User accounts with subscription tiers
- `patreon_tokens` - OAuth tokens for Patreon integration
- `vip_mixes` - VIP content with metadata and access control
- `download_tracking` - Daily download limits enforcement

### File Hosting
- **Production**: DigitalOcean Spaces with signed URLs
- **Development**: Local file serving
- **Backup**: Direct URL fallback system

### Subscription Tiers
- **Free (€0)** - Landing page and free stream access
- **DHR1 (€3+)** - DHR1 channel + track identification
- **DHR2 (€5+)** - DHR1 + DHR2 channels + track identification
- **VIP (€10+)** - Full access including VIP downloads

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio for database management

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── services/       # API services
│   │   └── lib/           # Utilities and helpers
├── server/                 # Express backend
│   ├── routes.ts          # API routes
│   ├── db.ts              # Database connection
│   └── fileHostingService.ts # File hosting abstraction
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Drizzle database schema
└── dist/                  # Production build output
```

## 🌐 Deployment

### Production Deployment
1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Deploy to your hosting platform (Replit, Vercel, etc.)
4. Ensure DATABASE_URL points to production database
5. Configure DigitalOcean Spaces for file hosting

### Environment Configuration
- Development uses shell command metadata extraction
- Production uses HTTP stream connection with Icy-MetaData headers
- Automatic fallback system ensures reliability across environments

## 📊 Admin Features

### Subscriber Management
- Real-time sync with Patreon API (1123+ patrons)
- Buy Me a Coffee integration
- Subscription expiration tracking
- Detailed subscriber analytics

### Content Management
- Bulk import via CSV files
- DigitalOcean Spaces synchronization
- Automated metadata extraction
- Search and filtering capabilities

### System Monitoring
- Storage usage tracking
- Download statistics
- User engagement metrics
- Error logging and reporting

## 🔐 Security

- OAuth 2.0 authentication via Patreon
- Signed URLs for secure file access
- Rate limiting on API endpoints
- Input validation with Zod schemas
- CORS configuration for cross-origin requests

## 📈 Performance

- Real-time metadata caching
- Optimized database queries with Drizzle ORM
- CDN integration for static assets
- Lazy loading for large content collections
- Progressive web app capabilities

## 🎨 UI/UX Features

- Dark theme with orange accent colors
- Responsive design for all devices
- Animated visualizers and progress indicators
- Accessibility compliance (ARIA labels, keyboard navigation)
- Custom scrollbars and hover effects

## 🔄 Recent Updates

- **June 2025**: Complete React hooks error fixes
- **June 2025**: Casting functionality for Sonos and media devices
- **June 2025**: Production deployment metadata system
- **June 2025**: DigitalOcean Spaces migration completion
- **June 2025**: Bulk import system for 1000+ mix collections
- **June 2025**: Real-time metadata implementation

## 📝 License

This project is proprietary software for Deep House Radio. All rights reserved.

## 🤝 Contributing

This is a private project. For questions or support, contact the development team.

## 📞 Support

- Website: [Deep House Radio](https://deephouseradio.com)
- Patreon: [Support DHR](https://patreon.com/deephouseradio)
- Instagram: [@deephouseradio](https://instagram.com/deephouseradio)
- Twitter: [@deephouseradi0](https://twitter.com/deephouseradi0)

---

Built with ❤️ for the deep house community