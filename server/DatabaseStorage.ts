import { eq, and, isNull } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  aircraft, 
  sectors, 
  restrictions, 
  notifications, 
  dataSources,
  type User, 
  type InsertUser,
  type Aircraft, 
  type InsertAircraft,
  type Sector,
  type InsertSector,
  type Restriction, 
  type InsertRestriction,
  type Notification, 
  type InsertNotification,
  type DataSource, 
  type InsertDataSource
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Aircraft methods
  async getAllAircraft(): Promise<Aircraft[]> {
    return await db.select().from(aircraft);
  }

  async getAircraft(id: number): Promise<Aircraft | undefined> {
    const [foundAircraft] = await db.select().from(aircraft).where(eq(aircraft.id, id));
    return foundAircraft;
  }

  async getAircraftByCallsign(callsign: string): Promise<Aircraft | undefined> {
    const [foundAircraft] = await db.select().from(aircraft).where(eq(aircraft.callsign, callsign));
    return foundAircraft;
  }

  async getAircraftInSector(sectorId: number): Promise<Aircraft[]> {
    return await db.select().from(aircraft).where(eq(aircraft.controllerSectorId, sectorId));
  }

  async createAircraft(newAircraft: InsertAircraft): Promise<Aircraft> {
    const [createdAircraft] = await db.insert(aircraft).values(newAircraft).returning();
    return createdAircraft;
  }

  async updateAircraft(id: number, updateData: Partial<InsertAircraft>): Promise<Aircraft | undefined> {
    const [updatedAircraft] = await db
      .update(aircraft)
      .set(updateData)
      .where(eq(aircraft.id, id))
      .returning();
    return updatedAircraft;
  }

  async deleteAircraft(id: number): Promise<boolean> {
    const result = await db.delete(aircraft).where(eq(aircraft.id, id));
    return !!result;
  }

  // Sector methods
  async getAllSectors(): Promise<Sector[]> {
    return await db.select().from(sectors);
  }

  async getSector(id: number): Promise<Sector | undefined> {
    const [foundSector] = await db.select().from(sectors).where(eq(sectors.id, id));
    return foundSector;
  }

  async getSectorByName(name: string): Promise<Sector | undefined> {
    const [foundSector] = await db.select().from(sectors).where(eq(sectors.name, name));
    return foundSector;
  }

  async createSector(newSector: InsertSector): Promise<Sector> {
    const [createdSector] = await db.insert(sectors).values(newSector).returning();
    return createdSector;
  }

  async updateSector(id: number, updateData: Partial<InsertSector>): Promise<Sector | undefined> {
    const [updatedSector] = await db
      .update(sectors)
      .set(updateData)
      .where(eq(sectors.id, id))
      .returning();
    return updatedSector;
  }

  async deleteSector(id: number): Promise<boolean> {
    const result = await db.delete(sectors).where(eq(sectors.id, id));
    return !!result;
  }

  // Restriction methods
  async getAllRestrictions(): Promise<Restriction[]> {
    return await db.select().from(restrictions);
  }

  async getRestriction(id: number): Promise<Restriction | undefined> {
    const [foundRestriction] = await db.select().from(restrictions).where(eq(restrictions.id, id));
    return foundRestriction;
  }

  async getActiveRestrictions(): Promise<Restriction[]> {
    return await db.select().from(restrictions).where(eq(restrictions.active, true));
  }

  async createRestriction(newRestriction: InsertRestriction): Promise<Restriction> {
    const [createdRestriction] = await db.insert(restrictions).values(newRestriction).returning();
    return createdRestriction;
  }

  async updateRestriction(id: number, updateData: Partial<InsertRestriction>): Promise<Restriction | undefined> {
    const [updatedRestriction] = await db
      .update(restrictions)
      .set(updateData)
      .where(eq(restrictions.id, id))
      .returning();
    return updatedRestriction;
  }

  async deleteRestriction(id: number): Promise<boolean> {
    const result = await db.delete(restrictions).where(eq(restrictions.id, id));
    return !!result;
  }

  // Notification methods
  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications);
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [foundNotification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return foundNotification;
  }

  async getNotificationsBySector(sectorId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.sectorId, sectorId));
  }

  async getPendingNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.status, "pending"));
  }

  async createNotification(newNotification: InsertNotification): Promise<Notification> {
    const [createdNotification] = await db.insert(notifications).values(newNotification).returning();
    return createdNotification;
  }

  async updateNotification(id: number, updateData: Partial<InsertNotification>): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return !!result;
  }

  // DataSource methods
  async getAllDataSources(): Promise<DataSource[]> {
    return await db.select().from(dataSources);
  }

  async getDataSource(id: number): Promise<DataSource | undefined> {
    const [foundDataSource] = await db.select().from(dataSources).where(eq(dataSources.id, id));
    return foundDataSource;
  }

  async getDataSourceByName(name: string): Promise<DataSource | undefined> {
    const [foundDataSource] = await db.select().from(dataSources).where(eq(dataSources.name, name));
    return foundDataSource;
  }

  async createDataSource(newDataSource: InsertDataSource): Promise<DataSource> {
    const [createdDataSource] = await db.insert(dataSources).values(newDataSource).returning();
    return createdDataSource;
  }

  async updateDataSource(id: number, updateData: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const [updatedDataSource] = await db
      .update(dataSources)
      .set(updateData)
      .where(eq(dataSources.id, id))
      .returning();
    return updatedDataSource;
  }
}