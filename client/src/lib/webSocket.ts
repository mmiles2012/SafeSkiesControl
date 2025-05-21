// WebSocket client for real-time data updates

import { Aircraft, Notification } from '@/types/aircraft';

// Define event callback types
type AircraftUpdateCallback = (aircraft: Aircraft[]) => void;
type SingleAircraftUpdateCallback = (aircraft: Aircraft) => void;
type NotificationCallback = (notification: Notification) => void;
type CollisionAlertCallback = (aircraftIds: number[], timeToCollision: number, severity: string) => void;
type AirspaceAlertCallback = (aircraftId: number, restrictionId: number, restrictionType: string) => void;
type ConnectionStatusCallback = (status: 'connected' | 'disconnected' | 'error') => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds initially

  // Event listeners
  private aircraftUpdateListeners: AircraftUpdateCallback[] = [];
  private singleAircraftUpdateListeners: SingleAircraftUpdateCallback[] = [];
  private notificationListeners: NotificationCallback[] = [];
  private collisionAlertListeners: CollisionAlertCallback[] = [];
  private airspaceAlertListeners: AirspaceAlertCallback[] = [];
  private connectionStatusListeners: ConnectionStatusCallback[] = [];

  // Connection method
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Setup WebSocket connection with proper protocol detection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Add error handling for URL construction
      if (!window.location.host) {
        throw new Error('Invalid host for WebSocket connection');
      }
    
      console.log('Connecting to WebSocket at:', wsUrl);
    } finally {
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.resetReconnectDelay();
        
        // Send a ping to verify connection
        this.sendMessage('ping');
        
        // Notify listeners of connection
        this.notifyConnectionStatusListeners('connected');
      };
      
      this.socket.onmessage = (event) => {
        try {
          // Handle both string and JSON messages
          let data;
          if (typeof event.data === 'string') {
            // Check if it's a simple string message (like "pong")
            if (event.data === "pong") {
              console.log("Received heartbeat pong");
              return;
            }
            // Otherwise try to parse as JSON
            data = JSON.parse(event.data);
          } else {
            console.warn("Received non-string message:", event.data);
            return;
          }
          
          // Handle different message types
          switch (data.type) {
            case 'connection':
              console.log("WebSocket connection established");
              break;
            case 'aircraft_updates':
              this.notifyAircraftUpdateListeners(data.data.aircraft);
              break;
            case 'aircraft_update':
              this.notifySingleAircraftUpdateListeners(data.data.aircraft);
              break;
            case 'single_aircraft_update':
              this.notifySingleAircraftUpdateListeners(data.data.aircraft);
              break;
            case 'notification':
              this.notifyNotificationListeners(data.data.notification);
              break;
            case 'collision_alert':
              this.notifyCollisionAlertListeners(
                data.data.aircraftIds,
                data.data.timeToCollision,
                data.data.severity
              );
              break;
            case 'airspace_alert':
              this.notifyAirspaceAlertListeners(
                data.data.aircraftId,
                data.data.restrictionId,
                data.data.restrictionType
              );
              break;
            case 'pong':
              // Heartbeat response received
              console.log("Received pong response", data.data.timestamp);
              break;
            default:
              console.log('Unhandled WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.socket = null;
        
        // Notify listeners of disconnection
        this.notifyConnectionStatusListeners('disconnected');
        
        // Attempt to reconnect if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        
        // Notify listeners of error
        this.notifyConnectionStatusListeners('error');
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.isConnecting = false;
      
      // Notify listeners of error
      this.notifyConnectionStatusListeners('error');
      
      // Attempt to reconnect if we haven't exceeded max attempts
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    }
  }

  // Send a message to the server
  sendMessage(message: string | object): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message, WebSocket is not connected');
      return;
    }
    
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.socket.send(payload);
  }

  // Disconnect from the server
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Clear any pending reconnect
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  // Reset the reconnect delay to the initial value
  private resetReconnectDelay(): void {
    this.reconnectDelay = 3000;
  }

  // Event notification methods
  private notifyAircraftUpdateListeners(aircraft: Aircraft[]): void {
    this.aircraftUpdateListeners.forEach(listener => listener(aircraft));
  }
  
  private notifySingleAircraftUpdateListeners(aircraft: Aircraft): void {
    this.singleAircraftUpdateListeners.forEach(listener => listener(aircraft));
  }
  
  private notifyNotificationListeners(notification: Notification): void {
    this.notificationListeners.forEach(listener => listener(notification));
  }
  
  private notifyCollisionAlertListeners(aircraftIds: number[], timeToCollision: number, severity: string): void {
    this.collisionAlertListeners.forEach(listener => listener(aircraftIds, timeToCollision, severity));
  }
  
  private notifyAirspaceAlertListeners(aircraftId: number, restrictionId: number, restrictionType: string): void {
    this.airspaceAlertListeners.forEach(listener => listener(aircraftId, restrictionId, restrictionType));
  }
  
  private notifyConnectionStatusListeners(status: 'connected' | 'disconnected' | 'error'): void {
    this.connectionStatusListeners.forEach(listener => listener(status));
  }

  // Event subscription methods
  onAircraftUpdates(callback: AircraftUpdateCallback): () => void {
    this.aircraftUpdateListeners.push(callback);
    return () => {
      this.aircraftUpdateListeners = this.aircraftUpdateListeners.filter(listener => listener !== callback);
    };
  }
  
  onSingleAircraftUpdate(callback: SingleAircraftUpdateCallback): () => void {
    this.singleAircraftUpdateListeners.push(callback);
    return () => {
      this.singleAircraftUpdateListeners = this.singleAircraftUpdateListeners.filter(listener => listener !== callback);
    };
  }
  
  onNotification(callback: NotificationCallback): () => void {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(listener => listener !== callback);
    };
  }
  
  onCollisionAlert(callback: CollisionAlertCallback): () => void {
    this.collisionAlertListeners.push(callback);
    return () => {
      this.collisionAlertListeners = this.collisionAlertListeners.filter(listener => listener !== callback);
    };
  }
  
  onAirspaceAlert(callback: AirspaceAlertCallback): () => void {
    this.airspaceAlertListeners.push(callback);
    return () => {
      this.airspaceAlertListeners = this.airspaceAlertListeners.filter(listener => listener !== callback);
    };
  }
  
  onConnectionStatus(callback: ConnectionStatusCallback): () => void {
    this.connectionStatusListeners.push(callback);
    return () => {
      this.connectionStatusListeners = this.connectionStatusListeners.filter(listener => listener !== callback);
    };
  }
}

// Create a singleton instance
const wsClient = new WebSocketClient();

export default wsClient;