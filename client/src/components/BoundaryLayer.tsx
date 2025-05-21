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
      
      // Fetch boundary data from the server API
      const response = await axios.get('/api/boundaries/kansas-city');
      const boundaryData = response.data;
      
      // Clear existing layers if they exist
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
      
      // Add the GeoJSON source for boundaries
      map.addSource('kc-boundary', {
        type: 'geojson',
        data: boundaryData
      });
      
      // If showing KC view specifically, add a background layer that covers the rest of the map
      if (showKansasCityView) {
        // Create a background layer that covers everything outside the boundary
        map.addLayer({
          id: 'kc-boundary-background',
          type: 'background',
          paint: {
            'background-color': 'rgba(200, 200, 200, 0.7)' // Gray out areas outside the boundary
          }
        });
      }
      
      // Add the fill for the boundary area
      map.addLayer({
        id: 'kc-boundary-fill',
        type: 'fill',
        source: 'kc-boundary',
        paint: {
          'fill-color': showKansasCityView ? '#ffffff' : 'rgba(100, 149, 237, 0.1)', // White or light blue
          'fill-opacity': showKansasCityView ? 0.95 : 0.3 // More opaque for KC view
        }
      });
      
      // Add a distinct border to make the boundary visible
      map.addLayer({
        id: 'kc-boundary-outline',
        type: 'line',
        source: 'kc-boundary',
        paint: {
          'line-color': '#ff9900', // Orange outline for visibility
          'line-width': 2,
          'line-opacity': 0.9
        }
      });
      
      // When showing Kansas City view, fly to the Kansas City area
      if (showKansasCityView) {
        map.flyTo({
          center: [-94.7131, 39.2974], // Kansas City coordinates
          zoom: 7,
          speed: 1.2,
          essential: true
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
    
    createKansasCityPolygon();
    
    // Cleanup function
    return () => {
      if (!map) return;
      
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