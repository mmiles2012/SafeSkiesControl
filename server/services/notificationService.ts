import { storage } from "../storage";
import { InsertNotification, Notification } from "@shared/schema";
import { Aircraft } from "@shared/schema";

// Service to handle notification operations
export class NotificationService {
  // Get all notifications
  async getAllNotifications(): Promise<Notification[]> {
    return await storage.getAllNotifications();
  }
  
  // Get a specific notification by ID
  async getNotification(id: number): Promise<Notification | undefined> {
    return await storage.getNotification(id);
  }
  
  // Get notifications for a specific sector
  async getNotificationsBySector(sectorId: number): Promise<Notification[]> {
    return await storage.getNotificationsBySector(sectorId);
  }
  
  // Get all pending notifications
  async getPendingNotifications(): Promise<Notification[]> {
    return await storage.getPendingNotifications();
  }
  
  // Create a new notification
  async createNotification(notification: InsertNotification): Promise<Notification> {
    return await storage.createNotification(notification);
  }
  
  // Update a notification (e.g., mark as resolved)
  async updateNotification(id: number, notification: Partial<InsertNotification>): Promise<Notification | undefined> {
    return await storage.updateNotification(id, notification);
  }
  
  // Delete a notification
  async deleteNotification(id: number): Promise<boolean> {
    return await storage.deleteNotification(id);
  }
  
  // Create a collision notification
  async createCollisionNotification(
    aircraft: Aircraft[], 
    timeToCollision: number,
    severity: string
  ): Promise<Notification> {
    const aircraftIds = aircraft.map(ac => ac.id!);
    const callsigns = aircraft.map(ac => ac.callsign).join(" and ");
    
    return await this.createNotification({
      type: "collision",
      title: "Collision Alert",
      message: `${callsigns} potential conflict in ${Math.ceil(timeToCollision / 60)} minutes`,
      aircraftIds: aircraftIds,
      sectorId: aircraft[0].controllerSectorId,
      priority: severity === "high" ? "high" : (severity === "medium" ? "normal" : "low"),
      status: "pending"
    });
  }
  
  // Create an airspace restriction notification
  async createAirspaceNotification(
    aircraft: Aircraft,
    restrictionName: string,
    restrictionType: string
  ): Promise<Notification> {
    return await this.createNotification({
      type: "airspace",
      title: "Restricted Airspace",
      message: `${aircraft.callsign} approaching ${restrictionType} flight restriction: ${restrictionName}`,
      aircraftIds: [aircraft.id!],
      sectorId: aircraft.controllerSectorId,
      priority: "normal",
      status: "pending"
    });
  }
  
  // Create a handoff notification
  async createHandoffNotification(
    aircraft: Aircraft,
    fromSectorId: number,
    toSectorId: number,
    toSectorName: string
  ): Promise<Notification> {
    return await this.createNotification({
      type: "handoff",
      title: "Handoff Request",
      message: `${aircraft.callsign} to ${toSectorName}, accept or reject`,
      aircraftIds: [aircraft.id!],
      sectorId: toSectorId,
      priority: "normal",
      status: "pending"
    });
  }
  
  // Create an assistance notification
  async createAssistanceNotification(aircraft: Aircraft): Promise<Notification> {
    return await this.createNotification({
      type: "assistance",
      title: "Assistance Requested",
      message: `${aircraft.callsign} has requested assistance`,
      aircraftIds: [aircraft.id!],
      sectorId: aircraft.controllerSectorId,
      priority: "high",
      status: "pending"
    });
  }
  
  // Create a system notification
  async createSystemNotification(
    title: string,
    message: string,
    priority: string = "normal"
  ): Promise<Notification> {
    return await this.createNotification({
      type: "system",
      title,
      message,
      aircraftIds: [],
      sectorId: undefined,
      priority,
      status: "pending"
    });
  }
}

export const notificationService = new NotificationService();
