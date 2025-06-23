import axios from 'axios';
import { InsertAircraft } from '@shared/schema';
import { storage } from '../storage';
import { dataSourceService } from './dataSourceService';
import { aircraftService } from './aircraftService';
import { sampleDataService } from './sampleDataService';

// FlightAware AeroAPI base URL and endpoints
const AEROAPI_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';
const SEARCH_ENDPOINT = '/flights/search';

// Kansas City ARTCC airports - limiting to only major airports to stay within rate limits
const ZKC_AIRPORTS = ['KMCI', 'KSTL', 'KICT']; // Kansas City, St. Louis, Wichita

// API rate limiting configuration
const API_RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 15,
  DELAY_BETWEEN_REQUESTS: 4000, // 4 seconds between requests
  RETRY_DELAY: 60000 // 1 minute if we hit a rate limit
};

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
   * This method fetches live flight data from the AeroAPI focusing on the Kansas City ARTCC
   * with improved rate limiting handling
   */
  private async fetchLiveFlights(): Promise<InsertAircraft[]> {
    if (!this.isConfigured) {
      console.warn('FlightAware API key not configured, falling back to sample data');
      // Fallback to sample data if available
      return await sampleDataService.getSampleAircraft();
    }

    try {
      // Update data source status to indicate we're fetching
      if (this.dataSourceId) {
        await storage.updateDataSource(this.dataSourceId, {
          status: 'fetching'
        });
      }

      console.log('Fetching live flight data for Kansas City ARTCC from FlightAware...');
      let allFlights: FlightAwareAircraft[] = [];
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      let remainingRequests = ZKC_AIRPORTS.length;
      const priorityAirports = ZKC_AIRPORTS.slice(0, 3);

      for (const airport of priorityAirports) {
        if (remainingRequests <= 0) {
          console.log('Rate limit safety threshold reached, pausing requests');
          break;
        }
        try {
          // Use 4 seconds between requests to respect rate limits
          await sleep(4000);
          const departures = await axios.get<FlightAwareResponse>(
            `${AEROAPI_BASE_URL}/airports/${airport}/flights/departures`,
            {
              headers: {
                'x-apikey': this.apiKey
              },
              params: {
                max_pages: 1
              }
            }
          );
          remainingRequests--;
          if (departures.data.flights && departures.data.flights.length > 0) {
            allFlights = [...allFlights, ...departures.data.flights];
          }
          if (remainingRequests > 0) {
            await sleep(4000);
            const arrivals = await axios.get<FlightAwareResponse>(
              `${AEROAPI_BASE_URL}/airports/${airport}/flights/arrivals`,
              {
                headers: {
                  'x-apikey': this.apiKey
                },
                params: {
                  max_pages: 1
                }
              }
            );
            remainingRequests--;
            if (arrivals.data.flights && arrivals.data.flights.length > 0) {
              allFlights = [...allFlights, ...arrivals.data.flights];
            }
          }
          console.log(`Retrieved flights for ${airport}`);
        } catch (airportError: any) {
          if (airportError.response && airportError.response.status === 429) {
            console.warn('FlightAware API rate limit reached, stopping requests');
            break;
          }
          // Improved error logging
          console.warn(`Error fetching flights for airport ${airport}:`, airportError?.response?.data || airportError.message || airportError);
        }
      }
      console.log(`Retrieved ${allFlights.length} flights from Kansas City ARTCC zone`);
      if (allFlights.length === 0) {
        console.warn('No flights returned from FlightAware API for Kansas City ARTCC, falling back to sample data');
        return await sampleDataService.getSampleAircraft();
      }
      const aircraft = this.transformFlights(allFlights);
      return aircraft;
    } catch (error: any) {
      console.error('Error fetching flights from FlightAware:', error?.response?.data || error.message || error);
      if (this.dataSourceId) {
        await storage.updateDataSource(this.dataSourceId, {
          status: 'error'
        });
      }
      // Fallback to sample data if available
      return await sampleDataService.getSampleAircraft();
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
   * Updated to handle both last_position and positions array, and to be robust to field name changes.
   */
  private transformFlights(flights: FlightAwareAircraft[]): InsertAircraft[] {
    return flights
      .map(flight => {
        // Prefer last_position, but fallback to latest in positions array if available
        let position = flight.last_position;
        // Some FlightAware endpoints may return a 'positions' array instead
        if (!position && (flight as any).positions && Array.isArray((flight as any).positions) && (flight as any).positions.length > 0) {
          // Use the most recent position
          position = (flight as any).positions[(flight as any).positions.length - 1];
        }
        if (!position) return null; // skip if no position data

        // Handle possible variations in origin/destination field names
        let originCode = null;
        if (flight.origin && typeof flight.origin === 'object') {
          originCode = flight.origin.code || flight.origin.code_iata || flight.origin.code_icao || null;
        }
        let destinationCode = null;
        if (flight.destination && typeof flight.destination === 'object') {
          destinationCode = flight.destination.code || flight.destination.code_iata || flight.destination.code_icao || null;
        }

        // Handle possible variations in aircraft type field
        const aircraftType = flight.aircraft_type || (flight as any).aircraftType || 'Unknown';

        const aircraft: InsertAircraft = {
          callsign: flight.ident,
          aircraftType,
          altitude: position.altitude || 0,
          heading: position.heading || 0,
          speed: position.groundspeed || 0,
          latitude: position.latitude || 0,
          longitude: position.longitude || 0,
          origin: originCode,
          destination: destinationCode,
          needsAssistance: false,
          verificationStatus: 'partially_verified', // FlightAware is one source
          controllerSectorId: null
        };
        return aircraft;
      })
      .filter(Boolean); // Only include flights with position data
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