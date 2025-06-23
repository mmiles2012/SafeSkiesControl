# Air Traffic Control System

## Overview

This is a modern air traffic control (ATC) dashboard application built with React and Node.js. The system provides real-time visualization of aircraft positions, ARTCC (Air Route Traffic Control Center) boundaries, NOTAMs (Notice to Airmen), and notifications for air traffic controllers. The application features both sample data generation and live data integration capabilities through FlightAware API.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS
- **State Management**: TanStack Query for server state, React hooks for local state
- **Mapping**: Mapbox GL JS for interactive maps and geographic visualization
- **Styling**: Tailwind CSS with custom design system and dark/light theme support
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket server for live data updates
- **API Design**: RESTful endpoints with comprehensive error handling and validation

### Database Design
- **Users Table**: Controller authentication and role management
- **Aircraft Table**: Real-time aircraft position and status tracking
- **Sectors Table**: ARTCC sector boundaries and controller assignments
- **Restrictions Table**: Airspace restrictions and temporary flight restrictions
- **Notifications Table**: System alerts and controller notifications
- **Data Sources Table**: External data source status monitoring

## Key Components

### Data Management
- **Aircraft Service**: Handles aircraft tracking, verification, and position updates
- **Boundary Service**: Manages ARTCC boundary data and geographic calculations
- **ML Service**: Provides data correlation and verification from multiple sources
- **FlightAware Service**: Integrates with live ADS-B data through FlightAware API
- **Sample Data Service**: Generates realistic aircraft scenarios for testing

### Real-time Features
- **WebSocket Service**: Delivers live aircraft updates, collision alerts, and system notifications
- **Collision Detection**: ML-based algorithms for conflict prediction and resolution
- **Data Verification**: Multi-source verification (ADS-B, radar, GPS) with confidence scoring

### User Interface
- **Dashboard**: Unified view with aircraft list, map visualization, and notification panels
- **Map Controls**: Interactive ARTCC boundary visualization with Kansas City focus
- **Filter System**: Advanced filtering by verification status, aircraft type, and assistance needs
- **Theme Support**: Complete dark/light mode implementation

## Data Flow

1. **Data Ingestion**: Aircraft data flows from FlightAware API or sample data generators
2. **Verification**: ML service correlates data across multiple sources (ADS-B, radar, GPS)
3. **Storage**: Verified data stored in PostgreSQL with real-time updates via Drizzle ORM
4. **Distribution**: WebSocket service broadcasts updates to connected clients
5. **Visualization**: React frontend renders aircraft positions on Mapbox with real-time updates
6. **Interaction**: Controllers can flag aircraft, resolve notifications, and manage sectors

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL connection with Neon serverless architecture
- **mapbox-gl**: Interactive mapping and geographic visualization
- **drizzle-orm**: Type-safe database operations and schema management
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui**: Accessible UI component primitives

### Development Tools
- **Vite**: Fast build tool with TypeScript support
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first styling framework
- **ESBuild**: Fast JavaScript bundling for production

### External APIs
- **FlightAware AeroAPI**: Live aircraft tracking and ADS-B data
- **Mapbox API**: Map tiles, geocoding, and geographic services

## Deployment Strategy

### Development Environment
- **Replit Integration**: Full development environment with live reloading
- **PostgreSQL**: Database automatically provisioned through Replit
- **Environment Variables**: Secure API key management for Mapbox and FlightAware

### Production Deployment
- **Build Process**: Vite builds optimized frontend bundle, ESBuild handles backend
- **Server Configuration**: Express serves both API and static files
- **Database Migration**: Drizzle handles schema migrations and updates
- **Asset Management**: Mapbox GL CSS and fonts served efficiently

### Monitoring and Performance
- **WebSocket Health**: Connection monitoring with automatic reconnection
- **API Rate Limiting**: FlightAware API usage tracking and throttling
- **Error Handling**: Comprehensive error boundaries and logging
- **Caching Strategy**: TanStack Query provides intelligent data caching

## Changelog

```
Changelog:
- June 23, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```