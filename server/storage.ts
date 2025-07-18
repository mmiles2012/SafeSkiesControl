import {
  User, InsertUser, users, 
  Aircraft, InsertAircraft, aircraft,
  Sector, InsertSector, sectors,
  Restriction, InsertRestriction, restrictions,
  Notification, InsertNotification, notifications,
  DataSource, InsertDataSource, dataSources
} from "@shared/schema";

// Storage interface for all entities
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Aircraft methods
  getAllAircraft(): Promise<Aircraft[]>;
  getAircraft(id: number): Promise<Aircraft | undefined>;
  getAircraftByCallsign(callsign: string): Promise<Aircraft | undefined>;
  getAircraftInSector(sectorId: number): Promise<Aircraft[]>;
  createAircraft(aircraft: InsertAircraft): Promise<Aircraft>;
  updateAircraft(id: number, aircraft: Partial<InsertAircraft>): Promise<Aircraft | undefined>;
  deleteAircraft(id: number): Promise<boolean>;
  getFilteredAircraft(filters: AircraftFilterOptions): Promise<Aircraft[]>;
  
  // Sector methods
  getAllSectors(): Promise<Sector[]>;
  getSector(id: number): Promise<Sector | undefined>;
  getSectorByName(name: string): Promise<Sector | undefined>;
  createSector(sector: InsertSector): Promise<Sector>;
  updateSector(id: number, sector: Partial<InsertSector>): Promise<Sector | undefined>;
  deleteSector(id: number): Promise<boolean>;
  
  // Restriction methods
  getAllRestrictions(): Promise<Restriction[]>;
  getRestriction(id: number): Promise<Restriction | undefined>;
  getActiveRestrictions(): Promise<Restriction[]>;
  createRestriction(restriction: InsertRestriction): Promise<Restriction>;
  updateRestriction(id: number, restriction: Partial<InsertRestriction>): Promise<Restriction | undefined>;
  deleteRestriction(id: number): Promise<boolean>;
  
  // Notification methods
  getAllNotifications(): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsBySector(sectorId: number): Promise<Notification[]>;
  getPendingNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<InsertNotification>): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;
  
  // DataSource methods
  getAllDataSources(): Promise<DataSource[]>;
  getDataSource(id: number): Promise<DataSource | undefined>;
  getDataSourceByName(name: string): Promise<DataSource | undefined>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: number, dataSource: Partial<InsertDataSource>): Promise<DataSource | undefined>;
}

// Add filter/sort options type
export interface AircraftFilterOptions {
  verificationStatus?: string;
  needsAssistance?: boolean;
  searchTerm?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  lat?: number;
  lon?: number;
  atcZoneId?: string;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private aircraft: Map<number, Aircraft>;
  private sectors: Map<number, Sector>;
  private restrictions: Map<number, Restriction>;
  private notifications: Map<number, Notification>;
  private dataSources: Map<number, DataSource>;
  
  private userCurrentId: number;
  private aircraftCurrentId: number;
  private sectorCurrentId: number;
  private restrictionCurrentId: number;
  private notificationCurrentId: number;
  private dataSourceCurrentId: number;

