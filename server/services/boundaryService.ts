import fs from 'fs';
import path from 'path';
import { storage } from '../storage';

interface BoundaryPoint {
  latitude: number;
  longitude: number;
}

interface BoundaryData {
  facilityId: string;
  lowerAltitude: number;
  upperAltitude: number;
  boundaries: BoundaryPoint[];
}

export class BoundaryService {
  private boundaryData: Map<string, BoundaryData[]> = new Map();
  
  constructor() {
    this.loadBoundaryData();
  }

  private loadBoundaryData() {
    try {
      // First try to use the latest file from attached_assets
      let filePath = path.join(process.cwd(), 'attached_assets', 'Ground_Level_ARTCC_Boundary_Data_2025-05-15.csv');
      
      // Fall back to the data directory if not found
      if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), 'data', 'Ground_Level_ARTCC_Boundary_Data.csv');
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`Boundary data file not found at ${filePath}`);
        return;
      }
      
      console.log(`Loading boundary data from: ${filePath}`);
      
      // Read the file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n');
      
      // Skip header
      const dataLines = lines.slice(1);
      
      // Process each line
      for (const line of dataLines) {
        if (!line.trim()) continue;
        
        const [
          facilityId, 
          lowerAltitude, 
          upperAltitude, 
          latitudeStr, 
          longitudeStr
        ] = line.split(',');
        
        if (!facilityId || !latitudeStr || !longitudeStr) continue;
        
        // Parse latitude (format: DDMMSSN where D=degrees, M=minutes, S=seconds)
        const latDegrees = parseInt(latitudeStr.substring(0, 2));
        const latMinutes = parseInt(latitudeStr.substring(2, 4));
        const latSeconds = parseInt(latitudeStr.substring(4, 6));
        const latDirection = latitudeStr.substring(6, 7);
        
        // Parse longitude (format: DDDMMSSW where D=degrees, M=minutes, S=seconds)
        const lonDegrees = parseInt(longitudeStr.substring(0, 3));
        const lonMinutes = parseInt(longitudeStr.substring(3, 5));
        const lonSeconds = parseInt(longitudeStr.substring(5, 7));
        const lonDirection = longitudeStr.substring(7, 8);
        
        // Convert to decimal degrees
        let latitude = latDegrees + (latMinutes / 60) + (latSeconds / 3600);
        if (latDirection === 'S') latitude = -latitude;
        
        let longitude = lonDegrees + (lonMinutes / 60) + (lonSeconds / 3600);
        if (lonDirection === 'W') longitude = -longitude;
        
        // Get or create boundary data for this facility
        if (!this.boundaryData.has(facilityId)) {
          this.boundaryData.set(facilityId, []);
        }
        
        // Check if we already have a boundary with this altitude range
        const facilityBoundaries = this.boundaryData.get(facilityId)!;
        let boundaryWithAltitude = facilityBoundaries.find(b => 
          b.lowerAltitude === parseInt(lowerAltitude) && 
          b.upperAltitude === parseInt(upperAltitude)
        );
        
        if (!boundaryWithAltitude) {
          boundaryWithAltitude = {
            facilityId,
            lowerAltitude: parseInt(lowerAltitude),
            upperAltitude: parseInt(upperAltitude),
            boundaries: []
          };
          facilityBoundaries.push(boundaryWithAltitude);
        }
        
        // Add the boundary point
        boundaryWithAltitude.boundaries.push({
          latitude,
          longitude
        });
      }
      
      console.log(`Loaded boundary data for ${this.boundaryData.size} facilities`);
    } catch (error) {
      console.error('Error loading boundary data:', error);
    }
  }

  // Get boundary data for a specific facility
  getBoundaryData(facilityId: string): BoundaryData[] {
    return this.boundaryData.get(facilityId) || [];
  }

  // Get all facility IDs
  getAllFacilityIds(): string[] {
    return Array.from(this.boundaryData.keys());
  }

  // Get boundary for Kansas City (ZKC)
  getKansasCityBoundary(): BoundaryData[] {
    return this.getBoundaryData('ZKC');
  }

  // Convert boundaries to GeoJSON format for map display
  convertToGeoJSON(boundaries: BoundaryData[]): any {
    const features = boundaries.map(boundary => {
      // Ensure the polygon is closed by adding the first point at the end if needed
      const coordinates = boundary.boundaries.map(point => [point.longitude, point.latitude]);
      
      // Close the polygon if needed
      if (coordinates.length > 0 && 
          (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
           coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
        coordinates.push(coordinates[0]);
      }
      
      return {
        type: 'Feature',
        properties: {
          facilityId: boundary.facilityId,
          lowerAltitude: boundary.lowerAltitude,
          upperAltitude: boundary.upperAltitude
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      };
    });
    
    return {
      type: 'FeatureCollection',
      features
    };
  }
}

export const boundaryService = new BoundaryService();