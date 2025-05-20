// Utilities for working with maps and geographic data

import { Aircraft, Restriction, Sector } from "../types/aircraft";
import mapboxgl from "mapbox-gl";

// Format functions are defined below

// Convert degrees to radians
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Convert radians to degrees
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

// Calculate distance between two coordinates using the Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}

// Calculate destination point given distance and bearing
export function calculateDestination(
  lat: number,
  lon: number,
  distanceMiles: number,
  bearingDegrees: number
): { lat: number; lon: number } {
  const R = 3958.8; // Earth's radius in miles
  const d = distanceMiles;
  const brng = degToRad(bearingDegrees);
  const lat1 = degToRad(lat);
  const lon1 = degToRad(lon);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d / R) +
    Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1),
    Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: radToDeg(lat2),
    lon: radToDeg(lon2)
  };
}

// Calculate flight path points for an aircraft
export function calculateFlightPath(aircraft: Aircraft, pointsAhead: number = 10): mapboxgl.LngLatLike[] {
  const points: mapboxgl.LngLatLike[] = [];
  
  // Add current position
  points.push([aircraft.longitude, aircraft.latitude]);
  
  // Add future positions based on heading and speed
  const speedInMilesPerMinute = aircraft.speed / 60; // Convert knots to miles per minute
  
  for (let i = 1; i <= pointsAhead; i++) {
    // Calculate position 1 minute into the future
    const destination = calculateDestination(
      aircraft.latitude,
      aircraft.longitude,
      speedInMilesPerMinute * i,
      aircraft.heading
    );
    
    points.push([destination.lon, destination.lat]);
  }
  
  return points;
}

// Check if a point is inside a GeoJSON polygon
export function isPointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  // Implementation of the ray casting algorithm
  const x = point[0];
  const y = point[1];
  
  for (const ring of polygon) {
    let inside = false;
    
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      
      if (intersect) {
        inside = !inside;
      }
    }
    
    if (inside) {
      return true;
    }
  }
  
  return false;
}

// Check if an aircraft is violating an airspace restriction
export function isAircraftViolatingRestriction(aircraft: Aircraft, restriction: Restriction): boolean {
  // Check altitude first
  if (aircraft.altitude < restriction.altitude.min || aircraft.altitude > restriction.altitude.max) {
    return false;
  }
  
  // Check boundaries
  if (restriction.boundaries.type === "Polygon") {
    return isPointInPolygon(
      [aircraft.longitude, aircraft.latitude],
      restriction.boundaries.coordinates
    );
  } else if (restriction.boundaries.type === "Point" && restriction.boundaries.radius) {
    // For circular restrictions
    const distance = calculateDistance(
      aircraft.latitude,
      aircraft.longitude,
      restriction.boundaries.coordinates[1],
      restriction.boundaries.coordinates[0]
    );
    
    return distance <= restriction.boundaries.radius;
  }
  
  return false;
}

// Check if an aircraft is inside a sector
export function isAircraftInSector(aircraft: Aircraft, sector: Sector): boolean {
  if (!sector.boundaries || sector.boundaries.type !== "Polygon") {
    return false;
  }
  
  return isPointInPolygon(
    [aircraft.longitude, aircraft.latitude],
    sector.boundaries.coordinates
  );
}

// Generate a color based on verification status
export function getVerificationStatusColor(status: string): string {
  switch (status) {
    case "verified":
      return "#4CAF50"; // Success green
    case "partially_verified":
      return "#FFC107"; // Warning yellow
    case "unverified":
      return "#F44336"; // Danger red
    default:
      return "#B0B0B0"; // Gray
  }
}

// Format altitude for display
export function formatAltitude(altitude: number): string {
  if (altitude < 10000) {
    return `${altitude}ft`;
  } else {
    return `FL${Math.floor(altitude / 100)}`;
  }
}

// Format heading for display
export function formatHeading(heading: number): string {
  return `${heading.toString().padStart(3, '0')}°`;
}

// Format speed for display
export function formatSpeed(speed: number): string {
  return `${speed} kts`;
}

// Convert flight level to altitude
export function flightLevelToAltitude(flightLevel: string): number {
  if (flightLevel.startsWith("FL")) {
    return parseInt(flightLevel.substring(2)) * 100;
  }
  return 0;
}