  constructor() {
    this.users = new Map();
    this.aircraft = new Map();
    this.sectors = new Map();
    this.restrictions = new Map();
    this.notifications = new Map();
    this.dataSources = new Map();
    
    this.userCurrentId = 1;
    this.aircraftCurrentId = 1;
    this.sectorCurrentId = 1;
    this.restrictionCurrentId = 1;
    this.notificationCurrentId = 1;
    this.dataSourceCurrentId = 1;
    
    // Initialize with default data sources
    this.createDataSource({ name: "ADS-B", status: "online" });
    this.createDataSource({ name: "radar", status: "online" });
    this.createDataSource({ name: "GPS", status: "online" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      displayName: insertUser.displayName,
      role: insertUser.role ?? 'controller',
    };
    this.users.set(id, user);
    return user;
  }
  
  // Aircraft methods
  async getAllAircraft(): Promise<Aircraft[]> {
    return Array.from(this.aircraft.values());
  }
  
  async getAircraft(id: number): Promise<Aircraft | undefined> {
    return this.aircraft.get(id);
  }
  
  async getAircraftByCallsign(callsign: string): Promise<Aircraft | undefined> {
    return Array.from(this.aircraft.values()).find(
      (aircraft) => aircraft.callsign === callsign,
    );
  }
  
  async getAircraftInSector(sectorId: number): Promise<Aircraft[]> {
    return Array.from(this.aircraft.values()).filter(
      (aircraft) => aircraft.controllerSectorId === sectorId,
    );
  }
  
  async createAircraft(insertAircraft: InsertAircraft): Promise<Aircraft> {
    const id = this.aircraftCurrentId++;
    const aircraft: Aircraft = {
      id,
      callsign: insertAircraft.callsign,
      aircraftType: insertAircraft.aircraftType,
      altitude: insertAircraft.altitude,
      heading: insertAircraft.heading,
      speed: insertAircraft.speed,
      latitude: insertAircraft.latitude,
      longitude: insertAircraft.longitude,
      origin: insertAircraft.origin ?? null,
      destination: insertAircraft.destination ?? null,
      squawk: insertAircraft.squawk ?? null,
      verificationStatus: insertAircraft.verificationStatus ?? 'unverified',
      verifiedSources: insertAircraft.verifiedSources ?? [],
      controllerSectorId: insertAircraft.controllerSectorId ?? null,
      needsAssistance: insertAircraft.needsAssistance ?? false,
    };
    this.aircraft.set(id, aircraft);
    return aircraft;
  }
  
  async updateAircraft(id: number, updateData: Partial<InsertAircraft>): Promise<Aircraft | undefined> {
    const existingAircraft = this.aircraft.get(id);
    if (!existingAircraft) return undefined;
    
    const updatedAircraft: Aircraft = { ...existingAircraft, ...updateData };
    this.aircraft.set(id, updatedAircraft);
    return updatedAircraft;
  }
  
  async deleteAircraft(id: number): Promise<boolean> {
    return this.aircraft.delete(id);
  }
  
  async getFilteredAircraft(filters: AircraftFilterOptions): Promise<Aircraft[]> {
    let aircraftList = Array.from(this.aircraft.values());
    // Filtering
    if (filters.verificationStatus && filters.verificationStatus !== "all") {
      aircraftList = aircraftList.filter(ac => ac.verificationStatus === filters.verificationStatus);
    }
    if (filters.needsAssistance !== undefined) {
      aircraftList = aircraftList.filter(ac => ac.needsAssistance === filters.needsAssistance);
    }
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      aircraftList = aircraftList.filter(ac => {
        const callsignMatch = ac.callsign.toLowerCase().includes(searchLower);
        const typeMatch = ac.aircraftType.toLowerCase().includes(searchLower);
        const originMatch = ac.origin?.toLowerCase().includes(searchLower) || false;
        const destMatch = ac.destination?.toLowerCase().includes(searchLower) || false;
        return callsignMatch || typeMatch || originMatch || destMatch;
      });
    }
    if (filters.type) {
      aircraftList = aircraftList.filter(ac => ac.aircraftType === filters.type);
    }
    // Sorting (proximity/zone left to service for now)
    if (filters.sortBy && !['proximity'].includes(filters.sortBy)) {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      switch (filters.sortBy) {
        case 'altitude':
          aircraftList.sort((a, b) => order * ((a.altitude || 0) - (b.altitude || 0)));
          break;
        case 'destination':
          aircraftList.sort((a, b) => order * ((a.destination || '').localeCompare(b.destination || '')));
          break;
        case 'origin':
          aircraftList.sort((a, b) => order * ((a.origin || '').localeCompare(b.origin || '')));
          break;
        case 'latitude':
          aircraftList.sort((a, b) => order * ((a.latitude || 0) - (b.latitude || 0)));
          break;
        case 'longitude':
          aircraftList.sort((a, b) => order * ((a.longitude || 0) - (b.longitude || 0)));
          break;
        default:
          break;
      }
    }
    return aircraftList;
  }
  
  // Sector methods
  async getAllSectors(): Promise<Sector[]> {
    return Array.from(this.sectors.values());
  }
  
  async getSector(id: number): Promise<Sector | undefined> {
    return this.sectors.get(id);
  }
  
  async getSectorByName(name: string): Promise<Sector | undefined> {
    return Array.from(this.sectors.values()).find(
      (sector) => sector.name === name,
    );
  }
  
  async createSector(insertSector: InsertSector): Promise<Sector> {
    const id = this.sectorCurrentId++;
    const sector: Sector = {
      id,
      name: insertSector.name,
      boundaries: insertSector.boundaries,
      userId: insertSector.userId ?? null,
    };
    this.sectors.set(id, sector);
    return sector;
  }
  
