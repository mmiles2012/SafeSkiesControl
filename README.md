# SafeSkiesControl

SafeSkiesControl is a full-stack airspace management and situational awareness platform designed for air traffic controllers and aviation safety teams. It provides real-time aircraft tracking, collision detection, NOTAM (Notice to Airmen) management, and notification systems, integrating multiple data sources and advanced visualization tools.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Frontend](#frontend)
- [Backend](#backend)
- [Data Layer & Database Design](#data-layer--database-design)
- [Key Integrations](#key-integrations)
- [User Flows](#user-flows)
- [Dependencies](#dependencies)
- [API Reference](#api-reference)
- [Project Deliverables](#project-deliverables)

---

## Architecture Overview

- **Frontend:** React + TypeScript (Vite, Tailwind CSS, Mapbox GL JS)
- **Backend:** Node.js (Express), TypeScript, Drizzle ORM
- **Database:** PostgreSQL (schema managed via Drizzle)
- **Data Sources:** Real-time and sample aircraft data, NOTAMs, ARTCC boundaries, and notifications
- **Communication:** REST API, WebSocket for real-time updates

---

## Frontend

- **Location:** `client/`
- **Framework:** React (TypeScript)
- **UI:** Tailwind CSS, Radix UI Primitives, custom components (e.g., MapView, NotificationPanel, FilterDialog)
- **Mapping:** Mapbox GL JS for interactive airspace visualization
- **State Management:** React hooks, context providers (e.g., ThemeProvider, MapContext)
- **Features:**
  - Aircraft list and detail modal
  - Map controls and settings
  - ARTCC boundary overlays
  - Filter and search dialogs
  - Notification and NOTAM panels
  - Responsive design for mobile/desktop

---

## Backend

- **Location:** `server/`
- **Framework:** Express (TypeScript)
- **ORM:** Drizzle ORM (PostgreSQL)
- **API:** REST endpoints for aircraft, notifications, NOTAMs, and health checks
- **WebSocket:** Real-time updates for aircraft and notifications
- **Services:** Modular service layer for aircraft, boundaries, notifications, ML verification, and data integration

---

## Data Layer & Database Design

- **Schema Location:** `shared/schema.ts`
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **Sample Table:**
  ```ts
  export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull().default("controller"),
  });
  ```
- **Other Entities:** Aircraft, Notifications, DataSources, NOTAMs, ARTCC Boundaries, Sectors, Restrictions
- **Data Management:**
  - Drizzle migrations (`drizzle.config.ts`)
  - Data seeding and sample data support
  - Real-time updates via WebSocket

---

## Key Integrations

- **Mapbox GL JS:** Interactive map rendering and overlays
- **WebSocket:** Real-time aircraft and notification updates
- **External Data:**
  - ARTCC boundary data (CSV/GeoJSON)
  - NOTAMs (sample and live)
  - Aircraft data (sample and live, with ML verification)
- **ML Verification:** Aircraft data correlation and risk assessment

---

## User Flows

1. **Login & Authentication** (future): User logs in as controller or admin
2. **Dashboard:**
   - View map with real-time aircraft and ARTCC boundaries
   - Filter/search aircraft
   - Click aircraft for details and mitigation actions
   - View and resolve notifications (collision, airspace, info)
   - View NOTAMs for selected ARTCC
   - Adjust map settings and layers
3. **Data Mode:** Toggle between sample and live data
4. **Settings:** Manage user preferences, theme, and map display

---

## Dependencies

- **Frontend:**
  - React, React DOM, TypeScript
  - Vite (build tool)
  - Tailwind CSS, PostCSS, autoprefixer
  - Mapbox GL JS
  - Radix UI Primitives
  - React Query (TanStack Query)
- **Backend:**
  - Express
  - Drizzle ORM
  - PostgreSQL
  - @neondatabase/serverless (for serverless DB)
  - ws (WebSocket)
- **Dev Tools:**
  - tsx, esbuild, drizzle-kit

---

## API Reference

### Sample Endpoints

#### Health Check
```http
GET /api/health
```
Response:
```json
{ "status": "ok" }
```

#### Get All Aircraft
```http
GET /api/aircraft
```
Response:
```json
[
  {
    "id": 1,
    "callsign": "AAL123",
    "aircraftType": "B738",
    ...
  }
]
```

#### Get Aircraft by ID
```http
GET /api/aircraft/:id
```

#### Get Notifications
```http
GET /api/notifications
```

#### Get NOTAMs
```http
GET /api/notams
```

### WebSocket Events
- `aircraftUpdate`: Aircraft array
- `notification`: New notification
- `collisionAlert`: Collision alert details

### Data Schemas
- **Aircraft:**
  ```ts
  interface Aircraft {
    id: number;
    callsign: string;
    aircraftType: string;
    // ...other fields
  }
  ```
- **Notification:**
  ```ts
  interface Notification {
    id: number;
    type: string;
    message: string;
    priority: string;
    // ...other fields
  }
  ```
- **NOTAM:**
  ```ts
  interface NOTAM {
    id: number;
    location: string;
    message: string;
    isActive: boolean;
    // ...other fields
  }
  ```

---

## Project Deliverables

- **Source Code:** Full-stack TypeScript codebase (frontend, backend, shared types)
- **Database Schema:** Drizzle ORM schema and migrations
- **API Documentation:** REST and WebSocket API reference
- **Sample Data:** ARTCC boundaries, sample aircraft, NOTAMs
- **UI Components:** Modular, reusable React components
- **Testing & Linting:** TypeScript strict mode, sample test hooks
- **Deployment Scripts:** Vite, esbuild, drizzle-kit
- **Documentation:** This README, code comments, and inline docs

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Provision database:**
   - Set `DATABASE_URL` in environment
   - Run migrations:
     ```bash
     npm run db:push
     ```
3. **Start development server:**
   ```bash
   npm run dev
   ```
4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## Contact & Support
For questions or contributions, please open an issue or contact the project maintainers.
