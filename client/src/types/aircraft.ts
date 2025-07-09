// Types for aircraft data

export type VerificationStatus = 'unverified' | 'partially_verified' | 'verified';
export type VerificationSource = 'ADS-B' | 'radar' | 'GPS' | 'ground-radar' | 'GNSS';

export interface Aircraft {
  id: number;
  callsign: string;
  aircraftType: string;
  altitude: number; // in feet
  heading: number; // in degrees
  speed: number; // in knots
  latitude: number;
  longitude: number;
  origin?: string | null;
  destination?: string | null;
  squawk?: string;
  verificationStatus: VerificationStatus;
  verifiedSources: VerificationSource[];
  controllerSectorId?: number;
  needsAssistance: boolean;
}

export interface AircraftFilters {
  verificationStatus?: VerificationStatus | 'all';
  needsAssistance?: boolean;
  searchTerm?: string;
  type?: string;
  showFilters?: boolean;
  sortBy?: 'proximity' | 'altitude' | 'destination' | 'origin' | 'latitude' | 'longitude';
  sortOrder?: 'asc' | 'desc';
  lat?: number;
  lon?: number;
}

export interface DataSource {
  id: number;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastUpdated: Date;
}

export interface Notification {
  id: number;
  type: 'collision' | 'handoff' | 'airspace' | 'assistance' | 'system';
  title: string;
  message: string;
  aircraftIds: number[];
  sectorId?: number;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface NotificationFilters {
  type?: string | 'all';
  status?: 'pending' | 'resolved' | 'all';
  priority?: 'high' | 'normal' | 'low' | 'all';
}

export interface Restriction {
  id: number;
  name: string;
  type: string;
  boundaries: any; // GeoJSON
  altitude: { min: number; max: number };
  startTime?: Date;
  endTime?: Date;
  active: boolean;
}

export interface Sector {
  id: number;
  name: string;
  boundaries: any; // GeoJSON
  userId?: number;
}

export interface CollisionAlert {
  aircraftIds: number[];
  timeToCollision: number;
  severity: 'high' | 'medium' | 'low';
}

export interface AirspaceAlert {
  aircraftId: number;
  restrictionId: number;
  restrictionType: string;
}

export interface NOTAM {
  id: number;
  title: string;
  message: string;
  location: string; // ARTCC code or airport code
  type: 'airport' | 'airspace' | 'navigation' | 'procedure' | 'other';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  severity: 'high' | 'medium' | 'low';
  affectedAltitude?: {
    min: number;
    max: number;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
    radius?: number; // in nautical miles
  };
}

export interface MapSettings {
  showGrid: boolean;
  showRestrictions: boolean;
  showSectors: boolean;
  showVerifiedOnly: boolean;
  showLabels: boolean;
  showFlightPaths: boolean;
  showNOTAMs: boolean;
}