  async updateSector(id: number, updateData: Partial<InsertSector>): Promise<Sector | undefined> {
    const existingSector = this.sectors.get(id);
    if (!existingSector) return undefined;
    
    const updatedSector: Sector = { ...existingSector, ...updateData };
    this.sectors.set(id, updatedSector);
    return updatedSector;
  }
  
  async deleteSector(id: number): Promise<boolean> {
    return this.sectors.delete(id);
  }
  
  // Restriction methods
  async getAllRestrictions(): Promise<Restriction[]> {
    return Array.from(this.restrictions.values());
  }
  
  async getRestriction(id: number): Promise<Restriction | undefined> {
    return this.restrictions.get(id);
  }
  
  async getActiveRestrictions(): Promise<Restriction[]> {
    return Array.from(this.restrictions.values()).filter(
      (restriction) => restriction.active,
    );
  }
  
  async createRestriction(insertRestriction: InsertRestriction): Promise<Restriction> {
    const id = this.restrictionCurrentId++;
    const restriction: Restriction = {
      id,
      name: insertRestriction.name,
      type: insertRestriction.type,
      boundaries: insertRestriction.boundaries,
      altitude: insertRestriction.altitude,
      startTime: insertRestriction.startTime ?? null,
      endTime: insertRestriction.endTime ?? null,
      active: insertRestriction.active ?? true,
    };
    this.restrictions.set(id, restriction);
    return restriction;
  }
  
  async updateRestriction(id: number, updateData: Partial<InsertRestriction>): Promise<Restriction | undefined> {
    const existingRestriction = this.restrictions.get(id);
    if (!existingRestriction) return undefined;
    
    const updatedRestriction: Restriction = { ...existingRestriction, ...updateData };
    this.restrictions.set(id, updatedRestriction);
    return updatedRestriction;
  }
  
  async deleteRestriction(id: number): Promise<boolean> {
    return this.restrictions.delete(id);
  }
  
  // Notification methods
  async getAllNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values());
  }
  
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }
  
  async getNotificationsBySector(sectorId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.sectorId === sectorId,
    );
  }
  
  async getPendingNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.status === "pending",
    );
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationCurrentId++;
    const notification: Notification = {
      id,
      type: insertNotification.type,
      title: insertNotification.title,
      message: insertNotification.message,
      aircraftIds: insertNotification.aircraftIds ?? null,
      sectorId: insertNotification.sectorId ?? null,
      priority: insertNotification.priority ?? 'normal',
      status: insertNotification.status ?? 'pending',
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async updateNotification(id: number, updateData: Partial<InsertNotification>): Promise<Notification | undefined> {
    const existingNotification = this.notifications.get(id);
    if (!existingNotification) return undefined;
    
    const updatedNotification: Notification = { 
      ...existingNotification, 
      ...updateData,
      resolvedAt: updateData.status === "resolved" ? new Date() : existingNotification.resolvedAt
    };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }
  
  // DataSource methods
  async getAllDataSources(): Promise<DataSource[]> {
    return Array.from(this.dataSources.values());
  }
  
  async getDataSource(id: number): Promise<DataSource | undefined> {
    return this.dataSources.get(id);
  }
  
  async getDataSourceByName(name: string): Promise<DataSource | undefined> {
    return Array.from(this.dataSources.values()).find(
      (dataSource) => dataSource.name === name,
    );
  }
  
  async createDataSource(insertDataSource: InsertDataSource): Promise<DataSource> {
    const id = this.dataSourceCurrentId++;
    const dataSource: DataSource = {
      id,
      name: insertDataSource.name,
      status: insertDataSource.status ?? 'online',
      lastUpdated: new Date(),
    };
    this.dataSources.set(id, dataSource);
    return dataSource;
  }
  
  async updateDataSource(id: number, updateData: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const existingDataSource = this.dataSources.get(id);
    if (!existingDataSource) return undefined;
    
    const updatedDataSource: DataSource = { 
      ...existingDataSource, 
      ...updateData,
      lastUpdated: new Date()
    };
    this.dataSources.set(id, updatedDataSource);
    return updatedDataSource;
  }
}

// Import DatabaseStorage implementation
import { DatabaseStorage } from "./DatabaseStorage";

// Use the database implementation instead of MemStorage
export const storage = new DatabaseStorage();
