// WebSocket client for real-time updates

import { Aircraft, CollisionAlert, AirspaceAlert, Notification, DataSource } from "../types/aircraft";

type MessageHandler = (data: any) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private _isConnected = false;
  
  // Initialize the WebSocket connection
  connect() {
    if (this.socket) {
      return;
    }
    
    // Create WebSocket with correct URL format for Replit
    const host = window.location.host;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log("Connecting to WebSocket at:", wsUrl);
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log("WebSocket connected");
      this._isConnected = true;
      
      // Clear any reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      // Send a ping to the server
      this.send('ping', {});
    };
    
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    this.socket.onclose = () => {
      console.log("WebSocket disconnected");
      this._isConnected = false;
      this.socket = null;
      
      // Attempt to reconnect after 3 seconds
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, 3000);
    };
    
    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }
  
  // Check if the WebSocket is connected
  isConnected() {
    return this._isConnected;
  }
  
  // Subscribe to a specific message type
  subscribe<T>(type: string, handler: (data: T) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    this.messageHandlers.get(type)!.push(handler as MessageHandler);
    
    // If we're already connected, send a subscribe message
    if (this._isConnected) {
      this.send('subscribe', { channel: type });
    }
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler as MessageHandler);
        if (index >= 0) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  // Send a message to the server
  send(type: string, data: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected, can't send message");
      return false;
    }
    
    this.socket.send(JSON.stringify({ type, data }));
    return true;
  }
  
  // Handle incoming messages
  private handleMessage(message: { type: string; data: any }) {
    // Handle pong message specially for ping-pong
    if (message.type === 'pong') {
      // Could update a lastPong timestamp
      return;
    }
    
    // Dispatch message to registered handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(`Error in ${message.type} handler:`, error);
        }
      });
    }
  }
  
  // Close the WebSocket connection
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this._isConnected = false;
  }
  
  // Subscribe to aircraft updates
  onAircraftUpdates(handler: (aircraft: Aircraft[]) => void) {
    return this.subscribe<{aircraft: Aircraft[]}>('aircraft_update', data => {
      handler(data.aircraft);
    });
  }
  
  // Subscribe to single aircraft updates
  onSingleAircraftUpdate(handler: (aircraft: Aircraft) => void) {
    return this.subscribe<{aircraft: Aircraft}>('single_aircraft_update', data => {
      handler(data.aircraft);
    });
  }
  
  // Subscribe to new notifications
  onNotification(handler: (notification: Notification) => void) {
    return this.subscribe<{notification: Notification}>('notification', data => {
      handler(data.notification);
    });
  }
  
  // Subscribe to data source updates
  onDataSourceUpdate(handler: (dataSources: DataSource[]) => void) {
    return this.subscribe<{dataSources: DataSource[]}>('data_source_update', data => {
      handler(data.dataSources);
    });
  }
  
  // Subscribe to collision alerts
  onCollisionAlert(handler: (alert: CollisionAlert) => void) {
    return this.subscribe<CollisionAlert>('collision_alert', data => {
      handler(data);
    });
  }
  
  // Subscribe to airspace alerts
  onAirspaceAlert(handler: (alert: AirspaceAlert) => void) {
    return this.subscribe<AirspaceAlert>('airspace_alert', data => {
      handler(data);
    });
  }
}

// Create and export the WebSocket client instance
export const wsClient = new WebSocketClient();
export default wsClient;
