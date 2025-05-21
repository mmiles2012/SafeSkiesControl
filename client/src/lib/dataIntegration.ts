// Integration with external data sources like FlightAware

import { Aircraft } from "../types/aircraft";
import { apiRequest } from "./queryClient";

// Fetch aircraft data from the server
export async function fetchAircraft(): Promise<Aircraft[]> {
  try {
    const response = await apiRequest("GET", "/api/aircraft");
    return await response.json();
  } catch (error) {
    console.error("Error fetching aircraft data:", error);
    throw error;
  }
}

// Update an aircraft
export async function updateAircraft(id: number, data: Partial<Aircraft>): Promise<Aircraft> {
  try {
    const response = await apiRequest("PATCH", `/api/aircraft/${id}`, data);
    return await response.json();
  } catch (error) {
    console.error("Error updating aircraft:", error);
    throw error;
  }
}

// Flag an aircraft as needing assistance
export async function flagAircraftForAssistance(id: number, needsAssistance: boolean): Promise<Aircraft> {
  try {
    const response = await apiRequest("POST", `/api/aircraft/${id}/assistance`, { needsAssistance });
    return await response.json();
  } catch (error) {
    console.error("Error flagging aircraft for assistance:", error);
    throw error;
  }
}

// Generate sample aircraft data for testing
export async function generateSampleAircraft(count: number = 10): Promise<Aircraft[]> {
  try {
    const response = await apiRequest("POST", "/api/aircraft/generate-sample", { count });
    return await response.json();
  } catch (error) {
    console.error("Error generating sample aircraft:", error);
    throw error;
  }
}

// Check status of all data sources
export async function checkDataSources(): Promise<{[key: string]: boolean}> {
  try {
    const response = await apiRequest("GET", "/api/data-sources/check");
    return await response.json();
  } catch (error) {
    console.error("Error checking data sources:", error);
    throw error;
  }
}

// Fetch data sources status
export async function fetchDataSources() {
  try {
    const response = await apiRequest("GET", "/api/data-sources");
    return await response.json();
  } catch (error) {
    console.error("Error fetching data sources:", error);
    throw error;
  }
}

// Run collision detection
export async function detectCollisions(aircraft: Aircraft[] = []) {
  try {
    const response = await apiRequest("POST", "/api/ml/detect-collisions", { aircraft });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error detecting collisions:", error);
    // Return empty array instead of throwing
    return [];
  }
}

// Check for airspace violations
export async function detectAirspaceViolations(aircraft: Aircraft[] = []) {
  try {
    const response = await apiRequest("POST", "/api/ml/detect-airspace-violations", { aircraft });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error detecting airspace violations:", error);
    // Return empty array instead of throwing
    return [];
  }
}

// Fetch notifications
export async function fetchNotifications() {
  try {
    const response = await apiRequest("GET", "/api/notifications");
    return await response.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

// Update a notification (e.g., mark as resolved)
export async function updateNotification(id: number, data: any) {
  try {
    const response = await apiRequest("PATCH", `/api/notifications/${id}`, data);
    return await response.json();
  } catch (error) {
    console.error("Error updating notification:", error);
    throw error;
  }
}
