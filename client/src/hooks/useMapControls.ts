// Hook for managing map controls and state

import { useState, useEffect, useCallback, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Aircraft, MapSettings, Restriction, Sector } from "../types/aircraft";
import { getVerificationStatusColor, calculateFlightPath } from "../lib/mapUtils";

// Initialize Mapbox GL with the provided access token
mapboxgl.accessToken = "pk.eyJ1IjoibW1pbGVzMjAxMiIsImEiOiJjbWF4MWh2MnowbXhrMmtxODgyNTNpeW1vIn0.3_G3XkF_5nMb62FUZBvjTQ";

export function useMapControls() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{[key: string]: mapboxgl.Marker}>({});
  const popups = useRef<{[key: string]: mapboxgl.Popup}>({});
  const flightPaths = useRef<{[key: string]: mapboxgl.GeoJSONSource | null}>({});
  
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    showGrid: true,
    showRestrictions: true,
    showSectors: true,
    showVerifiedOnly: false,
    showLabels: true,
    showFlightPaths: true
  });
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Initialize map only once
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [-98.5795, 39.8283], // Center of US
        zoom: 4
      });
      
      map.current.on('load', () => {
        setMapLoaded(true);
        
        // Add grid lines source
        map.current?.addSource('grid-lines', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
        
        // Add grid lines layer
        map.current?.addLayer({
          id: 'grid-lines',
          type: 'line',
          source: 'grid-lines',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': 'visible'
          },
          paint: {
            'line-color': '#2D2D2D',
            'line-width': 1,
            'line-opacity': 0.5
          }
        });
        
        // Add flight paths source
        map.current?.addSource('flight-paths', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
        
        // Add flight paths layer
        map.current?.addLayer({
          id: 'flight-paths',
          type: 'line',
          source: 'flight-paths',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': 'visible'
          },
          paint: {
            'line-color': '#1E88E5',
            'line-width': 2,
            'line-dasharray': [2, 1],
            'line-opacity': 0.7
          }
        });
        
        // Add restrictions source
        map.current?.addSource('restrictions', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
        
        // Add restrictions layer
        map.current?.addLayer({
          id: 'restrictions',
          type: 'fill',
          source: 'restrictions',
          layout: {
            'visibility': 'visible'
          },
          paint: {
            'fill-color': '#F44336',
            'fill-opacity': 0.2,
            'fill-outline-color': '#F44336'
          }
        });
        
        // Add sectors source
        map.current?.addSource('sectors', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
        
        // Add sectors layer
        map.current?.addLayer({
          id: 'sectors',
          type: 'line',
          source: 'sectors',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': 'visible'
          },
          paint: {
            'line-color': '#4CAF50',
            'line-width': 2,
            'line-dasharray': [5, 5],
            'line-opacity': 0.7
          }
        });
      });
      
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }
    
    return () => {
      // Cleanup
      Object.values(markers.current).forEach(marker => marker.remove());
      Object.values(popups.current).forEach(popup => popup.remove());
      markers.current = {};
      popups.current = {};
    };
  }, []);
  
  // Update map settings
  const updateMapSettings = useCallback((settings: Partial<MapSettings>) => {
    setMapSettings(prev => ({ ...prev, ...settings }));
    
    // Apply visibility changes to layers
    if (map.current && mapLoaded) {
      if (settings.showGrid !== undefined) {
        map.current.setLayoutProperty(
          'grid-lines',
          'visibility',
          settings.showGrid ? 'visible' : 'none'
        );
      }
      
      if (settings.showRestrictions !== undefined) {
        map.current.setLayoutProperty(
          'restrictions',
          'visibility',
          settings.showRestrictions ? 'visible' : 'none'
        );
      }
      
      if (settings.showSectors !== undefined) {
        map.current.setLayoutProperty(
          'sectors',
          'visibility',
          settings.showSectors ? 'visible' : 'none'
        );
      }
      
      if (settings.showFlightPaths !== undefined) {
        map.current.setLayoutProperty(
          'flight-paths',
          'visibility',
          settings.showFlightPaths ? 'visible' : 'none'
        );
      }
    }
  }, [mapLoaded]);
  
  // Update aircraft markers
  const updateAircraftMarkers = useCallback((aircraft: Aircraft[]) => {
    if (!map.current || !mapLoaded) return;
    
    // Track which aircraft IDs we've updated
    const updatedIds = new Set<string>();
    
    // Update or create markers for each aircraft
    aircraft.forEach(ac => {
      // Skip aircraft that don't meet filter criteria
      if (mapSettings.showVerifiedOnly && ac.verificationStatus !== 'verified') {
        return;
      }
      
      const markerId = `aircraft-${ac.id}`;
      updatedIds.add(markerId);
      
      // Get color based on verification status
      const color = getVerificationStatusColor(ac.verificationStatus);
      
      // Create HTML element for the marker
      const createMarkerElement = () => {
        const el = document.createElement('div');
        el.className = 'aircraft-marker';
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.backgroundColor = color;
        el.style.transform = `rotate(${ac.heading}deg)`;
        el.style.transformOrigin = 'center';
        el.style.borderRadius = '0';
        
        // Make pulsing if assistance needed
        if (ac.needsAssistance) {
          el.style.animation = 'pulse 1s infinite';
        }
        
        return el;
      };
      
      // Update existing marker or create a new one
      if (markers.current[markerId]) {
        // Update position
        markers.current[markerId].setLngLat([ac.longitude, ac.latitude]);
        
        // Update element appearance
        const el = markers.current[markerId].getElement();
        el.style.backgroundColor = color;
        el.style.transform = `rotate(${ac.heading}deg)`;
        
        if (ac.needsAssistance) {
          el.style.animation = 'pulse 1s infinite';
        } else {
          el.style.animation = 'none';
        }
      } else {
        // Create new marker
        const marker = new mapboxgl.Marker(createMarkerElement())
          .setLngLat([ac.longitude, ac.latitude])
          .addTo(map.current);
        
        // Add click event to select aircraft
        marker.getElement().addEventListener('click', () => {
          setSelectedAircraftId(ac.id);
        });
        
        markers.current[markerId] = marker;
      }
      
      // Add or update popup if labels are enabled
      if (mapSettings.showLabels) {
        if (!popups.current[markerId]) {
          popups.current[markerId] = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: [0, -10],
            className: 'aircraft-popup'
          });
          
          markers.current[markerId].setPopup(popups.current[markerId]);
        }
        
        // Update popup content
        popups.current[markerId].setHTML(
          `<div class="text-xs font-mono bg-surface px-1 rounded">${ac.callsign}</div>`
        );
      } else if (popups.current[markerId]) {
        // Remove popup if labels are disabled
        popups.current[markerId].remove();
        delete popups.current[markerId];
      }
      
      // Update flight path if selected
      if (ac.id === selectedAircraftId && mapSettings.showFlightPaths) {
        updateFlightPath(ac);
      }
    });
    
    // Remove markers for aircraft that no longer exist
    Object.keys(markers.current).forEach(id => {
      if (!updatedIds.has(id)) {
        markers.current[id].remove();
        delete markers.current[id];
        
        if (popups.current[id]) {
          popups.current[id].remove();
          delete popups.current[id];
        }
      }
    });
  }, [mapLoaded, mapSettings.showLabels, mapSettings.showVerifiedOnly, mapSettings.showFlightPaths, selectedAircraftId]);
  
  // Update flight path for selected aircraft
  const updateFlightPath = useCallback((aircraft: Aircraft) => {
    if (!map.current || !mapLoaded) return;
    
    // Calculate flight path points
    const pathPoints = calculateFlightPath(aircraft, 10);
    
    // Update flight paths source
    const source = map.current.getSource('flight-paths') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: pathPoints
            }
          }
        ]
      });
    }
  }, [mapLoaded]);
  
  // Update restrictions on the map
  const updateRestrictions = useCallback((restrictions: Restriction[]) => {
    if (!map.current || !mapLoaded) return;
    
    // Convert restrictions to GeoJSON features
    const features = restrictions.filter(r => r.active).map(restriction => {
      return {
        type: 'Feature',
        properties: {
          id: restriction.id,
          name: restriction.name,
          type: restriction.type
        },
        geometry: restriction.boundaries
      };
    });
    
    // Update restrictions source
    const source = map.current.getSource('restrictions') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }, [mapLoaded]);
  
  // Update sectors on the map
  const updateSectors = useCallback((sectors: Sector[]) => {
    if (!map.current || !mapLoaded) return;
    
    // Convert sectors to GeoJSON features
    const features = sectors.map(sector => {
      return {
        type: 'Feature',
        properties: {
          id: sector.id,
          name: sector.name
        },
        geometry: sector.boundaries
      };
    });
    
    // Update sectors source
    const source = map.current.getSource('sectors') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }, [mapLoaded]);
  
  // Focus map on a specific aircraft
  const focusOnAircraft = useCallback((aircraft: Aircraft) => {
    if (!map.current || !mapLoaded) return;
    
    map.current.flyTo({
      center: [aircraft.longitude, aircraft.latitude],
      zoom: 8,
      duration: 1000
    });
    
    setSelectedAircraftId(aircraft.id);
    updateFlightPath(aircraft);
  }, [mapLoaded, updateFlightPath]);
  
  // Reset map view
  const resetMapView = useCallback(() => {
    if (!map.current || !mapLoaded) return;
    
    map.current.flyTo({
      center: [-98.5795, 39.8283], // Center of US
      zoom: 4,
      duration: 1000
    });
    
    setSelectedAircraftId(null);
    
    // Clear flight path
    const source = map.current.getSource('flight-paths') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }, [mapLoaded]);
  
  return {
    mapContainer,
    mapSettings,
    updateMapSettings,
    updateAircraftMarkers,
    updateRestrictions,
    updateSectors,
    focusOnAircraft,
    resetMapView,
    selectedAircraftId,
    setSelectedAircraftId
  };
}
