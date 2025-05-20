import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (for controllers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("controller"),
});

// Aircraft table
export const aircraft = pgTable("aircraft", {
  id: serial("id").primaryKey(),
  callsign: varchar("callsign", { length: 10 }).notNull().unique(),
  aircraftType: varchar("aircraft_type", { length: 10 }).notNull(),
  altitude: integer("altitude").notNull(), // in feet
  heading: integer("heading").notNull(), // in degrees
  speed: integer("speed").notNull(), // in knots
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  origin: varchar("origin", { length: 4 }),
  destination: varchar("destination", { length: 4 }),
  squawk: varchar("squawk", { length: 4 }),
  verificationStatus: text("verification_status").notNull().default("unverified"), // unverified, partially_verified, verified
  verifiedSources: text("verified_sources").array(), // ADS-B, radar, GPS
  controllerSectorId: integer("controller_sector_id"),
  needsAssistance: boolean("needs_assistance").notNull().default(false),
});

// Airspace sectors
export const sectors = pgTable("sectors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 10 }).notNull().unique(),
  boundaries: jsonb("boundaries").notNull(), // GeoJSON polygon
  userId: integer("user_id"), // Controller assigned to sector
});

// Airspace restrictions
export const restrictions = pgTable("restrictions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // temporary, permanent, etc.
  boundaries: jsonb("boundaries").notNull(), // GeoJSON polygon or point with radius
  altitude: jsonb("altitude").notNull(), // { min, max } in feet
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  active: boolean("active").notNull().default(true),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // collision, handoff, airspace, assistance, system
  title: text("title").notNull(),
  message: text("message").notNull(),
  aircraftIds: integer("aircraft_ids").array(),
  sectorId: integer("sector_id"),
  priority: text("priority").notNull().default("normal"), // high, normal, low
  status: text("status").notNull().default("pending"), // pending, resolved
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Data sources status
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // ADS-B, radar, GPS
  status: text("status").notNull().default("online"), // online, offline, degraded
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Schemas for data inserts
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  role: true,
});

export const insertAircraftSchema = createInsertSchema(aircraft).pick({
  callsign: true,
  aircraftType: true,
  altitude: true,
  heading: true,
  speed: true,
  latitude: true,
  longitude: true,
  origin: true,
  destination: true,
  squawk: true,
  verificationStatus: true,
  verifiedSources: true,
  controllerSectorId: true,
  needsAssistance: true,
});

export const insertSectorSchema = createInsertSchema(sectors).pick({
  name: true,
  boundaries: true,
  userId: true,
});

export const insertRestrictionSchema = createInsertSchema(restrictions).pick({
  name: true,
  type: true,
  boundaries: true,
  altitude: true,
  startTime: true,
  endTime: true,
  active: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  type: true,
  title: true,
  message: true,
  aircraftIds: true,
  sectorId: true,
  priority: true,
  status: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).pick({
  name: true,
  status: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Aircraft = typeof aircraft.$inferSelect;
export type InsertAircraft = z.infer<typeof insertAircraftSchema>;

export type Sector = typeof sectors.$inferSelect;
export type InsertSector = z.infer<typeof insertSectorSchema>;

export type Restriction = typeof restrictions.$inferSelect;
export type InsertRestriction = z.infer<typeof insertRestrictionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
