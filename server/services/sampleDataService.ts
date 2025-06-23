import { storage } from "../storage";
import { InsertAircraft } from "@shared/schema";
import { boundaryService } from "./boundaryService";

// Service to generate and manage sample aircraft data
export class SampleDataService {
  private artccCoordinates: Record<string, { center: [number, number], radius: number }> = {
    ZKC: { center: [-96.0, 38.5], radius: 5.0 }, // Kansas City
    ZDV: { center: [-106.5, 38.5], radius: 5.0 }, // Denver
    ZOA: { center: [-122.0, 40.0], radius: 5.0 }, // Oakland
    ZNY: { center: [-74.0, 41.5], radius: 4.0 }, // New York
    ZMA: { center: [-81.5, 27.5], radius: 4.0 }, // Miami
  };

  // Generate random aircraft within a specific ARTCC area
  private generateRandomAircraftForARTCC(artccId: string): InsertAircraft {
    const artccInfo = this.artccCoordinates[artccId] || this.artccCoordinates.ZKC;
    
    // Random position within the ARTCC area
    const radius = artccInfo.radius * Math.sqrt(Math.random()); // Ensure even distribution
    const angle = Math.random() * 2 * Math.PI;
    const longitude = artccInfo.center[0] + radius * Math.cos(angle);
    const latitude = artccInfo.center[1] + radius * Math.sin(angle);
    
    // Random heading - tends to be along common routes in the region
    const heading = Math.floor(Math.random() * 360);
    
    // Generate a random altitude between 5,000 and 45,000 feet, typically in 1,000 foot increments
    const altitude = Math.floor(Math.random() * 40) * 1000 + 5000;
    
    // Generate a random speed between 150 and 550 knots
    const speed = Math.floor(Math.random() * 400) + 150;
    
    // Common US airlines
    const airlines = ['AAL', 'UAL', 'DAL', 'SWA', 'FDX', 'UPS', 'SKW', 'JBU', 'ASA'];
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    
    // Random flight number between 1 and 9999
    const flightNumber = Math.floor(Math.random() * 9999) + 1;
    const callsign = `${airline}${flightNumber}`;
    
    // Common aircraft types
    const aircraftTypes = ['B737', 'B738', 'B739', 'B752', 'B763', 'B788', 'A319', 'A320', 'A321', 'CRJ2', 'CRJ7', 'CRJ9', 'E170', 'E175'];
    const aircraftType = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
    
    // US airport codes for origin/destination
    const airports = ['ATL', 'ORD', 'DFW', 'DEN', 'LAX', 'JFK', 'LGA', 'SFO', 'SEA', 'MIA', 'MCO', 'LAS', 'BOS', 'CLT', 'PHX'];
    const origin = airports[Math.floor(Math.random() * airports.length)];
    
    // Ensure destination is different from origin
    let destination;
    do {
      destination = airports[Math.floor(Math.random() * airports.length)];
    } while (destination === origin);
    
    // Squawk codes are typically 4 digits between 0000 and 7777
    const squawk = (1000 + Math.floor(Math.random() * 6777)).toString();
    
    // Implement verification based on specific rules
    // For this dataset, we'll ensure proper verification rules are followed:
    // - An aircraft must have 2 different sources to be verified
    // - If it only has 1 source, it is unverified
    // - Partial verification is being eliminated
    const verificationSources: ('ADS-B' | 'radar' | 'GPS' | 'ground-radar' | 'GNSS')[] = [];
    
    // ADS-B source - most common
    if (Math.random() > 0.2) {
      verificationSources.push('ADS-B');
    }
    
    // Add radar source with high probability
    if (Math.random() > 0.3) {
      verificationSources.push('radar');
    }
    
    // Add GPS with medium probability
    if (Math.random() > 0.5) {
      verificationSources.push('GPS');
    }
    
    // Add ground radar with low probability
    if (Math.random() > 0.7) {
      verificationSources.push('ground-radar');
    }
    
    // Add GNSS with very low probability
    if (Math.random() > 0.8) {
      verificationSources.push('GNSS');
    }
    
    // Ensure at least one source for every aircraft
    if (verificationSources.length === 0) {
      verificationSources.push('ADS-B');
    }
    
    // Determine verification status - must have at least 2 sources to be verified
    let verificationStatus: 'verified' | 'unverified';
    if (verificationSources.length >= 2) {
      verificationStatus = 'verified';
    } else {
      verificationStatus = 'unverified';
    }
    
    // Random flight plan - mostly IFR
    const flightPlan = Math.random() > 0.2 ? 'IFR' : 'VFR';
    
    // Random needs assistance flag - rare
    const needsAssistance = Math.random() > 0.95;
    
    return {
      callsign,
      aircraftType,
      altitude,
      heading,
      speed,
      latitude,
      longitude,
      origin,
      destination,
      squawk,
      verificationStatus,
      verifiedSources: verificationSources,
      needsAssistance,
    };
  }

  // Generate sample aircraft for multiple ARTCC regions
  async generateSampleData(artccRegions: string[]): Promise<number> {
    try {
      // Clear existing aircraft first
      const existingAircraft = await storage.getAllAircraft();
      await Promise.all(existingAircraft.map(a => storage.deleteAircraft(a.id)));
      
      // Generate aircraft for each ARTCC region
      let totalCount = 0;
      for (const artcc of artccRegions) {
        // Generate 10-15 aircraft per ARTCC
        const aircraftCount = Math.floor(Math.random() * 6) + 10;
        const aircraftToCreate = [];
        
        for (let i = 0; i < aircraftCount; i++) {
          aircraftToCreate.push(this.generateRandomAircraftForARTCC(artcc));
        }
        
        // Create the aircraft in the database
        await Promise.all(aircraftToCreate.map(a => storage.createAircraft(a)));
        totalCount += aircraftCount;
      }
      
      return totalCount;
    } catch (error) {
      console.error('Error generating sample data:', error);
      throw error;
    }
  }

  /**
   * Return an array of 10 random sample aircraft for the ZKC ARTCC region (for fallback use)
   */
  async getSampleAircraft(): Promise<InsertAircraft[]> {
    const aircraft: InsertAircraft[] = [];
    for (let i = 0; i < 10; i++) {
      aircraft.push(this.generateRandomAircraftForARTCC('ZKC'));
    }
    return aircraft;
  }
}

export const sampleDataService = new SampleDataService();