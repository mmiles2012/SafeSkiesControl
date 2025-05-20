// Machine learning verification utilities

import { Aircraft } from "../types/aircraft";

// Verify if aircraft data has been correlated with multiple sources
export function isAircraftVerified(aircraft: Aircraft): boolean {
  return aircraft.verificationStatus === "verified";
}

// Get the number of verified sources for an aircraft
export function getVerifiedSourceCount(aircraft: Aircraft): number {
  return aircraft.verifiedSources?.length || 0;
}

// Check if an aircraft is at risk of collision with another
export function checkCollisionRisk(
  aircraft1: Aircraft,
  aircraft2: Aircraft
): { isAtRisk: boolean; timeToCollision?: number; severity?: string } {
  // Calculate distance between aircraft
  const distance = calculateDistance(
    aircraft1.latitude,
    aircraft1.longitude,
    aircraft2.latitude,
    aircraft2.longitude
  );
  
  // Check altitude difference (in feet)
  const altitudeDiff = Math.abs(aircraft1.altitude - aircraft2.altitude);
  
  // Define collision thresholds (greatly simplified)
  if (distance < 10 && altitudeDiff < 1000) { // 10 miles, 1000 feet
    // High severity collision risk
    return {
      isAtRisk: true,
      timeToCollision: Math.floor(distance * 60), // Rough estimate in seconds
      severity: "high"
    };
  } else if (distance < 20 && altitudeDiff < 2000) { // 20 miles, 2000 feet
    // Medium severity collision risk
    return {
      isAtRisk: true,
      timeToCollision: Math.floor(distance * 120),
      severity: "medium"
    };
  } else if (distance < 30 && altitudeDiff < 3000) { // 30 miles, 3000 feet
    // Low severity collision risk
    return {
      isAtRisk: true,
      timeToCollision: Math.floor(distance * 180),
      severity: "low"
    };
  }
  
  return { isAtRisk: false };
}

// Calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}

// Format the verification status for display
export function formatVerificationStatus(status: string): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "partially_verified":
      return "Partially Verified";
    case "unverified":
      return "Unverified";
    default:
      return status;
  }
}
