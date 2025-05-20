import { InsertAircraft } from "@shared/schema";
import { storage } from "../storage";

// MLService handles data correlation and verification
export class MLService {
  // Verify aircraft data using basic ML correlation
  async verifyAircraftData(aircraftData: Partial<InsertAircraft>): Promise<{
    status: string;
    sources: string[];
    confidence: number;
  }> {
    // Get data source statuses
    const adsbSource = await storage.getDataSourceByName("ADS-B");
    const radarSource = await storage.getDataSourceByName("radar");
    const gpsSource = await storage.getDataSourceByName("GPS");
    
    // Track which sources are available
    const availableSources: string[] = [];
    if (adsbSource && adsbSource.status === "online") availableSources.push("ADS-B");
    if (radarSource && radarSource.status === "online") availableSources.push("radar");
    if (gpsSource && gpsSource.status === "online") availableSources.push("GPS");
    
    // Simulate verification by simulating data from available sources
    const verifiedSources: string[] = [];
    let confidenceScore = 0;
    
    // ADS-B data verification (primary source)
    if (availableSources.includes("ADS-B")) {
      // In a real implementation, this would compare actual ADS-B data
      // with the provided aircraft data
      const isADSBVerified = Math.random() > 0.1; // 90% success rate for simulation
      if (isADSBVerified) {
        verifiedSources.push("ADS-B");
        confidenceScore += 0.5; // ADS-B provides a high confidence level
      }
    }
    
    // Radar data verification
    if (availableSources.includes("radar")) {
      // Simulate radar verification
      // In a real implementation, this would compare ground radar data
      // with the provided position and heading
      const isRadarVerified = Math.random() > 0.2; // 80% success rate for simulation
      if (isRadarVerified) {
        verifiedSources.push("radar");
        confidenceScore += 0.3; // Radar provides a moderate confidence level
      }
    }
    
    // GPS data verification
    if (availableSources.includes("GPS")) {
      // Simulate GPS verification
      // In a real implementation, this would compare GPS broadcast data
      // with the provided position
      const isGPSVerified = Math.random() > 0.15; // 85% success rate for simulation
      if (isGPSVerified) {
        verifiedSources.push("GPS");
        confidenceScore += 0.2; // GPS provides additional confidence
      }
    }
    
    // Determine verification status based on number of verified sources
    let status = "unverified";
    if (verifiedSources.length >= 2) {
      status = "verified";
    } else if (verifiedSources.length === 1) {
      status = "partially_verified";
    }
    
    return {
      status,
      sources: verifiedSources,
      confidence: Math.min(confidenceScore, 1) // Cap at 1.0
    };
  }
  
  // Check for potential collisions between aircraft
  async detectPotentialCollisions(aircraft: InsertAircraft[]): Promise<{
    collision: boolean;
    aircraftIds?: number[];
    timeToCollision?: number; // in seconds
    severity?: string; // high, medium, low
  }[]> {
    const collisions: {
      collision: boolean;
      aircraftIds?: number[];
      timeToCollision?: number;
      severity?: string;
    }[] = [];
    
    // In a real implementation, this would use sophisticated algorithms
    // for collision detection based on trajectory, altitude, and speed
    
    // For demonstration, we'll use a simple distance-based approach
    for (let i = 0; i < aircraft.length; i++) {
      for (let j = i + 1; j < aircraft.length; j++) {
        const ac1 = aircraft[i];
        const ac2 = aircraft[j];
        
        // Skip if the aircraft don't have position data
        if (!ac1.latitude || !ac1.longitude || !ac2.latitude || !ac2.longitude) {
          continue;
        }
        
        // Calculate distance between aircraft
        const distance = this.calculateDistance(
          ac1.latitude, ac1.longitude,
          ac2.latitude, ac2.longitude
        );
        
        // Check altitude difference (in feet)
        const altitudeDiff = Math.abs((ac1.altitude || 0) - (ac2.altitude || 0));
        
        // Define collision thresholds (greatly simplified)
        // In reality, these would be much more sophisticated
        if (distance < 10 && altitudeDiff < 1000) { // 10 miles, 1000 feet
          // High severity collision risk
          collisions.push({
            collision: true,
            aircraftIds: [ac1.id!, ac2.id!],
            timeToCollision: Math.floor(distance * 60), // Rough estimate in seconds
            severity: "high"
          });
        } else if (distance < 20 && altitudeDiff < 2000) { // 20 miles, 2000 feet
          // Medium severity collision risk
          collisions.push({
            collision: true,
            aircraftIds: [ac1.id!, ac2.id!],
            timeToCollision: Math.floor(distance * 120),
            severity: "medium"
          });
        } else if (distance < 30 && altitudeDiff < 3000) { // 30 miles, 3000 feet
          // Low severity collision risk
          collisions.push({
            collision: true,
            aircraftIds: [ac1.id!, ac2.id!],
            timeToCollision: Math.floor(distance * 180),
            severity: "low"
          });
        }
      }
    }
    
    return collisions;
  }
  
  // Check for airspace restriction violations
  async detectAirspaceViolations(aircraft: InsertAircraft[]): Promise<{
    violation: boolean;
    aircraftId: number;
    restrictionId: number;
    type: string;
  }[]> {
    const violations: {
      violation: boolean;
      aircraftId: number;
      restrictionId: number;
      type: string;
    }[] = [];
    
    // Get all active restrictions
    const restrictions = await storage.getActiveRestrictions();
    
    // Check each aircraft against each restriction
    for (const ac of aircraft) {
      if (!ac.latitude || !ac.longitude || !ac.altitude || !ac.id) {
        continue;
      }
      
      for (const restriction of restrictions) {
        // Check if aircraft is within the restriction boundaries
        const inBoundaries = this.isPointInGeoJSON(
          ac.latitude, ac.longitude,
          restriction.boundaries
        );
        
        // Check if aircraft is within altitude limits
        const inAltitude = ac.altitude >= restriction.altitude.min && 
                          ac.altitude <= restriction.altitude.max;
        
        if (inBoundaries && inAltitude) {
          violations.push({
            violation: true,
            aircraftId: ac.id,
            restrictionId: restriction.id,
            type: restriction.type
          });
        }
      }
    }
    
    return violations;
  }
  
  // Helper to calculate distance between two points using haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  // Helper to check if a point is within a GeoJSON polygon or circle
  private isPointInGeoJSON(lat: number, lon: number, geoJSON: any): boolean {
    // This is a simplified implementation for demonstration
    // In a real system, this would use proper GeoJSON libraries
    
    // Check if it's a polygon
    if (geoJSON.type === "Polygon") {
      return this.isPointInPolygon(lat, lon, geoJSON.coordinates[0]);
    }
    
    // Check if it's a point with radius
    if (geoJSON.type === "Point" && geoJSON.radius) {
      return this.calculateDistance(
        lat, lon, 
        geoJSON.coordinates[1], geoJSON.coordinates[0]
      ) <= geoJSON.radius;
    }
    
    return false;
  }
  
  // Helper to check if a point is within a polygon
  private isPointInPolygon(lat: number, lon: number, polygon: number[][]): boolean {
    // Implementation of the ray casting algorithm
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat)) &&
          (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }
}

// Export verification helper for direct use
export async function verifyAircraftData(aircraft: Partial<InsertAircraft>) {
  const mlService = new MLService();
  return await mlService.verifyAircraftData(aircraft);
}

export const mlService = new MLService();
