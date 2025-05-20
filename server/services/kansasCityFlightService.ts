import { InsertAircraft } from '@shared/schema';
import { boundaryService } from './boundaryService';
import { storage } from '../storage';

export class KansasCityFlightService {
  private kansasCityBoundaries: any;
  private kansasCityCenter = [-94.5786, 39.0997]; // Kansas City center coordinates
  private boundaryRadius = 1.5; // Approximate radius in degrees of the KC boundary area
  
  constructor() {
    // Get boundary data for Kansas City
    this.kansasCityBoundaries = boundaryService.getKansasCityBoundary();
  }
  
  /**
   * Generate a random point within the Kansas City ARTCC boundary
   */
  private generateRandomPointInBoundary(): [number, number] {
    // For simplicity, we'll generate a point within a radius of Kansas City
    // In a real implementation, this would check if the point is actually within the boundary polygon
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.boundaryRadius;
    
    const longitude = this.kansasCityCenter[0] + distance * Math.cos(angle);
    const latitude = this.kansasCityCenter[1] + distance * Math.sin(angle);
    
    return [longitude, latitude];
  }
  
  /**
   * Generate a random aircraft within the Kansas City ARTCC boundary
   */
  private generateRandomAircraft(): InsertAircraft {
    // Common airports in the Kansas City region
    const airports = ['MCI', 'MKC', 'STL', 'ICT', 'SGF', 'COU', 'OMA', 'DSM'];
    
    // Aircraft types commonly seen in the region
    const aircraftTypes = ['B737', 'B738', 'A320', 'CRJ2', 'E170', 'B752', 'C172', 'C208'];
    
    // Random verification status with weighted distribution (more verified)
    const verificationStatus = Math.random() < 0.7 ? 'verified' : 
                              Math.random() < 0.5 ? 'partially_verified' : 'unverified';
    
    // Random position within Kansas City ARTCC boundary
    const [longitude, latitude] = this.generateRandomPointInBoundary();
    
    // Random altitude between 15,000 and 35,000 feet
    const altitude = Math.floor(Math.random() * 20000) + 15000;
    
    // Random heading (0-359 degrees)
    const heading = Math.floor(Math.random() * 360);
    
    // Random speed (300-500 knots)
    const speed = Math.floor(Math.random() * 200) + 300;
    
    // Random call sign (airline code + number)
    const airlines = ['AAL', 'DAL', 'UAL', 'SWA', 'FDX', 'UPS', 'SKW', 'ASA'];
    const callsign = airlines[Math.floor(Math.random() * airlines.length)] + 
                    Math.floor(Math.random() * 9000 + 1000);
    
    // Departure and arrival airports
    const origin = airports[Math.floor(Math.random() * airports.length)];
    
    // Make sure destination is not the same as origin
    let destination;
    do {
      destination = airports[Math.floor(Math.random() * airports.length)];
    } while (destination === origin);
    
    // Create the aircraft object
    return {
      callsign,
      aircraftType: aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)],
      altitude,
      heading,
      speed,
      latitude,
      longitude,
      origin,
      destination,
      verificationStatus,

      lastUpdated: new Date(),
      controllerSectorId: null,
      needsAssistance: Math.random() < 0.05 // 5% chance of needing assistance
    };
  }
  
  /**
   * Generate a specified number of sample aircraft within the Kansas City ARTCC boundary
   */
  async generateSampleAircraft(count: number = 20): Promise<void> {
    // Clear existing aircraft from storage
    const existingAircraft = await storage.getAllAircraft();
    for (const aircraft of existingAircraft) {
      await storage.deleteAircraft(aircraft.id);
    }
    
    // Generate new sample aircraft
    for (let i = 0; i < count; i++) {
      const newAircraft = this.generateRandomAircraft();
      await storage.createAircraft(newAircraft);
    }
    
    console.log(`Generated ${count} sample aircraft in Kansas City ARTCC area`);
  }
}

export const kansasCityFlightService = new KansasCityFlightService();