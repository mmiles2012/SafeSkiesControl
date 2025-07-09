import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z, ZodError } from "zod";
import { insertAircraftSchema, insertNotificationSchema, insertRestrictionSchema, insertSectorSchema } from "@shared/schema";

// Import services
import { aircraftService } from "./services/aircraftService";
import { dataSourceService } from "./services/dataSourceService";
import { mlService } from "./services/mlService";
import { notificationService } from "./services/notificationService";
import { websocketService } from "./services/websocketService";
import { flightawareService } from "./services/flightawareService";
import { boundaryService } from "./services/boundaryService";
import { kansasCityFlightService } from "./services/kansasCityFlightService";
import { sampleDataService } from "./services/sampleDataService";

// Create a validation middleware function
function validateSchema(schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      next(error);
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();
  
  // Health check endpoint
  router.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // ------------------------
  // Aircraft endpoints
  // ------------------------
  
  // Get all aircraft (with optional filtering and sorting)
  router.get("/aircraft", async (req, res) => {
    try {
      // Extract query parameters for filtering and sorting
      const { verificationStatus, needsAssistance, searchTerm, type, sortBy, sortOrder, lat, lon, atcZoneId } = req.query;
      const filters = {
        verificationStatus: verificationStatus as string | undefined,
        needsAssistance: needsAssistance !== undefined ? needsAssistance === 'true' : undefined,
        searchTerm: searchTerm as string | undefined,
        type: type as string | undefined,
        sortBy: sortBy as string | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
        lat: lat !== undefined ? parseFloat(lat as string) : undefined,
        lon: lon !== undefined ? parseFloat(lon as string) : undefined,
        atcZoneId: atcZoneId as string | undefined
      };
      const aircraft = await aircraftService.getFilteredAircraft(filters);
      res.json(aircraft);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch aircraft" });
    }
  });
  
  // Get aircraft by ID
  router.get("/aircraft/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const aircraft = await aircraftService.getAircraft(id);
      
      if (!aircraft) {
        return res.status(404).json({ error: "Aircraft not found" });
      }
      
      res.json(aircraft);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch aircraft" });
    }
  });
  
  // Get aircraft by callsign
  router.get("/aircraft/callsign/:callsign", async (req, res) => {
    try {
      const callsign = req.params.callsign;
      const aircraft = await aircraftService.getAircraftByCallsign(callsign);
      
      if (!aircraft) {
        return res.status(404).json({ error: "Aircraft not found" });
      }
      
      res.json(aircraft);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch aircraft" });
    }
  });
  
  // Get aircraft in a sector
  router.get("/sectors/:id/aircraft", async (req, res) => {
    try {
      const sectorId = parseInt(req.params.id);
      const aircraft = await aircraftService.getAircraftInSector(sectorId);
      res.json(aircraft);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch aircraft in sector" });
    }
  });
  
  // Create a new aircraft
  router.post("/aircraft", validateSchema(insertAircraftSchema), async (req, res) => {
    try {
      const aircraftData = req.body;
      const aircraft = await aircraftService.createAircraft(aircraftData);
      
      // Broadcast the new aircraft to all clients
      websocketService.broadcastAircraftUpdate(aircraft);
      
      res.status(201).json(aircraft);
    } catch (error) {
      res.status(500).json({ error: "Failed to create aircraft" });
    }
  });
  
  // Update an aircraft
  router.patch("/aircraft/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const aircraft = await aircraftService.updateAircraft(id, updateData);
      
      if (!aircraft) {
        return res.status(404).json({ error: "Aircraft not found" });
      }
      
      // Broadcast the updated aircraft to all clients
      websocketService.broadcastAircraftUpdate(aircraft);
      
      res.json(aircraft);
    } catch (error) {
      res.status(500).json({ error: "Failed to update aircraft" });
    }
  });
  
  // Flag an aircraft as needing assistance
  router.post("/aircraft/:id/assistance", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { needsAssistance } = req.body;
      
      const aircraft = await aircraftService.flagForAssistance(id, needsAssistance);
      
      if (!aircraft) {
        return res.status(404).json({ error: "Aircraft not found" });
      }
      
      // If aircraft needs assistance, create a notification
      if (aircraft.needsAssistance) {
        const notification = await notificationService.createAssistanceNotification(aircraft);
        websocketService.broadcastNotification(notification);
      }
      
      // Broadcast the updated aircraft to all clients
      websocketService.broadcastAircraftUpdate(aircraft);
      
      res.json(aircraft);
    } catch (error) {
      res.status(500).json({ error: "Failed to update assistance status" });
    }
  });
  
  // Delete an aircraft
  router.delete("/aircraft/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await aircraftService.deleteAircraft(id);
      
      if (!success) {
        return res.status(404).json({ error: "Aircraft not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete aircraft" });
    }
  });
  
  // Generate sample aircraft for testing
  router.post("/aircraft/generate-sample", async (req, res) => {
    try {
      const count = req.body.count || 10;
      const aircraft = await aircraftService.generateSampleAircraft(count);
      
      // Broadcast the new aircraft to all clients
      websocketService.broadcastAircraftUpdates(aircraft);
      
      res.json(aircraft);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate sample aircraft" });
    }
  });
  
  // ------------------------
  // Notification endpoints
  // ------------------------
  
  // Get all notifications
  router.get("/notifications", async (req, res) => {
    try {
      const notifications = await notificationService.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  
  // Get pending notifications
  router.get("/notifications/pending", async (req, res) => {
    try {
      const notifications = await notificationService.getPendingNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending notifications" });
    }
  });
  
  // Get notifications for a sector
  router.get("/sectors/:id/notifications", async (req, res) => {
    try {
      const sectorId = parseInt(req.params.id);
      const notifications = await notificationService.getNotificationsBySector(sectorId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sector notifications" });
    }
  });
  
  // Create a notification
  router.post("/notifications", validateSchema(insertNotificationSchema), async (req, res) => {
    try {
      const notificationData = req.body;
      const notification = await notificationService.createNotification(notificationData);
      
      // Broadcast the new notification to all clients
      websocketService.broadcastNotification(notification);
      
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to create notification" });
    }
  });
  
  // Update a notification (e.g., mark as resolved)
  router.patch("/notifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const notification = await notificationService.updateNotification(id, updateData);
      
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  });
  
  // ------------------------
  // Data source endpoints
  // ------------------------
  
  // Get all data sources
  router.get("/data-sources", async (req, res) => {
    try {
      const dataSources = await dataSourceService.getAllDataSources();
      res.json(dataSources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data sources" });
    }
  });
  
  // Check status of all data sources
  router.get("/data-sources/check", async (req, res) => {
    try {
      const results = await dataSourceService.checkAllDataSources();
      const dataSources = await dataSourceService.getAllDataSources();
      
      // Broadcast the updated data sources to all clients
      websocketService.broadcastDataSourceUpdate(dataSources);
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to check data sources" });
    }
  });
  
  // ------------------------
  // FlightAware ADS-B data endpoints
  // ------------------------
  
  // Fetch and sync live flight data from FlightAware
  router.post("/adsb/sync", async (req, res) => {
    try {
      console.log('Attempting to sync flights from FlightAware...');
      const syncCount = await flightawareService.syncFlights();
      
      if (syncCount === 0) {
        console.log('No flights found from FlightAware, generating sample aircraft instead');
        // If FlightAware doesn't return any flights, generate sample aircraft
        const sampleAircraft = await aircraftService.generateSampleAircraft(10);
        
        // Broadcast the sample aircraft to all clients
        websocketService.broadcastAircraftUpdates(sampleAircraft);
        
        // Get updated data sources
        const dataSources = await dataSourceService.getAllDataSources();
        websocketService.broadcastDataSourceUpdate(dataSources);
        
        return res.json({
          success: true,
          message: 'Using sample flight data due to issue with live data',
          aircraftCount: sampleAircraft.length,
          usingSampleData: true
        });
      }
      
      // Get the updated aircraft list
      const aircraft = await aircraftService.getAllAircraft();
      
      // Broadcast the updated aircraft to all clients
      websocketService.broadcastAircraftUpdates(aircraft);
      
      // Get updated data sources
      const dataSources = await dataSourceService.getAllDataSources();
      websocketService.broadcastDataSourceUpdate(dataSources);
      
      res.json({ 
        success: true, 
        message: `Synced ${syncCount} flights from FlightAware ADS-B`,
        aircraftCount: aircraft.length
      });
    } catch (error) {
      console.error('Error syncing FlightAware data:', error);
      
      // On error, generate sample aircraft
      console.log('Error connecting to FlightAware API, generating sample aircraft instead');
      const sampleAircraft = await aircraftService.generateSampleAircraft(10);
      
      // Broadcast the sample aircraft to all clients
      websocketService.broadcastAircraftUpdates(sampleAircraft);
      
      res.json({
        success: true,
        message: 'Using sample flight data due to connection issue',
        aircraftCount: sampleAircraft.length,
        usingSampleData: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Fetch flight data from FlightAware for a specific region
  router.post("/adsb/fetch-region", async (req, res) => {
    try {
      const { minLat, maxLat, minLon, maxLon } = req.body;
      
      if (!minLat || !maxLat || !minLon || !maxLon) {
        return res.status(400).json({ 
          error: "Missing coordinates",
          message: "Please provide minLat, maxLat, minLon, and maxLon coordinates"
        });
      }
      
      const flights = await flightawareService.fetchFlights({
        minLat: parseFloat(minLat),
        maxLat: parseFloat(maxLat),
        minLon: parseFloat(minLon),
        maxLon: parseFloat(maxLon)
      });
      
      res.json({
        success: true,
        count: flights.length,
        flights
      });
    } catch (error) {
      console.error('Error fetching FlightAware data for region:', error);
      res.status(500).json({ 
        error: "Failed to fetch FlightAware data for region",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ------------------------
  // Sample data generation endpoint
  // ------------------------

  // Generate sample aircraft for specific ARTCC regions
  router.post("/sample-data/artcc", async (req, res) => {
    try {
      const { artccIds } = req.body;
      
      if (!artccIds || !Array.isArray(artccIds) || artccIds.length === 0) {
        return res.status(400).json({ 
          error: "Invalid ARTCC IDs", 
          message: "Please provide an array of ARTCC identifiers" 
        });
      }
      
      const count = await sampleDataService.generateSampleData(artccIds);
      
      // Get the updated aircraft list
      const aircraft = await aircraftService.getAllAircraft();
      
      // Broadcast the updated aircraft to all clients
      websocketService.broadcastAircraftUpdates(aircraft);
      
      res.json({ 
        success: true, 
        message: `Generated ${count} sample aircraft for ARTCC regions: ${artccIds.join(', ')}`,
        count 
      });
    } catch (error) {
      console.error('Error generating sample ARTCC data:', error);
      res.status(500).json({ 
        error: "Failed to generate sample data",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ------------------------
  // ML-related endpoints
  // ------------------------
  
  // Run collision detection
  router.post("/ml/detect-collisions", async (req, res) => {
    try {
      const aircraft = await aircraftService.getAllAircraft();
      const collisions = await mlService.detectPotentialCollisions(aircraft);
      
      // Create notifications for high-severity collisions
      for (const collision of collisions) {
        if (collision.collision && collision.severity === "high") {
          const aircraftIds = collision.aircraftIds || [];
          const involvedAircraft = await Promise.all(
            aircraftIds.map(id => aircraftService.getAircraft(id))
          );
          
          // Filter out undefined aircraft
          const validAircraft = involvedAircraft.filter(ac => ac !== undefined) as any;
          
          if (validAircraft.length >= 2) {
            const notification = await notificationService.createCollisionNotification(
              validAircraft,
              collision.timeToCollision || 0,
              collision.severity || "high"
            );
            
            websocketService.broadcastNotification(notification);
            websocketService.broadcastCollisionAlert(
              aircraftIds,
              collision.timeToCollision || 0,
              collision.severity || "high"
            );
          }
        }
      }
      
      res.json(collisions);
    } catch (error) {
      res.status(500).json({ error: "Failed to detect collisions" });
    }
  });
  
  // Detect airspace violations
  router.post("/ml/detect-airspace-violations", async (req, res) => {
    try {
      const aircraft = await aircraftService.getAllAircraft();
      const violations = await mlService.detectAirspaceViolations(aircraft);
      
      // Create notifications for violations
      for (const violation of violations) {
        if (violation.violation) {
          const aircraft = await aircraftService.getAircraft(violation.aircraftId);
          const restriction = await storage.getRestriction(violation.restrictionId);
          
          if (aircraft && restriction) {
            const notification = await notificationService.createAirspaceNotification(
              aircraft,
              restriction.name,
              restriction.type
            );
            
            websocketService.broadcastNotification(notification);
            websocketService.broadcastAirspaceAlert(
              violation.aircraftId,
              violation.restrictionId,
              violation.type
            );
          }
        }
      }
      
      res.json(violations);
    } catch (error) {
      res.status(500).json({ error: "Failed to detect airspace violations" });
    }
  });
  
  // ARTCC Boundary endpoints
  router.get("/boundaries", async (req, res) => {
    try {
      const facilityIds = boundaryService.getAllFacilityIds();
      res.json({ facilityIds });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facility IDs" });
    }
  });

  router.get("/boundaries/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const boundaries = boundaryService.getBoundaryData(facilityId.toUpperCase());
      const geoJSON = boundaryService.convertToGeoJSON(boundaries);
      res.json(geoJSON);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch boundary data" });
    }
  });

  router.get("/boundaries/kansas-city", async (req, res) => {
    try {
      // Define Kansas City ARTCC boundary with more precise coordinates
      // This is a more accurate representation based on FAA boundary data
      const kansasCityBoundary = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              facilityId: "ZKC",
              name: "Kansas City ARTCC",
              description: "Kansas City Air Route Traffic Control Center"
            },
            geometry: {
              type: "Polygon",
              coordinates: [[
                // More accurate Kansas City ARTCC boundary coordinates
                [-94.71, 39.30],  // Kansas City
                [-95.40, 39.78],
                [-96.20, 40.10],
                [-97.50, 40.25],
                [-98.80, 39.98],
                [-99.20, 39.10],
                [-98.80, 38.20],
                [-97.60, 37.60],
                [-96.40, 37.20],
                [-94.95, 36.90],
                [-93.50, 37.20],
                [-92.80, 37.80],
                [-92.50, 38.60],
                [-93.00, 39.50],
                [-93.80, 39.70],
                [-94.71, 39.30]   // Close the polygon
              ]]
            }
          }
        ]
      };
      
      res.json(kansasCityBoundary);
    } catch (error) {
      console.error('Error fetching Kansas City boundary:', error);
      res.status(500).json({ error: "Failed to fetch Kansas City boundary data" });
    }
  });
  
  // Generate Kansas City flights
  router.post("/kcflights/generate", async (req, res) => {
    try {
      const count = req.query.count ? parseInt(req.query.count as string) : 20;
      await kansasCityFlightService.generateSampleAircraft(count);
      res.json({ 
        success: true, 
        message: `Generated ${count} aircraft in Kansas City ARTCC area` 
      });
    } catch (error) {
      console.error("Error generating KC flights:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to generate Kansas City flights" 
      });
    }
  });

  // Register routes with the main app
  app.use("/api", router);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  websocketService.initialize(httpServer);
  
  return httpServer;
}
