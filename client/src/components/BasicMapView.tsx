import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Set the access token directly
mapboxgl.accessToken = "pk.eyJ1IjoibW1pbGVzMjAxMiIsImEiOiJjbWF4MWh2MnowbXhrMmtxODgyNTNpeW1vIn0.3_G3XkF_5nMb62FUZBvjTQ";

const BasicMapView = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // If map is already initialized or container isn't ready, do nothing
    if (mapRef.current || !mapContainerRef.current) return;
    
    console.log('Initializing map...');
    
    // Create a new map instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 4
    });
    
    // Save map reference
    mapRef.current = map;
    
    // Set up load event
    map.on('load', () => {
      console.log('Map loaded successfully!');
      setLoaded(true);
    });
    
    map.on('error', (e) => {
      console.error('Map error:', e);
    });
    
    // Cleanup function
    return () => {
      console.log('Cleaning up map...');
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-background border-b border-border">
        <h1 className="text-xl font-bold">Map Test</h1>
        <p className="text-sm text-muted-foreground">
          {loaded ? 'Map loaded successfully!' : 'Loading map...'}
        </p>
      </div>
      
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={mapContainerRef} 
          className="absolute inset-0"
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    </div>
  );
};

export default BasicMapView;