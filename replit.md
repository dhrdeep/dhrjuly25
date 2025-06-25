# Deep House Radio (DHR) - Replit Project

## Overview
Deep House Radio is a premium music streaming platform specializing in deep house music. The application features multiple streaming channels (DHR1, DHR2), VIP content access, track identification, community forums, merchandise shop, and Patreon integration for subscription management.

## Project Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, React Router
- **Backend**: Express.js with TypeScript
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Patreon OAuth integration
- **Deployment**: Replit environment

## Recent Changes
- **June 25, 2025**: Scalable VIP Content System For 1000+ Mix Collection Completed
  - Built bulk import system with CSV support for managing 1000+ mix sets efficiently
  - Added comprehensive search functionality with genre filtering and tag-based search
  - Created storage solution comparison guide (Jumpshare, AWS S3, Direct Server, Hybrid)
  - Implemented tiered access system: view (all users), play (DHR1/DHR2), download (VIP with daily limits)
  - Added VIP mix database tables with searchable tags column for better organization
  - Created download tracking and daily limit enforcement (2 downloads/day for VIP)
  - Real-time notifications for access restrictions and subscription status
  - Enhanced navigation logo matching bottom logo design with proper DHR branding
- **June 25, 2025**: Enhanced DHR premium players with Everestcast integration and animated branding
  - Implemented authentic DHR1 Everestcast player (600x1000px) with dark theme styling
  - Created DHR2 Everestcast player (300x600px) with matching color scheme using Vue.js widget system
  - Added site-wide floating DHR logo animation with 60 BPM pulse and spinning effects
  - Applied consistent orange accent colors (#f79e02) across all player elements
  - Removed placeholder content in favor of real streaming functionality
  - DHR2 player configured with proper HTML document structure and Vue initialization
  - Implemented ambient background mood generator with dynamic particle effects based on current track
  - Added intelligent track analysis for mood detection (energetic, chill, deep, dark, uplifting, ambient)
  - Integrated real-time track data fetching from Everestcast APIs with BPM and energy estimation
  - **Landing Page Player Update**: Replaced Everestcast iframe with direct Shoutcast HTML5 audio player
  - **Typography Overhaul**: Implemented title case (Capital Letter At Start Of Every Word) across all pages
  - **Font Consistency**: Applied modern font-black weight for all main headings throughout the site
- **December 2024**: Successfully migrated from Bolt to Replit
  - Installed missing dependencies (react-router-dom, crypto-js)
  - Migrated from Supabase to Neon PostgreSQL database
  - Created proper database schema with users and Patreon tokens tables
  - Moved Supabase Edge Functions to server-side API routes (/api/patreon-oauth, /api/patreon-refresh)
  - Updated client-side services to use new server endpoints
  - Configured Patreon API credentials directly in client code for Replit compatibility
  - Removed Supabase dependencies and code
  - Migration completed successfully with all functionality operational

## Technical Stack
- React 18 with TypeScript
- Express.js server with TypeScript
- Neon PostgreSQL database
- Drizzle ORM for database operations
- Vite for development and building
- Tailwind CSS for styling
- Lucide React for icons

## Environment Setup
The project uses environment variables for configuration:
- `VITE_PATREON_CLIENT_ID`: Patreon OAuth client ID (frontend)
- `VITE_PATREON_CLIENT_SECRET`: Patreon OAuth client secret (frontend)
- `VITE_PATREON_REDIRECT_URI`: OAuth redirect URI
- `PATREON_CLIENT_ID`: Server-side Patreon client ID
- `PATREON_CLIENT_SECRET`: Server-side Patreon client secret
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)

## Key Features
- **Streaming Channels**: DHR1 (Premium), DHR2 (Exclusive DJ sets)
- **Track Identification**: AI-powered track recognition
- **VIP Access**: 1TB+ exclusive content library
- **Community Forum**: User discussions and music news
- **Merchandise Shop**: DHR branded products
- **Admin Panel**: User and subscriber management
- **Patreon Integration**: Subscription tier management

## Database Schema
- `users`: User accounts with subscription tiers and preferences
- `patreon_tokens`: OAuth tokens for Patreon integration

## User Preferences
- Follow security best practices with proper client/server separation
- Use environment variables for all sensitive configuration
- Maintain clean, readable TypeScript code
- Keep database operations server-side for security
- Never use fake/mock/placeholder data - only real authenticated data from Patreon API
- Implement proper subscription expiration checking - deny access when subscriptions expire
- Track identification feature requires active subscription (DHR1 or higher)
- **Design Consistency**: Apply title case (Capital Letter At Start Of Every Word) for all text content
- **Typography**: Use font-black weight for main headings to maintain modern, bold appearance
- **Simplicity Preference**: Keep implementations simple, use copy-paste approaches when they work effectively

## Migration Status
✅ **Completed Successfully**: 
- Database migration to PostgreSQL
- Server-side API routes functional
- Patreon OAuth integration configured
- Client-server separation implemented
- All dependencies resolved
- Environment variables properly loaded with dotenv

The application is now fully operational on Replit. The Patreon OAuth server endpoints are working correctly.

## Current Status - June 24, 2025
✅ **Patreon Integration Fully Working**
- Campaign 421011 successfully detected with 1123 total patrons
- OAuth authentication completed and tokens stored in database
- Full pagination support for all 1123+ Patreon members implemented
- Server-side API endpoints handling CORS and authentication properly

✅ **Admin Dashboard Enhanced**
- Comprehensive user table with expiration dates and subscription details
- Enhanced search and filtering capabilities
- Improved export functionality with full subscriber data
- Better visual organization and navigation
- Real-time expiration warnings and status tracking

## Recent Issues Fixed
- **June 24, 2025**: Fixed CORS issues by implementing server-side Patreon API endpoints
- **June 24, 2025**: Resolved Patreon API v2 compatibility issues with invalid field parameters  
- **June 24, 2025**: Enhanced admin dashboard with detailed subscription management
- **June 24, 2025**: Implemented full pagination support for all 1123+ Patreon members
- **June 24, 2025**: Added comprehensive subscriber details including expiration tracking
- Database connection issues resolved with proper WebSocket configuration for Neon
- Server-side token storage and retrieval working properly

## Enhanced Features
- Full Patreon subscriber sync with pagination (processes all 1123+ patrons)
- Buy Me a Coffee supporter integration with same tier system
- Detailed subscription management with 4-tier system:
  - Free (€0) - Landing page and free stream access only
  - DHR1 (€3+) - Access to DHR1 channel + track identification
  - DHR2 (€5+) - Access to DHR1 + DHR2 channels + track identification
  - VIP (€10+) - Full access to all content including VIP section + track identification
- Automatic subscription expiration handling - access revoked when subscription expires
- Multi-platform subscriber support (Patreon + Buy Me a Coffee)
- Comprehensive subscriber table with lifetime value, next charge dates, and status tracking
- Real-time notifications for subscriber changes and sync results
- Advanced filtering and search capabilities for subscriber management
- Export functionality for subscriber data
- API endpoints for main website premium access control integration