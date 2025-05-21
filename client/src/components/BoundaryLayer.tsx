import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import { useMapContext } from '../hooks/useMapContext';

interface BoundaryLayerProps {
  facilityId?: string;
  showKansasCityView?: boolean;
  visible?: boolean;
}

/**
 * Component to display ARTCC boundaries on the map using Mapbox's API capabilities
 * This approach uses Mapbox's direct API for better performance and reliability
 */
const BoundaryLayer: React.FC<BoundaryLayerProps> = ({ 
  facilityId = 'ZKC', 
  showKansasCityView = false,
  visible = true 
}) => {
  const { map } = useMapContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to create a proper polygon for the selected ARTCC
  const createARTCCPolygon = async () => {
    try {
      if (!map) return;

      setLoading(true);
      setError(null);

      console.log(`Creating ${facilityId} ARTCC boundary visualization`);

      // Define the layers we'll create and need to remove if they exist
      const layersToRemove = [
        'artcc-boundary-fill',
        'artcc-boundary-outline',
        'artcc-boundary-background'
      ];

      // Clean up any existing layers
      try {
        layersToRemove.forEach(layerId => {
          if (map && typeof map.getLayer === 'function' && map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });
        
        // Remove source if it exists
        if (map && typeof map.getSource === 'function' && map.getSource('artcc-boundary')) {
          map.removeSource('artcc-boundary');
        }
      } catch (error) {
        console.error('Error cleaning up existing layers:', error);
      }
      
      // Only proceed if the component is visible
      if (!visible) {
        setLoading(false);
        return;
      }

      // Define ARTCC boundary coordinates based on facilityId
      let artccCoordinates = [];
      let artccCenter = [-96.0, 38.5]; // Default center (Kansas City)
      let artccZoom = 6; // Default zoom level

      // Assign coordinates based on the selected ARTCC
      switch(facilityId) {
        case "ZKC": // Kansas City
          artccCoordinates = [
            [-94.71, 39.30],  // Kansas City
            [-95.40, 39.78],
            [-96.20, 40.10],
            [-97.50, 40.25],
            [-98.80, 39.98],
            [-99.20, 39.10],
            [-98.80, 38.20],
            [-97.60, 37.60],
            [-96.40, 37.20],
            [-94.95, 36.90],
            [-93.50, 37.20],
            [-92.80, 37.80],
            [-92.50, 38.60],
            [-93.00, 39.50],
            [-93.80, 39.70],
            [-94.71, 39.30]   // Close the polygon
          ];
          artccCenter = [-96.0, 38.5];
          artccZoom = 6;
          break;
        case "ZDV": // Denver
          artccCoordinates = [
            [-105.20, 39.70], // Denver
            [-106.50, 40.60],
            [-107.80, 40.80],
            [-108.90, 40.60],
            [-109.50, 39.80],
            [-109.20, 38.50],
            [-108.50, 37.20],
            [-107.30, 36.90],
            [-106.20, 36.70],
            [-105.10, 37.10],
            [-104.50, 38.20],
            [-104.30, 39.10],
            [-105.20, 39.70]  // Close the polygon
          ];
          artccCenter = [-106.5, 38.5];
          artccZoom = 6;
          break;
        case "ZOA": // Oakland
          artccCoordinates = [
            [-122.40, 37.80], // San Francisco
            [-123.80, 38.70],
            [-124.50, 40.20],
            [-124.20, 41.80],
            [-123.00, 42.50],
            [-121.80, 42.30],
            [-120.50, 41.60],
            [-119.90, 40.20],
            [-120.30, 38.90],
            [-121.20, 37.60],
            [-122.40, 37.80]  // Close the polygon
          ];
          artccCenter = [-122.0, 40.0];
          artccZoom = 5.5;
          break;
        case "ZNY": // New York
          artccCoordinates = [
            [-74.00, 40.70], // New York City
            [-74.80, 41.50],
            [-75.50, 42.30],
            [-75.80, 43.10],
            [-74.90, 43.60],
            [-73.50, 43.20],
            [-72.70, 42.30],
            [-72.30, 41.40],
            [-72.90, 40.50],
            [-73.60, 40.20],
            [-74.00, 40.70]  // Close the polygon
          ];
          artccCenter = [-74.0, 41.5];
          artccZoom = 6.5;
          break;
        case "ZMA": // Miami
          artccCoordinates = [
            [-80.20, 25.80], // Miami
            [-81.50, 26.70],
            [-82.80, 27.30],
            [-83.60, 28.50],
            [-82.90, 29.20],
            [-81.70, 29.10],
            [-80.60, 28.40],
            [-80.00, 27.20],
            [-80.20, 25.80]  // Close the polygon
          ];
          artccCenter = [-81.5, 27.5];
          artccZoom = 6;
          break;
        default:
          // Fallback to Kansas City ARTCC if unknown
          artccCoordinates = [
            [-94.71, 39.30],  // Kansas City (defaults)
            [-95.40, 39.78],
            [-96.20, 40.10],
            [-97.50, 40.25],
            [-98.80, 39.98],
            [-99.20, 39.10],
            [-98.80, 38.20],
            [-97.60, 37.60],
            [-96.40, 37.20],
            [-94.95, 36.90],
            [-93.50, 37.20],
            [-92.80, 37.80],
            [-92.50, 38.60],
            [-93.00, 39.50],
            [-93.80, 39.70],
            [-94.71, 39.30]   // Close the polygon
          ];
          artccCenter = [-96.0, 38.5];
          artccZoom = 6;
      }

      // Define a GeoJSON object with the selected ARTCC boundary
      const artccBoundaryGeoJSON = {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            properties: {
              facilityId: facilityId,
              name: `${facilityId} ARTCC`
            },
            geometry: {
              type: "Polygon" as const,
              coordinates: [artccCoordinates]
            }
          }
        ]
      };

      // Add the GeoJSON source for boundaries directly 
      map.addSource('artcc-boundary', {
        type: 'geojson',
        data: artccBoundaryGeoJSON
      });

      // Fly to the selected ARTCC region with appropriate zoom
      map.flyTo({
        center: [artccCenter[0], artccCenter[1]] as [number, number],
        zoom: artccZoom,
        essential: true
      });

      // Create appropriate boundary visualization based on view setting
      if (showKansasCityView) {
        // Add the ARTCC polygon fill layer with highlighted style
        map.addLayer({
          id: 'artcc-boundary-fill',
          type: 'fill',
          source: 'artcc-boundary',
          paint: {
            'fill-color': '#ffffff',
            'fill-opacity': 0.1
          }
        });

        // Add strong outline to make the boundary visible
        map.addLayer({
          id: 'artcc-boundary-outline',
          type: 'line',
          source: 'artcc-boundary',
          paint: {
            'line-color': '#ff9900', // Orange outline for visibility
            'line-width': 3,
            'line-opacity': 1
          }
        });
      } else {
        // Standard view - just show the boundary with a subtle fill
        map.addLayer({
          id: 'artcc-boundary-fill',
          type: 'fill',
          source: 'artcc-boundary',
          paint: {
            'fill-color': 'rgba(100, 149, 237, 0.1)', // Light blue
            'fill-opacity': 0.2
          }
        });

        // Add outline to make the boundary visible
        map.addLayer({
          id: 'artcc-boundary-outline',
          type: 'line',
          source: 'artcc-boundary',
          paint: {
            'line-color': '#3388ff', // Blue outline
            'line-width': 2,
            'line-opacity': 0.8
          }
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Error displaying boundary layer:', err);
      setError('Failed to display boundary layer');
      setLoading(false);
    }
  };

  // Effect to update the boundary when parameters change
  useEffect(() => {
    if (!map) return;

    const initBoundary = () => {
      try {
        createARTCCPolygon();
      } catch (error) {
        console.error('Error initializing boundary:', error);
        setError('Failed to initialize boundary layer');
      }
    };

    // Check if map has loaded method before using it
    const isMapLoaded = map && typeof map.loaded === 'function' ? map.loaded() : false;
    
    if (isMapLoaded) {
      // Map is already loaded, initialize immediately
      initBoundary();
    } else {
      // Wait for map to load
      map.once('load', initBoundary);
    }

    // Cleanup function
    return () => {
      if (!map) return;

      // Remove the load event listener if it exists
      map.off('load', initBoundary);

      const layersToRemove = [
        'artcc-boundary-fill',
        'artcc-boundary-outline',
        'artcc-boundary-background'
      ];

      // Safely remove layers and sources
      try {
        layersToRemove.forEach(layerId => {
          if (map && typeof map.getLayer === 'function' && map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });

        if (map && typeof map.getSource === 'function' && map.getSource('artcc-boundary')) {
          map.removeSource('artcc-boundary');
        }
      } catch (error) {
        console.error('Error cleaning up boundary layers:', error);
      }
    };
  }, [map, facilityId, showKansasCityView, visible]);

  return (
    <div className="boundary-layer-component">
      {loading && <div className="hidden">Loading boundary data...</div>}
      {error && <div className="hidden">{error}</div>}
    </div>
  );
};

export default BoundaryLayer;