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
  
  /**
   * @api {get} /api/health Health check
   * @apiDescription Returns API health status.
   * @apiSuccess {Object} status Always 'ok'.
   */
  // Health check endpoint
  router.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // ------------------------
  // Aircraft endpoints
  // ------------------------
  
  /**
   * @api {get} /api/aircraft Get all aircraft (with optional filtering/sorting/pagination/fields)
   * @apiQuery {string} [verificationStatus] Filter by verification status
   * @apiQuery {boolean} [needsAssistance] Filter by assistance flag
   * @apiQuery {string} [searchTerm] Search by callsign/type/origin/destination
   * @apiQuery {string} [type] Filter by aircraft type
   * @apiQuery {string} [sortBy] Sort by field (altitude, proximity, etc.)
   * @apiQuery {string} [sortOrder] asc|desc
   * @apiQuery {number} [lat] Latitude for proximity sort
   * @apiQuery {number} [lon] Longitude for proximity sort
   * @apiQuery {string} [atcZoneId] ARTCC/zone for proximity sort
   * @apiQuery {number} [limit] Max number of results (pagination)
   * @apiQuery {number} [offset] Offset for pagination
   * @apiQuery {string} [fields] Comma-separated list of fields to include in response
   * @apiSuccess {Aircraft[]} List of aircraft
   * @apiError 500 Failed to fetch aircraft
   */
  // Get all aircraft (with optional filtering, sorting, pagination, and response shaping)
  router.get("/aircraft", async (req, res) => {
    try {
      // Extract query parameters for filtering, sorting, pagination, and fields
      const { verificationStatus, needsAssistance, searchTerm, type, sortBy, sortOrder, lat, lon, atcZoneId, limit, offset, fields } = req.query;
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
      let aircraft = await aircraftService.getFilteredAircraft(filters);
      // Pagination
      const start = offset ? parseInt(offset as string) : 0;
      const end = limit ? start + parseInt(limit as string) : undefined;
      aircraft = aircraft.slice(start, end);
      // Response shaping
      if (fields) {
        const fieldList = (fields as string).split(',').map(f => f.trim());
        aircraft = aircraft.map(ac => {
          const shaped: any = {};
          for (const field of fieldList) {
            if (ac.hasOwnProperty(field)) shaped[field] = (ac as any)[field];
          }
          return shaped;
        });
      }
      res.json(aircraft);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch aircraft" });
    }
  });
  
  /**
   * @api {get} /api/aircraft/:id Get aircraft by ID
   * @apiParam {Number} id Aircraft unique ID
   * @apiSuccess {Aircraft} Aircraft object
   * @apiError 404 Aircraft not found
   * @apiError 500 Failed to fetch aircraft
   */
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
  
  /**
   * @api {get} /api/aircraft/callsign/:callsign Get aircraft by callsign
   * @apiParam {String} callsign Aircraft callsign
   * @apiSuccess {Aircraft} Aircraft object
   * @apiError 404 Aircraft not found
   * @apiError 500 Failed to fetch aircraft
   */
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
  
  /**
   * @api {get} /api/sectors/:id/aircraft Get aircraft in a sector (with optional pagination/fields)
   * @apiParam {Number} id Sector unique ID
   * @apiQuery {number} [limit] Max number of results (pagination)
   * @apiQuery {number} [offset] Offset for pagination
   * @apiQuery {string} [fields] Comma-separated list of fields to include in response
   * @apiSuccess {Aircraft[]} List of aircraft in sector
   * @apiError 500 Failed to fetch aircraft in sector
   */
  // Get aircraft in a sector (with optional pagination and response shaping)
  router.get("/sectors/:id/aircraft", async (req, res) => {
    try {
      const sectorId = parseInt(req.params.id);
      const { limit, offset, fields } = req.query;
      let aircraft = await aircraftService.getAircraftInSector(sectorId);
      // Pagination
      const start = offset ? parseInt(offset as string) : 0;
      const end = limit ? start + parseInt(limit as string) : undefined;
      aircraft = aircraft.slice(start, end);
      // Response shaping
      if (fields) {
        const fieldList = (fields as string).split(',').map(f => f.trim());
        aircraft = aircraft.map(ac => {
          const shaped: any = {};
          for (const field of fieldList) {
            if (ac.hasOwnProperty(field)) shaped[field] = (ac as any)[field];
          }
          return shaped;
        });
      }
      res.json(aircraft);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch aircraft in sector" });
    }
  });
  
  /**
   * @api {post} /api/aircraft Create a new aircraft
   * @apiBody {Aircraft} aircraft Aircraft data (validated)
   * @apiSuccess {Aircraft} Created aircraft
   * @apiError 500 Failed to create aircraft
   */
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
  
  /**
   * @api {patch} /api/aircraft/:id Update an aircraft
   * @apiParam {Number} id Aircraft unique ID
   * @apiBody {Partial<Aircraft>} updateData Fields to update
   * @apiSuccess {Aircraft} Updated aircraft
   * @apiError 404 Aircraft not found
   * @apiError 500 Failed to update aircraft
   */
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
  
  /**
   * @api {post} /api/aircraft/:id/assistance Flag an aircraft as needing assistance
   * @apiParam {Number} id Aircraft unique ID
   * @apiBody {Boolean} needsAssistance Assistance flag
   * @apiSuccess {Aircraft} Updated aircraft
   * @apiError 404 Aircraft not found
   * @apiError 500 Failed to update assistance status
   */
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
  
  /**
   * @api {delete} /api/aircraft/:id Delete an aircraft
   * @apiParam {Number} id Aircraft unique ID
   * @apiSuccess {Boolean} success
   * @apiError 404 Aircraft not found
   * @apiError 500 Failed to delete aircraft
   */
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
  
  /**
   * @api {post} /api/aircraft/generate-sample Generate sample aircraft
   * @apiBody {Number} [count=10] Number of aircraft to generate
   * @apiSuccess {Aircraft[]} List of generated aircraft
   * @apiError 500 Failed to generate sample aircraft
   */
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

  /**
   * @api {get} /api/notifications Get all notifications (with optional pagination/fields)
   * @apiQuery {number} [limit] Max number of results (pagination)
   * @apiQuery {number} [offset] Offset for pagination
   * @apiQuery {string} [fields] Comma-separated list of fields to include in response
   * @apiSuccess {Notification[]} List of notifications
   * @apiError 500 Failed to fetch notifications
   */
  // Get all notifications (with optional pagination and response shaping)
  router.get("/notifications", async (req, res) => {
    try {
      const { limit, offset, fields } = req.query;
      let notifications = await notificationService.getAllNotifications();
      // Pagination
      const start = offset ? parseInt(offset as string) : 0;
      const end = limit ? start + parseInt(limit as string) : undefined;
      notifications = notifications.slice(start, end);
      // Response shaping
      if (fields) {
        const fieldList = (fields as string).split(',').map(f => f.trim());
        notifications = notifications.map(n => {
          const shaped: any = {};
          for (const field of fieldList) {
            if (n.hasOwnProperty(field)) shaped[field] = (n as any)[field];
          }
          return shaped;
        });
      }
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  
  /**
   * @api {get} /api/notifications/pending Get pending notifications (with optional pagination/fields)
   * @apiQuery {number} [limit] Max number of results (pagination)
   * @apiQuery {number} [offset] Offset for pagination
   * @apiQuery {string} [fields] Comma-separated list of fields to include in response
   * @apiSuccess {Notification[]} List of pending notifications
   * @apiError 500 Failed to fetch pending notifications
   */
  // Get pending notifications (with optional pagination and response shaping)
  router.get("/notifications/pending", async (req, res) => {
    try {
      const { limit, offset, fields } = req.query;
      let notifications = await notificationService.getPendingNotifications();
      // Pagination
      const start = offset ? parseInt(offset as string) : 0;
      const end = limit ? start + parseInt(limit as string) : undefined;
      notifications = notifications.slice(start, end);
      // Response shaping
      if (fields) {
        const fieldList = (fields as string).split(',').map(f => f.trim());
        notifications = notifications.map(n => {
          const shaped: any = {};
          for (const field of fieldList) {
            if (n.hasOwnProperty(field)) shaped[field] = (n as any)[field];
          }
          return shaped;
        });
      }
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending notifications" });
    }
  });
  
  /**
   * @api {get} /api/sectors/:id/notifications Get notifications for a sector (with optional pagination/fields)
   * @apiParam {Number} id Sector unique ID
   * @apiQuery {number} [limit] Max number of results (pagination)
   * @apiQuery {number} [offset] Offset for pagination
   * @apiQuery {string} [fields] Comma-separated list of fields to include in response
   * @apiSuccess {Notification[]} List of notifications for sector
   * @apiError 500 Failed to fetch sector notifications
   */
  // Get notifications for a sector (with optional pagination and response shaping)
  router.get("/sectors/:id/notifications", async (req, res) => {
    try {
      const sectorId = parseInt(req.params.id);
      const { limit, offset, fields } = req.query;
      let notifications = await notificationService.getNotificationsBySector(sectorId);
      // Pagination
      const start = offset ? parseInt(offset as string) : 0;
      const end = limit ? start + parseInt(limit as string) : undefined;
      notifications = notifications.slice(start, end);
      // Response shaping
      if (fields) {
        const fieldList = (fields as string).split(',').map(f => f.trim());
        notifications = notifications.map(n => {
          const shaped: any = {};
          for (const field of fieldList) {
            if (n.hasOwnProperty(field)) shaped[field] = (n as any)[field];
          }
          return shaped;
        });
      }
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sector notifications" });
    }
  });
  
  /**
   * @api {post} /api/notifications Create a notification
   * @apiBody {Notification} notification Notification data (validated)
   * @apiSuccess {Notification} Created notification
   * @apiError 500 Failed to create notification
   */
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
  
  /**
   * @api {patch} /api/notifications/:id Update a notification
   * @apiParam {Number} id Notification unique ID
   * @apiBody {Partial<Notification>} updateData Fields to update
   * @apiSuccess {Notification} Updated notification
   * @apiError 404 Notification not found
   * @apiError 500 Failed to update notification
   */
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

  /**
   * @api {get} /api/data-sources Get all data sources
   * @apiSuccess {DataSource[]} List of data sources
   * @apiError 500 Failed to fetch data sources
   */
  // Get all data sources
  router.get("/data-sources", async (req, res) => {
    try {
      const dataSources = await dataSourceService.getAllDataSources();
      res.json(dataSources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data sources" });
    }
  });
  
  /**
   * @api {get} /api/data-sources/check Check status of all data sources
   * @apiSuccess {Object[]} List of data source check results
   * @apiError 500 Failed to check data sources
   */
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

  /**
   * @api {post} /api/adsb/sync Sync live flight data from FlightAware
   * @apiSuccess {Object} Result of sync (success, message, aircraftCount, etc.)
   * @apiError 500 Failed to sync FlightAware data
   */
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
  
  /**
   * @api {post} /api/adsb/fetch-region Fetch FlightAware data for a region (with optional pagination/fields)
   * @apiBody {number} minLat
   * @apiBody {number} maxLat
   * @apiBody {number} minLon
   * @apiBody {number} maxLon
   * @apiQuery {number} [limit] Max number of results (pagination)
   * @apiQuery {number} [offset] Offset for pagination
   * @apiQuery {string} [fields] Comma-separated list of fields to include in response
   * @apiSuccess {Object} List of flights in region
   * @apiError 500 Failed to fetch FlightAware data for region
   */
  // Fetch flight data from FlightAware for a specific region (with optional pagination and response shaping)
  router.post("/adsb/fetch-region", async (req, res) => {
    try {
      const { minLat, maxLat, minLon, maxLon } = req.body;
      const { limit, offset, fields } = req.query;
      if (!minLat || !maxLat || !minLon || !maxLon) {
        return res.status(400).json({ 
          error: "Missing coordinates",
          message: "Please provide minLat, maxLat, minLon, and maxLon coordinates"
        });
      }
      let flights = await flightawareService.fetchFlights({
        minLat: parseFloat(minLat),
        maxLat: parseFloat(maxLat),
        minLon: parseFloat(minLon),
        maxLon: parseFloat(maxLon)
      });
      // Pagination
      const start = offset ? parseInt(offset as string) : 0;
      const end = limit ? start + parseInt(limit as string) : undefined;
      flights = flights.slice(start, end);
      // Response shaping
      if (fields) {
        const fieldList = (fields as string).split(',').map(f => f.trim());
        flights = flights.map(f => {
          const shaped: any = {};
          for (const field of fieldList) {
            if (f.hasOwnProperty(field)) shaped[field] = (f as any)[field];
          }
          return shaped;
        });
      }
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

  /**
   * @api {post} /api/sample-data/artcc Generate sample aircraft for ARTCC regions
   * @apiBody {string[]} artccIds Array of ARTCC identifiers
   * @apiSuccess {Object} Result (success, message, count)
   * @apiError 500 Failed to generate sample data
   */
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
  
  /**
   * @api {post} /api/ml/detect-collisions Run collision detection (with optional pagination/fields)
   * @apiQuery {number} [limit] Max number of results (pagination)
   * @apiQuery {number} [offset] Offset for pagination
   * @apiQuery {string} [fields] Comma-separated list of fields to include in response
   * @apiSuccess {Object[]} List of detected collisions
   * @apiError 500 Failed to detect collisions
   */
  // Run collision detection (with optional pagination and response shaping)
  router.post("/ml/detect-collisions", async (req, res) => {
    try {
      const { limit, offset, fields } = req.query;
      const aircraft = await aircraftService.getAllAircraft();
      let collisions = await mlService.detectPotentialCollisions(aircraft);
      // Pagination
      const start = offset ? parseInt(offset as string) : 0;
      const end = limit ? start + parseInt(limit as string) : undefined;
      collisions = collisions.slice(start, end);
      // Response shaping
      if (fields) {
        const fieldList = (fields as string).split(',').map(f => f.trim());
        collisions = collisions.map(c => {
          const shaped: any = {};
          for (const field of fieldList) {
            if (c.hasOwnProperty(field)) shaped[field] = (c as any)[field];
          }
          return shaped;
        });
      }
      // Create notifications for high-severity collisions
      for (const collision of collisions) {
        if (collision.collision && collision.severity === "high") {
          const aircraftIds = collision.aircraftIds || [];
          const involvedAircraft = await Promise.all(
            aircraftIds.map(id => aircraftService.getAircraft(id))
          );
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
  
  /**
   * @api {post} /api/ml/detect-airspace-violations Detect airspace violations (with optional pagination/fields)
   * @apiQuery {number} [limit] Max number of results (pagination)
   * @apiQuery {number} [offset] Offset for pagination
   * @apiQuery {string} [fields] Comma-separated list of fields to include in response
   * @apiSuccess {Object[]} List of detected violations
   * @apiError 500 Failed to detect airspace violations
   */
  // Detect airspace violations (with optional pagination and response shaping)
  router.post("/ml/detect-airspace-violations", async (req, res) => {
    try {
      const { limit, offset, fields } = req.query;
      const aircraft = await aircraftService.getAllAircraft();
      let violations = await mlService.detectAirspaceViolations(aircraft);
      // Pagination
      const start = offset ? parseInt(offset as string) : 0;
      const end = limit ? start + parseInt(limit as string) : undefined;
      violations = violations.slice(start, end);
      // Response shaping
      if (fields) {
        const fieldList = (fields as string).split(',').map(f => f.trim());
        violations = violations.map(v => {
          const shaped: any = {};
          for (const field of fieldList) {
            if (v.hasOwnProperty(field)) shaped[field] = (v as any)[field];
          }
          return shaped;
        });
      }
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
  
  // ------------------------
  // ARTCC Boundary endpoints
  // ------------------------

  /**
   * @api {get} /api/boundaries Get all ARTCC facility IDs
   * @apiSuccess {string[]} facilityIds List of ARTCC facility IDs
   * @apiError 500 Failed to fetch facility IDs
   */
  router.get("/boundaries", async (req, res) => {
    try {
      const facilityIds = boundaryService.getAllFacilityIds();
      res.json({ facilityIds });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facility IDs" });
    }
  });

  /**
   * @api {get} /api/boundaries/:facilityId Get ARTCC boundary data as GeoJSON
   * @apiParam {string} facilityId ARTCC facility ID
   * @apiSuccess {Object} GeoJSON boundary data
   * @apiError 500 Failed to fetch boundary data
   */
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

  /**
   * @api {get} /api/boundaries/kansas-city Get Kansas City ARTCC boundary (GeoJSON)
   * @apiSuccess {Object} Kansas City ARTCC boundary as GeoJSON
   * @apiError 500 Failed to fetch Kansas City boundary data
   */
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
  
  /**
   * @api {post} /api/kcflights/generate Generate sample flights in Kansas City ARTCC
   * @apiQuery {number} [count=20] Number of aircraft to generate
   * @apiSuccess {Object} Result (success, message)
   * @apiError 500 Failed to generate Kansas City flights
   */
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

  /**
   * @api {get} /api/docs OpenAPI documentation
   * @apiDescription Returns the OpenAPI YAML for this API.
   * @apiSuccess {string} OpenAPI YAML
   */
  router.get("/docs", (req, res) => {
    const fs = require("fs");
    const path = require("path");
    const openapiPath = path.join(process.cwd(), "openapi.yaml");
    if (fs.existsSync(openapiPath)) {
      res.type("text/yaml").send(fs.readFileSync(openapiPath, "utf-8"));
    } else {
      res.status(404).json({ error: "OpenAPI documentation not found" });
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
