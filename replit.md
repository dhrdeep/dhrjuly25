# DHR - Deep House Radio Platform

## Overview

DHR (Deep House Radio) is a full-stack web application for streaming deep house music with tiered subscription services. The platform features live radio streams, audio track identification, community forums, user management, and Patreon integration for subscription management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: React Router for client-side navigation
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and context (React Query for server state)
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: In-memory storage (development) with plans for PostgreSQL sessions

### Project Structure
- `/client/` - React frontend application
- `/server/` - Express.js backend API
- `/shared/` - Shared TypeScript schemas and types
- `/supabase/functions/` - Serverless functions for Patreon OAuth

## Key Components

### Authentication & User Management
- User registration and login system
- Demo mode for testing different subscription tiers
- Patreon OAuth integration for subscription management
- Role-based access control (Free, Premium, VIP)

### Audio Services
- Live streaming media player with volume controls
- Audio track identification using ACRCloud and Shazam APIs
- Support for multiple audio recognition services
- Real-time track history and identification logging

### Subscription System
- Three-tier subscription model (Free, Premium, VIP)
- Patreon integration for subscription management
- Feature gating based on subscription levels
- Download quotas and access controls

### Content Management
- DHR1 and DHR2 premium radio channels
- VIP section with exclusive content
- Forum system for community discussions
- User-generated content uploads

### Social Features
- Live chat room functionality
- AI chatbot for user assistance
- Social media sharing integration
- Community forum with categories

## Data Flow

### User Authentication Flow
1. User attempts to access protected content
2. Authentication modal prompts for login or demo access
3. Credentials validated against user database
4. User session established with subscription tier
5. Feature access determined by subscription level

### Audio Recognition Flow
1. Audio stream captured from live radio
2. Audio data processed and sent to recognition APIs
3. Track metadata retrieved and deduplicated
4. Results stored in track history
5. Real-time updates displayed to users

### Subscription Management Flow
1. Users authenticate via Patreon OAuth
2. Patreon API returns user subscription data
3. Local user database updated with subscription info
4. Feature access recalculated based on subscription tier
5. Admin dashboard provides subscription analytics

## External Dependencies

### Audio Recognition Services
- **ACRCloud**: Primary audio fingerprinting service
- **Shazam**: Secondary recognition service via RapidAPI
- **CryptoJS**: For generating ACRCloud API signatures

### Subscription & Payment Integration
- **Patreon API**: OAuth and subscription management
- **Buy Me a Coffee**: Alternative supporter platform integration
- **Wix**: Additional subscription management option

### UI & Development
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library
- **Date-fns**: Date manipulation utilities

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Development Server**: Vite dev server with HMR
- **Port Configuration**: Internal port 5000, external port 80

### Production Build
- **Frontend**: Vite production build to `dist/public`
- **Backend**: esbuild compilation to `dist/index.js`
- **Deployment**: Autoscale deployment target
- **Database Migrations**: Drizzle Kit for schema management

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Patreon OAuth credentials via environment variables
- Audio recognition API keys configured in environment
- Development-specific features gated by `NODE_ENV`

## Changelog

Changelog:
- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.