import axios from 'axios';
import { InsertAircraft } from '@shared/schema';
import { storage } from '../storage';
import { dataSourceService } from './dataSourceService';

// FlightAware AeroAPI base URL and endpoint
const AEROAPI_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';
const SEARCH_ENDPOINT = '/flights/search';

interface FlightAwareAircraft {
  ident: string;
  origin?: {
    code: string;
  };
  destination?: {
    code: string;
  };
  aircraft_type?: string;
  last_position?: {
    altitude: number;
    heading: number;
    latitude: number;
    longitude: number;
    groundspeed: number;
    update_time: string;
  };
  registration?: string;
  status: string;
}

interface FlightAwareResponse {
  flights: FlightAwareAircraft[];
  links?: {
    next?: string;
  };
}

export class FlightAwareService {
  private apiKey: string;
  private isConfigured: boolean;
  private dataSourceId: number | null = null;

  constructor() {
    this.apiKey = process.env.FLIGHTAWARE_API_KEY || '';
    this.isConfigured = !!this.apiKey;
    
    // Register as a data source
    this.registerAsDataSource();
  }

  private async registerAsDataSource() {
    try {
      // Check if data source already exists
      const existingDataSource = await storage.getDataSourceByName('FlightAware ADS-B');
      
      if (existingDataSource) {
        this.dataSourceId = existingDataSource.id;
        // Update the status based on configuration
        await storage.updateDataSource(existingDataSource.id, {
          status: this.isConfigured ? 'online' : 'offline'
        });
      } else {
        // Create a new data source
        const newDataSource = await storage.createDataSource({
          name: 'FlightAware ADS-B',
          status: this.isConfigured ? 'online' : 'offline'
        });
        this.dataSourceId = newDataSource.id;
      }
    } catch (error) {
      console.error('Failed to register FlightAware as data source:', error);
    }
  }

  /**
   * Fetch aircraft data from FlightAware AeroAPI
   */
  async fetchFlights(bounds?: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  }): Promise<InsertAircraft[]> {
    if (!this.isConfigured) {
      console.warn('FlightAware API key not configured');
      return [];
    }

    try {
      // Update data source status to indicate we're fetching
      if (this.dataSourceId) {
        await storage.updateDataSource(this.dataSourceId, {
          status: 'online'
        });
      }

      // Default to continental US if no bounds provided
      const searchBounds = bounds || {
        minLat: 24.396308, // Southern border of US
        maxLat: 49.384358, // Northern border of US
        minLon: -125.0, // West coast
        maxLon: -66.93457, // East coast
      };

      // Build query parameters for bounding box
      const queryParams = new URLSearchParams({
        query: `-latrange ${searchBounds.minLat} ${searchBounds.maxLat} -lonrange ${searchBounds.minLon} ${searchBounds.maxLon}`,
        max_pages: '1'
      });

      // Make API request
      const response = await axios.get<FlightAwareResponse>(
        `${AEROAPI_BASE_URL}${SEARCH_ENDPOINT}?${queryParams.toString()}`,
        {
          headers: {
            'x-apikey': this.apiKey
          }
        }
      );

      console.log(`Retrieved ${response.data.flights.length} flights from FlightAware`);

      // Transform FlightAware format to our schema
      const aircraft = this.transformFlights(response.data.flights);

      return aircraft;
    } catch (error) {
      console.error('Error fetching flights from FlightAware:', error);
      
      // Update data source status to indicate error
      if (this.dataSourceId) {
        await storage.updateDataSource(this.dataSourceId, {
          status: 'error',
          lastUpdated: new Date()
        });
      }
      
      return [];
    }
  }

  /**
   * Transform FlightAware API response into our aircraft schema
   */
  private transformFlights(flights: FlightAwareAircraft[]): InsertAircraft[] {
    return flights
      .filter(flight => flight.last_position) // Only include flights with position data
      .map(flight => {
        // Create an aircraft object from each flight
        const aircraft: InsertAircraft = {
          callsign: flight.ident,
          aircraftType: flight.aircraft_type || 'Unknown',
          altitude: flight.last_position?.altitude || 0,
          heading: flight.last_position?.heading || 0,
          speed: flight.last_position?.groundspeed || 0,
          latitude: flight.last_position?.latitude || 0,
          longitude: flight.last_position?.longitude || 0,
          origin: flight.origin?.code || null,
          destination: flight.destination?.code || null,
          needsAssistance: false,
          verificationStatus: 'partially_verified', // FlightAware is one source
          dataSourceId: this.dataSourceId || undefined,
          controllerSectorId: null
        };

        return aircraft;
      });
  }

  /**
   * Sync flights data from FlightAware to our database
   */
  async syncFlights() {
    try {
      // Fetch flights from FlightAware
      const flights = await this.fetchFlights();
      if (flights.length === 0) return;

      // Get existing aircraft
      const existingAircraft = await storage.getAllAircraft();
      
      // Create lookup for quick checks
      const existingCallsigns = new Set(existingAircraft.map(a => a.callsign));

      // Update existing aircraft or add new ones
      for (const flight of flights) {
        if (existingCallsigns.has(flight.callsign)) {
          // Update existing aircraft
          const existing = existingAircraft.find(a => a.callsign === flight.callsign);
          if (existing) {
            await storage.updateAircraft(existing.id, {
              ...flight,
              // Preserve verification status if already verified
              verificationStatus: existing.verificationStatus === 'verified' 
                ? 'verified' 
                : 'partially_verified'
            });
          }
        } else {
          // Add new aircraft
          await storage.createAircraft(flight);
        }
      }

      console.log(`Synced ${flights.length} flights from FlightAware`);
      
      // Update data source status
      if (this.dataSourceId) {
        await storage.updateDataSource(this.dataSourceId, {
          status: 'online',
          lastUpdated: new Date()
        });
      }

      // Update ADSB status in data source service
      await dataSourceService.updateDataSourceStatus('FlightAware ADS-B', 'online');
      
      return flights.length;
    } catch (error) {
      console.error('Error syncing flights from FlightAware:', error);
      
      // Update data source status
      if (this.dataSourceId) {
        await storage.updateDataSource(this.dataSourceId, {
          status: 'error'
        });
      }
      
      return 0;
    }
  }
}

export const flightawareService = new FlightAwareService();