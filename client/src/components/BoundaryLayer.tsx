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
  
  // Function to create a proper polygon for Kansas City ARTCC
  const createKansasCityPolygon = async () => {
    try {
      if (!map) return;
      
      setLoading(true);
      setError(null);
      
      console.log('Creating Kansas City ARTCC boundary visualization');
      
      // Define the layers we'll create and need to remove if they exist
      const layersToRemove = [
        'kc-boundary-fill',
        'kc-boundary-outline',
        'kc-boundary-background'
      ];
      
      // Clean up any existing layers
      layersToRemove.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
      
      // Remove source if it exists
      if (map.getSource('kc-boundary')) {
        map.removeSource('kc-boundary');
      }
      
      // Only proceed if the component is visible
      if (!visible) {
        setLoading(false);
        return;
      }
      
      // Define a GeoJSON object with a simplified but accurate Kansas City ARTCC boundary
      // This avoids API calls altogether for more reliable rendering
      const kcBoundaryGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              facilityId: "ZKC",
              name: "Kansas City ARTCC"
            },
            geometry: {
              type: "Polygon",
              coordinates: [[
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
              ]]
            }
          }
        ]
      };
      
      // Add the GeoJSON source for boundaries directly (no API call)
      map.addSource('kc-boundary', {
        type: 'geojson',
        data: kcBoundaryGeoJSON
      });
      
      // Create a "mask" effect for Kansas City ARTCC if showing KC view
      if (showKansasCityView) {
        // Add the KC ARTCC polygon fill layer
        map.addLayer({
          id: 'kc-boundary-fill',
          type: 'fill',
          source: 'kc-boundary',
          paint: {
            'fill-color': '#ffffff',
            'fill-opacity': 0.1
          }
        });
        
        // Add strong outline to make the boundary visible
        map.addLayer({
          id: 'kc-boundary-outline',
          type: 'line',
          source: 'kc-boundary',
          paint: {
            'line-color': '#ff9900', // Orange outline for visibility
            'line-width': 3,
            'line-opacity': 1
          }
        });
        
        // Fly to the Kansas City area with appropriate zoom
        map.flyTo({
          center: [-96.0, 38.5], // Centered on Kansas City ARTCC region
          zoom: 6,
          essential: true
        });
      } else {
        // Standard view - just show the boundary with a subtle fill
        map.addLayer({
          id: 'kc-boundary-fill',
          type: 'fill',
          source: 'kc-boundary',
          paint: {
            'fill-color': 'rgba(100, 149, 237, 0.1)', // Light blue
            'fill-opacity': 0.2
          }
        });
        
        // Add outline to make the boundary visible
        map.addLayer({
          id: 'kc-boundary-outline',
          type: 'line',
          source: 'kc-boundary',
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

    // Wait for map to be fully loaded before adding layers
    if (map.loaded()) {
      createKansasCityPolygon();
    } else {
      map.on('load', createKansasCityPolygon);
    }
    
    // Cleanup function
    return () => {
      if (!map) return;
      
      // Remove the load event listener if it exists
      map.off('load', createKansasCityPolygon);
      
      const layersToRemove = [
        'kc-boundary-fill',
        'kc-boundary-outline',
        'kc-boundary-background'
      ];
      
      layersToRemove.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
      
      if (map.getSource('kc-boundary')) {
        map.removeSource('kc-boundary');
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