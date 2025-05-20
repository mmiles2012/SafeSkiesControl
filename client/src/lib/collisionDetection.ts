// Collision detection and mitigation logic

import { Aircraft } from "../types/aircraft";
import { calculateDistance } from "./mapUtils";

// Check for potential conflicts between aircraft
export function detectPotentialCollisions(
  aircraft: Aircraft[]
): {
  aircraftIds: [number, number];
  timeToCollision: number;
  severity: "high" | "medium" | "low";
}[] {
  const collisions: {
    aircraftIds: [number, number];
    timeToCollision: number;
    severity: "high" | "medium" | "low";
  }[] = [];
  
  // Check each pair of aircraft
  for (let i = 0; i < aircraft.length; i++) {
    for (let j = i + 1; j < aircraft.length; j++) {
      const ac1 = aircraft[i];
      const ac2 = aircraft[j];
      
      // Calculate horizontal distance in miles
      const distance = calculateDistance(
        ac1.latitude,
        ac1.longitude,
        ac2.latitude,
        ac2.longitude
      );
      
      // Calculate altitude difference in feet
      const altitudeDiff = Math.abs(ac1.altitude - ac2.altitude);
      
      // Calculate time to collision based on relative velocities
      // (This is a simplified calculation)
      const horizontalClosingSpeed = calculateClosingSpeed(ac1, ac2);
      const timeToCollision = distance / horizontalClosingSpeed * 3600; // in seconds
      
      // Define collision risk thresholds
      if (distance < 10 && altitudeDiff < 1000) {
        collisions.push({
          aircraftIds: [ac1.id, ac2.id],
          timeToCollision,
          severity: "high"
        });
      } else if (distance < 20 && altitudeDiff < 2000) {
        collisions.push({
          aircraftIds: [ac1.id, ac2.id],
          timeToCollision,
          severity: "medium"
        });
      } else if (distance < 30 && altitudeDiff < 3000) {
        collisions.push({
          aircraftIds: [ac1.id, ac2.id],
          timeToCollision,
          severity: "low"
        });
      }
    }
  }
  
  return collisions;
}

// Calculate closing speed between two aircraft (simplified)
function calculateClosingSpeed(ac1: Aircraft, ac2: Aircraft): number {
  // Convert heading to radians
  const heading1 = ac1.heading * Math.PI / 180;
  const heading2 = ac2.heading * Math.PI / 180;
  
  // Calculate velocity components
  const vx1 = ac1.speed * Math.sin(heading1);
  const vy1 = ac1.speed * Math.cos(heading1);
  const vx2 = ac2.speed * Math.sin(heading2);
  const vy2 = ac2.speed * Math.cos(heading2);
  
  // Calculate relative velocity
  const dvx = vx2 - vx1;
  const dvy = vy2 - vy1;
  
  // Calculate closing speed
  const closingSpeed = Math.sqrt(dvx * dvx + dvy * dvy);
  
  // If closing speed is very small, return a minimum value to avoid division by zero
  return Math.max(closingSpeed, 1);
}

// Generate mitigation strategies for a collision
export function generateMitigationStrategies(
  aircraft1: Aircraft,
  aircraft2: Aircraft
): {
  description: string;
  actions: {
    aircraftId: number;
    callsign: string;
    action: string;
    newAltitude?: number;
    newHeading?: number;
  }[];
}[] {
  const strategies = [];
  
  // Strategy 1: Altitude separation
  strategies.push({
    description: "Altitude Separation",
    actions: [
      {
        aircraftId: aircraft1.id,
        callsign: aircraft1.callsign,
        action: "Climb",
        newAltitude: aircraft1.altitude + 2000
      },
      {
        aircraftId: aircraft2.id,
        callsign: aircraft2.callsign,
        action: "Descend",
        newAltitude: aircraft2.altitude - 2000
      }
    ]
  });
  
  // Strategy 2: Heading change
  const newHeading1 = (aircraft1.heading + 30) % 360;
  const newHeading2 = (aircraft2.heading - 30 + 360) % 360;
  
  strategies.push({
    description: "Vector Separation",
    actions: [
      {
        aircraftId: aircraft1.id,
        callsign: aircraft1.callsign,
        action: "Turn Right",
        newHeading: newHeading1
      },
      {
        aircraftId: aircraft2.id,
        callsign: aircraft2.callsign,
        action: "Turn Left",
        newHeading: newHeading2
      }
    ]
  });
  
  // Strategy 3: Combined approach
  strategies.push({
    description: "Combined Altitude and Vector",
    actions: [
      {
        aircraftId: aircraft1.id,
        callsign: aircraft1.callsign,
        action: "Climb and Turn Right",
        newAltitude: aircraft1.altitude + 1000,
        newHeading: newHeading1
      },
      {
        aircraftId: aircraft2.id,
        callsign: aircraft2.callsign,
        action: "Maintain Altitude and Turn Left",
        newHeading: newHeading2
      }
    ]
  });
  
  return strategies;
}

// Format time to collision for display
export function formatTimeToCollision(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
