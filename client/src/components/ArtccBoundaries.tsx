import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useMapContext } from '../hooks/useMapContext';
import { mapboxgl } from '../types/mapbox';

interface BoundaryProps {
  facilityId?: string;
  showKansasCityView?: boolean;
}

const ArtccBoundaries: React.FC<BoundaryProps> = ({ 
  facilityId = 'ZKC', 
  showKansasCityView = false 
}) => {
  const { map } = useMapContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!map) return;
    
    const fetchAndDisplayBoundaries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determine which endpoint to use based on props
        const endpoint = showKansasCityView 
          ? '/api/boundaries/kansas-city' 
          : `/api/boundaries/${facilityId}`;
        
        const response = await axios.get(endpoint);
        const data = response.data;
        
        // Handle both formats (plain GeoJSON or structured response with metadata)
        const geoJSON = data.kcBoundary || data;
        
        // Check if the layer already exists, remove it if it does
        if (map.getLayer('artcc-boundaries')) {
          map.removeLayer('artcc-boundaries');
        }
        
        if (map.getSource('artcc-boundaries')) {
          map.removeSource('artcc-boundaries');
        }
        
        // Add the GeoJSON as a source
        map.addSource('artcc-boundaries', {
          type: 'geojson',
          data: geoJSON
        });
        
        // First, create a style for the base map that has a grayed-out look
        if (showKansasCityView) {
          // Apply a semi-transparent gray overlay to the entire map
          if (!map.getLayer('global-gray-overlay')) {
            map.addLayer({
              id: 'global-gray-overlay',
              type: 'background',
              paint: {
                'background-color': 'rgba(200, 200, 200, 0.6)'
              }
            });
          }
        }
        
        // Add the ARTCC boundary with a light fill
        map.addLayer({
          id: 'artcc-boundaries-fill',
          type: 'fill',
          source: 'artcc-boundaries',
          layout: {},
          paint: {
            'fill-color': '#ffffff', // White fill for the boundary area
            'fill-opacity': showKansasCityView ? 0.9 : 0.2 // More opaque when KC view to "clear" the gray overlay
          }
        });
        
        // Add a distinct border to make the boundary visible
        map.addLayer({
          id: 'artcc-boundaries-outline',
          type: 'line',
          source: 'artcc-boundaries',
          layout: {},
          paint: {
            'line-color': '#ff9900', // Orange outline for visibility
            'line-width': 3,
            'line-opacity': 1
          }
        });
        
        // Add the line layer to display the boundaries
        map.addLayer({
          id: 'artcc-boundaries',
          type: 'line',
          source: 'artcc-boundaries',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#ff9900',
            'line-width': 3,
            'line-opacity': 1
          }
        });
        
        // If it's Kansas City view, adjust the map view to focus on Kansas City
        if (showKansasCityView) {
          // Kansas City Airport coordinates (MCI)
          map.flyTo({
            center: [-94.7131, 39.2974] as [number, number],
            zoom: 7,
            essential: true
          });
        }
        
      } catch (err) {
        console.error('Error fetching ARTCC boundaries:', err);
        setError('Failed to load ARTCC boundaries data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndDisplayBoundaries();
    
    // Cleanup function to remove all layers when component unmounts
    return () => {
      if (map) {
        // Remove all the layers we added
        const layersToRemove = [
          'artcc-boundaries',
          'artcc-boundaries-fill',
          'artcc-boundaries-outline',
          'global-gray-overlay'
        ];
        
        for (const layer of layersToRemove) {
          if (map.getLayer(layer)) {
            map.removeLayer(layer);
          }
        }
        
        // Remove the source
        if (map.getSource('artcc-boundaries')) {
          map.removeSource('artcc-boundaries');
        }
      }
    };
  }, [map, facilityId, showKansasCityView]);
  
  return (
    <div className="artcc-boundaries-component">
      {loading && <div className="loading">Loading ARTCC boundaries...</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ArtccBoundaries;