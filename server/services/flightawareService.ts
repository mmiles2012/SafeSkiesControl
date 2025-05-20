import axios from 'axios';
import { InsertAircraft } from '@shared/schema';
import { storage } from '../storage';
import { dataSourceService } from './dataSourceService';
import { aircraftService } from './aircraftService';

// FlightAware AeroAPI base URL and endpoint
const AEROAPI_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';
const SEARCH_ENDPOINT = '/flights/search';
// Alternatively can use scheduled flights endpoint
const SCHEDULED_ENDPOINT = '/schedules/from/KATL/to/KJFK';

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
   * This method fetches live flight data from the AeroAPI
   */
  private async fetchLiveFlights(): Promise<InsertAircraft[]> {
    if (!this.isConfigured) {
      console.warn('FlightAware API key not configured');
      return [];
    }

    try {
      // Update data source status to indicate we're fetching
      if (this.dataSourceId) {
        await storage.updateDataSource(this.dataSourceId, {
          status: 'fetching'
        });
      }

      console.log('Fetching live flight data from FlightAware AeroAPI...');
      
      // Make API request to the scheduled flights endpoint which is more reliable
      const response = await axios.get<FlightAwareResponse>(
        `${AEROAPI_BASE_URL}${SCHEDULED_ENDPOINT}`,
        {
          headers: {
            'x-apikey': this.apiKey
          }
        }
      );

      console.log(`Retrieved ${response.data.flights?.length || 0} flights from FlightAware`);

      if (!response.data.flights || response.data.flights.length === 0) {
        console.warn('No flights returned from FlightAware API');
        return [];
      }

      // Transform FlightAware format to our schema
      const aircraft = this.transformFlights(response.data.flights);
      
      return aircraft;
    } catch (error) {
      console.error('Error fetching flights from FlightAware:', error);
      
      // Update data source status to indicate error
      if (this.dataSourceId) {
        await storage.updateDataSource(this.dataSourceId, {
          status: 'error'
        });
      }
      
      return [];
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
    // Try to use the live flights endpoint
    return this.fetchLiveFlights();
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
      // If no API key is configured, log a warning and return
      if (!this.isConfigured) {
        console.warn('FlightAware API key not configured.');
        
        // Update data source status
        if (this.dataSourceId) {
          await storage.updateDataSource(this.dataSourceId, {
            status: 'offline'
          });
        }
        
        return 0;
      }

      // Try to fetch flights from FlightAware
      const flights = await this.fetchFlights();
      
      if (flights.length === 0) {
        console.log('No flights received from FlightAware API.');
        
        // Update data source status to indicate degraded service
        if (this.dataSourceId) {
          await storage.updateDataSource(this.dataSourceId, {
            status: 'degraded'
          });
        }
        
        return 0;
      }

      console.log(`Successfully fetched ${flights.length} flights from FlightAware`);

      // Clear existing aircraft and add the new ones
      const existingAircraft = await storage.getAllAircraft();
      for (const aircraft of existingAircraft) {
        await storage.deleteAircraft(aircraft.id);
      }
      
      // Create new aircraft records from the flights we fetched
      for (const flight of flights) {
        await storage.createAircraft(flight);
      }

      console.log(`Synced ${flights.length} flights from FlightAware to the database`);
      
      // Update data source status to show success
      if (this.dataSourceId) {
        await storage.updateDataSource(this.dataSourceId, {
          status: 'online'
        });
      }

      // Update ADSB status in data source service
      if (this.dataSourceId) {
        await dataSourceService.updateDataSourceStatus(this.dataSourceId, 'online');
      }
      
      return flights.length;
    } catch (error) {
      console.error('Error syncing flights from FlightAware:', error);
      
      // Update data source status to indicate error
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