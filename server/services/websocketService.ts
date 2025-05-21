import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { Aircraft, Notification, DataSource } from "@shared/schema";

// Define message types for WebSocket communication
type WSMessage = {
  type: string;
  data: any;
};

// WebSocket service for real-time updates
export class WebSocketService {
  private wss: WebSocketServer | null = null;
  
  // Initialize the WebSocket server
  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws' 
    });
    
    this.wss.on('connection', (ws) => {
      console.log('Client connected to WebSocket');
      
      // Send initial connection message
      this.sendToClient(ws, {
        type: 'connection',
        data: { status: 'connected' }
      });
      
      ws.on('message', (message) => {
        try {
          // Check if the message is a plain string like "ping"
          const messageStr = message.toString();
          
          if (messageStr === "ping") {
            console.log('Received message from client:', messageStr);
            this.sendToClient(ws, { type: 'pong', data: { timestamp: Date.now() } });
            return;
          }
          
          // Otherwise try to parse as JSON
          const parsedMessage = JSON.parse(messageStr) as WSMessage;
          this.handleClientMessage(ws, parsedMessage);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
      });
    });
    
    console.log('WebSocket server initialized');
  }
  
  // Handle messages from clients
  private handleClientMessage(ws: WebSocket, message: WSMessage) {
    console.log('Received message from client:', message.type);
    
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', data: { timestamp: Date.now() } });
        break;
      
      case 'subscribe':
        // Handle subscription requests (e.g., to specific aircraft or sectors)
        // This would be implemented in a real system
        this.sendToClient(ws, { 
          type: 'subscribed', 
          data: { channel: message.data.channel } 
        });
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }
  
  // Send a message to a specific client
  private sendToClient(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  // Broadcast aircraft updates to all connected clients
  broadcastAircraftUpdates(aircraft: Aircraft[]) {
    if (!this.wss) return;
    
    this.broadcast({
      type: 'aircraft_update',
      data: { aircraft }
    });
  }
  
  // Broadcast a single aircraft update
  broadcastAircraftUpdate(aircraft: Aircraft) {
    if (!this.wss) return;
    
    this.broadcast({
      type: 'single_aircraft_update',
      data: { aircraft }
    });
  }
  
  // Broadcast a new notification
  broadcastNotification(notification: Notification) {
    if (!this.wss) return;
    
    this.broadcast({
      type: 'notification',
      data: { notification }
    });
  }
  
  // Broadcast data source status updates
  broadcastDataSourceUpdate(dataSources: DataSource[]) {
    if (!this.wss) return;
    
    this.broadcast({
      type: 'data_source_update',
      data: { dataSources }
    });
  }
  
  // Broadcast collision alerts
  broadcastCollisionAlert(aircraftIds: number[], timeToCollision: number, severity: string) {
    if (!this.wss) return;
    
    this.broadcast({
      type: 'collision_alert',
      data: {
        aircraftIds,
        timeToCollision,
        severity
      }
    });
  }
  
  // Broadcast airspace violation alerts
  broadcastAirspaceAlert(aircraftId: number, restrictionId: number, restrictionType: string) {
    if (!this.wss) return;
    
    this.broadcast({
      type: 'airspace_alert',
      data: {
        aircraftId,
        restrictionId,
        restrictionType
      }
    });
  }
  
  // Broadcast a message to all connected clients
  private broadcast(message: WSMessage) {
    if (!this.wss) return;
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

// Create and export instance
export const websocketService = new WebSocketService();
