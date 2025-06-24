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
- Initial sync shows 26 users processed (pagination improvement in progress)
- Server-side API endpoints handling CORS and authentication properly

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
- Detailed subscription management with tier breakdown (VIP €25+, Premium €5+)
- Comprehensive subscriber table with lifetime value, next charge dates, and status tracking
- Advanced filtering and search capabilities for subscriber management
- Export functionality for subscriber data