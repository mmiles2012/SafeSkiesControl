import { storage } from "../storage";
import { InsertAircraft, Aircraft } from "@shared/schema";
import { verifyAircraftData } from "./mlService";
import { boundaryService } from "./boundaryService";

// Utility function to generate a random integer (for demo data)
const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Service to handle aircraft data operations
export class AircraftService {
  // Get all aircraft
  async getAllAircraft(): Promise<Aircraft[]> {
    return await storage.getAllAircraft();
  }
  
  // Get aircraft by ID
  async getAircraft(id: number): Promise<Aircraft | undefined> {
    return await storage.getAircraft(id);
  }
  
  // Get aircraft by callsign
  async getAircraftByCallsign(callsign: string): Promise<Aircraft | undefined> {
    return await storage.getAircraftByCallsign(callsign);
  }
  
  // Get aircraft in a specific sector
  async getAircraftInSector(sectorId: number): Promise<Aircraft[]> {
    return await storage.getAircraftInSector(sectorId);
  }
  
  // Create a new aircraft
  async createAircraft(aircraft: InsertAircraft): Promise<Aircraft> {
    // Verify aircraft data from different sources
    const verificationResult = await verifyAircraftData(aircraft);
    
    // Update verification status based on ML verification
    const aircraftToCreate: InsertAircraft = {
      ...aircraft,
      verificationStatus: verificationResult.status,
      verifiedSources: verificationResult.sources
    };
    
    return await storage.createAircraft(aircraftToCreate);
  }
  
  // Update an existing aircraft
  async updateAircraft(id: number, aircraft: Partial<InsertAircraft>): Promise<Aircraft | undefined> {
    const existingAircraft = await storage.getAircraft(id);
    if (!existingAircraft) {
      return undefined;
    }
    
    // If position data is updated, re-verify the aircraft
    if (
      aircraft.latitude !== undefined || 
      aircraft.longitude !== undefined || 
      aircraft.altitude !== undefined || 
      aircraft.heading !== undefined ||
      aircraft.speed !== undefined
    ) {
      const aircraftData = { ...existingAircraft, ...aircraft };
      const verificationResult = await verifyAircraftData(aircraftData);
      
      // Update verification status
      aircraft.verificationStatus = verificationResult.status;
      aircraft.verifiedSources = verificationResult.sources;
    }
    
    return await storage.updateAircraft(id, aircraft);
  }
  
  // Flag an aircraft as needing assistance
  async flagForAssistance(id: number, needsAssistance: boolean): Promise<Aircraft | undefined> {
    return await storage.updateAircraft(id, { needsAssistance });
  }
  
  // Delete an aircraft
  async deleteAircraft(id: number): Promise<boolean> {
    return await storage.deleteAircraft(id);
  }
  
  // Generate sample aircraft data for testing
  async generateSampleAircraft(count: number = 10): Promise<Aircraft[]> {
    const aircraftTypes = ["B737", "A320", "B777", "A321", "B787", "A350", "CRJ9", "E175"];
    const airlines = ["DAL", "UAL", "AAL", "SWA", "JBU", "FDX"];
    const results: Aircraft[] = [];
    
    // Create sample aircraft
    for (let i = 0; i < count; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const flightNumber = randomInt(100, 9999);
      
      const newAircraft: InsertAircraft = {
        callsign: `${airline}${flightNumber}`,
        aircraftType: aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)],
        altitude: randomInt(10000, 40000),
        heading: randomInt(0, 359),
        speed: randomInt(300, 550),
        latitude: randomInt(30, 48) + Math.random(),
        longitude: randomInt(-125, -70) + Math.random(),
        origin: ["KSFO", "KLAX", "KDEN", "KATL", "KJFK"][Math.floor(Math.random() * 5)],
        destination: ["KBOS", "KORD", "KDFW", "KMIA", "KSEA"][Math.floor(Math.random() * 5)],
        squawk: randomInt(1000, 7777).toString().padStart(4, '0'),
        verificationStatus: ["unverified", "partially_verified", "verified"][Math.floor(Math.random() * 3)],
        verifiedSources: [],
        controllerSectorId: 1,
        needsAssistance: Math.random() < 0.05, // 5% chance of needing assistance
      };
      
      // Determine verified sources based on status
      if (newAircraft.verificationStatus === "partially_verified") {
        newAircraft.verifiedSources = [["ADS-B", "radar", "GPS"][Math.floor(Math.random() * 3)]];
      } else if (newAircraft.verificationStatus === "verified") {
        const sources = ["ADS-B", "radar", "GPS"];
        newAircraft.verifiedSources = sources.slice(0, randomInt(2, 3));
      }
      
      const aircraft = await storage.createAircraft(newAircraft);
      results.push(aircraft);
    }
    
    return results;
  }
  
  // Get aircraft with filtering and sorting
  async getFilteredAircraft(filters: {
    verificationStatus?: string;
    needsAssistance?: boolean;
    searchTerm?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    lat?: number;
    lon?: number;
    atcZoneId?: string;
  }): Promise<Aircraft[]> {
    // Delegate filtering/sorting to storage, except proximity/zone
    let aircraftList = await storage.getFilteredAircraft(filters);
    // Proximity/zone sorting (must be done in service)
    if (filters.sortBy === 'proximity') {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      if (filters.atcZoneId) {
        const boundaries = boundaryService.getBoundaryData(filters.atcZoneId);
        if (boundaries.length > 0) {
          const allPoints = boundaries.flatMap(b => b.boundaries);
          const avgLat = allPoints.reduce((sum, p) => sum + p.latitude, 0) / allPoints.length;
          const avgLon = allPoints.reduce((sum, p) => sum + p.longitude, 0) / allPoints.length;
          const dist = (ac: Aircraft) => {
            const dLat = (ac.latitude || 0) - avgLat;
            const dLon = (ac.longitude || 0) - avgLon;
            return Math.sqrt(dLat * dLat + dLon * dLon);
          };
          aircraftList.sort((a, b) => order * (dist(a) - dist(b)));
        }
      } else if (typeof filters.lat === 'number' && typeof filters.lon === 'number') {
        const dist = (ac: Aircraft) => {
          const dLat = (ac.latitude || 0) - filters.lat!;
          const dLon = (ac.longitude || 0) - filters.lon!;
          return Math.sqrt(dLat * dLat + dLon * dLon);
        };
        aircraftList.sort((a, b) => order * (dist(a) - dist(b)));
      }
    }
    return aircraftList;
  }
}

export const aircraftService = new AircraftService();
