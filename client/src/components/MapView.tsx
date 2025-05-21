import { useRef, useEffect, useState } from 'react';
import { Aircraft, DataSource, MapSettings, Restriction, Sector } from '@/types/aircraft';
import { useQuery } from '@tanstack/react-query';
import MapControls from './MapControls';
import { detectCollisions, detectAirspaceViolations } from '@/lib/dataIntegration';
import mapboxgl from 'mapbox-gl';
import { formatAltitude, formatSpeed, formatHeading } from '@/lib/mapUtils';
import { MapContext } from '../hooks/useMapContext';
import BoundaryLayer from './BoundaryLayer';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize Mapbox with token directly for reliability
mapboxgl.accessToken = "pk.eyJ1IjoibW1pbGVzMjAxMiIsImEiOiJjbWF4MWh2MnowbXhrMmtxODgyNTNpeW1vIn0.3_G3XkF_5nMb62FUZBvjTQ";

interface MapViewProps {
  aircraft: Aircraft[];
  selectedAircraft: Aircraft | null;
  onSelectAircraft: (aircraft: Aircraft) => void;
  dataSources: DataSource[];
  onARTCCChange?: (artccId: string) => void;
}

const MapView: React.FC<MapViewProps> = ({
  aircraft,
  selectedAircraft,
  onSelectAircraft,
  dataSources,
  onARTCCChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [detailedView, setDetailedView] = useState(true);
  // Sync the ARTCC selection with props
  const [selectedARTCC, setSelectedARTCC] = useState("ZKC"); // Default to Kansas City ARTCC
  
  // Available ARTCC centers
  const artccOptions = [
    { id: "ZKC", name: "Kansas City" },
    { id: "ZDV", name: "Denver" },
    { id: "ZOA", name: "Oakland" },
    { id: "ZNY", name: "New York" },
    { id: "ZMA", name: "Miami" }
  ];
  
  // No need for this effect - we'll handle ARTCC changes in the dropdown
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    showGrid: true,
    showRestrictions: true,
    showSectors: true,
    showVerifiedOnly: false,
    showLabels: true,
    showFlightPaths: true,
    showNOTAMs: true
  });

  // Fetch restrictions
  const { data: restrictions = [] } = useQuery<Restriction[]>({
    queryKey: ['/api/restrictions'],
    refetchInterval: 60000,
  });
  
  // Fetch sectors
  const { data: sectors = [] } = useQuery<Sector[]>({
    queryKey: ['/api/sectors'],
    refetchInterval: 60000,
  });
  
  // Get verification status counts
  const verificationCounts = {
    verified: aircraft.filter(a => a.verificationStatus === 'verified').length,
    partiallyVerified: aircraft.filter(a => a.verificationStatus === 'partially_verified').length,
    unverified: aircraft.filter(a => a.verificationStatus === 'unverified').length,
  };

  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Initialize map only once
    if (!mapRef.current) {
      console.log('Initializing map...');
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/navigation-day-v1',
        center: [-98.5795, 39.8283], // Center of US
        zoom: 4,
        attributionControl: false
      });
      
      map.on('load', () => {
        console.log('Map loaded successfully!');
        setMapLoaded(true);
        mapRef.current = map;
        setMapInstance(map);
      });
      
      map.on('error', (e) => {
        console.error('Map error:', e);
      });
    }
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Run periodic collision detection
  useEffect(() => {
    const checkCollisions = async () => {
      try {
        if (aircraft.length > 0) {
          await detectCollisions(aircraft);
        }
      } catch (error) {
        console.error('Error detecting collisions:', error);
      }
    };
    
    // Check for collisions every 10 seconds
    const collisionInterval = setInterval(checkCollisions, 10000);
    
    // Initial check
    checkCollisions();
    
    return () => {
      clearInterval(collisionInterval);
    };
  }, [aircraft]);
  
  // Run periodic airspace violation detection
  useEffect(() => {
    const checkAirspaceViolations = async () => {
      try {
        if (aircraft.length > 0) {
          await detectAirspaceViolations(aircraft);
        }
      } catch (error) {
        console.error('Error detecting airspace violations:', error);
      }
    };
    
    // Check for airspace violations every 15 seconds
    const violationInterval = setInterval(checkAirspaceViolations, 15000);
    
    // Initial check
    checkAirspaceViolations();
    
    return () => {
      clearInterval(violationInterval);
    };
  }, [aircraft]);

  // Track markers for proper cleanup
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);
  
  // Update markers when aircraft data changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || aircraft.length === 0) return;
    
    console.log('Updating aircraft markers');
    
    // Remove existing markers and popups properly
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    }
    
    if (popupsRef.current.length > 0) {
      popupsRef.current.forEach(popup => popup.remove());
      popupsRef.current = [];
    }
    
    // Clean up any remaining popups that might be stuck
    document.querySelectorAll('.mapboxgl-popup').forEach(popup => popup.remove());
    
    // Add new markers
    aircraft.forEach(a => {
      const el = document.createElement('div');
      el.className = 'aircraft-marker';
      el.style.transform = `rotate(${a.heading}deg)`;
      
      // Set color based on verification status
      if (a.verificationStatus === 'verified') {
        el.style.backgroundColor = 'hsl(var(--verified))';
      } else if (a.verificationStatus === 'partially_verified') {
        el.style.backgroundColor = 'hsl(var(--partially-verified))';
      } else {
        el.style.backgroundColor = 'hsl(var(--unverified))';
      }
      
      // Add pulsing effect for aircraft needing assistance
      if (a.needsAssistance) {
        el.classList.add('pulse');
      }
      
      // Add marker to map without popup, with validation to prevent Invalid LngLat errors
      try {
        // Validate coordinates before creating marker
        if (typeof a.longitude === 'number' && !isNaN(a.longitude) && 
            typeof a.latitude === 'number' && !isNaN(a.latitude)) {
          const marker = new mapboxgl.Marker(el)
            .setLngLat([a.longitude, a.latitude])
            .addTo(mapRef.current!);
            
          // Track the marker for cleanup 
          markersRef.current.push(marker);
        } else {
          console.warn(`Invalid coordinates for aircraft ${a.callsign}:`, a.longitude, a.latitude);
          return; // Skip the rest for this invalid aircraft
        }
      } catch (error) {
        console.error(`Error adding marker for ${a.callsign}:`, error);
        return; // Skip rest of processing for this aircraft
      }
      
      // Only attach the event listeners if we have valid coordinates
      try {
        if (typeof a.longitude === 'number' && !isNaN(a.longitude) && 
            typeof a.latitude === 'number' && !isNaN(a.latitude)) {
            
          // Handle hover events manually for better control
          el.addEventListener('mouseenter', () => {
            // Only show popup if no aircraft is selected to prevent dual display
            if (!selectedAircraft) {
              try {
                // Remove any existing popups first
                document.querySelectorAll('.mapboxgl-popup').forEach(p => p.remove());
                
                // Create and show popup only on hover
                const hoverPopup = new mapboxgl.Popup({
                  closeButton: false,
                  closeOnClick: true,
                  className: 'aircraft-popup',
                  offset: 25,
                  // Add max-width to prevent overflow
                  maxWidth: '220px'
                })
                .setLngLat([a.longitude, a.latitude])
                .setHTML(`
                  <div class="px-2 py-1 text-xs font-medium">
                    <div class="font-bold">${a.callsign}</div>
                    <div>${a.aircraftType}</div>
                    <div>${formatAltitude(a.altitude)}</div>
                  </div>
                `)
                .addTo(mapRef.current!);
                
                // Store reference to this popup
                popupsRef.current.push(hoverPopup);
              } catch (error) {
                console.error('Error showing aircraft popup:', error);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error setting up hover events for aircraft:', error);
      }
      
      // Only add these event listeners if we're working with valid coordinates
      try {
        if (typeof a.longitude === 'number' && !isNaN(a.longitude) && 
            typeof a.latitude === 'number' && !isNaN(a.latitude)) {
            
          // Remove popup when mouse leaves marker
          el.addEventListener('mouseleave', () => {
            // Delay the removal slightly to allow clicking
            setTimeout(() => {
              try {
                const popups = document.querySelectorAll('.mapboxgl-popup');
                if (popups.length > 0) {
                  popups.forEach(p => {
                    // Only remove if not being interacted with
                    if (!p.matches(':hover')) {
                      p.remove();
                    }
                  });
                }
              } catch (error) {
                console.error('Error in mouseleave handler:', error);
              }
            }, 100);
          });
          
          // Marker is already added to tracking array above
          
          // Add click handler to select aircraft
          el.addEventListener('click', () => {
            onSelectAircraft(a);
          });
        }
      } catch (error) {
        console.error('Error setting up mouseleave/click events:', error);
      }
    });
  }, [aircraft, mapLoaded, onSelectAircraft]);
  
  // Focus on selected aircraft
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    // Clean up all popups when aircraft is selected 
    // to avoid showing both the popup and the modal
    if (selectedAircraft) {
      // Clear all popups immediately when selecting an aircraft
      document.querySelectorAll('.mapboxgl-popup').forEach(p => p.remove());
      
      mapRef.current.flyTo({
        center: [selectedAircraft.longitude, selectedAircraft.latitude],
        zoom: 9,
        speed: 1.5,
        curve: 1.5,
        essential: true
      });
    }
  }, [selectedAircraft, mapLoaded]);

  return (
    <MapContext.Provider value={{ map: mapInstance, setMap: setMapInstance }}>
      <section className="w-full h-full relative">
        <div 
          ref={mapContainerRef} 
          className="absolute inset-0 bg-muted/50 rounded-lg overflow-hidden"
          style={{ width: '100%', height: '100%' }}
        ></div>
        
        {mapLoaded && mapInstance && (
          <BoundaryLayer 
            facilityId={selectedARTCC} 
            showKansasCityView={detailedView}
            visible={true}
          />
        )}
        
        <MapControls 
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onResetView={() => {
            mapRef.current?.flyTo({
              center: [-98.5795, 39.8283],
              zoom: 4,
              speed: 1.5
            });
          }}
          onToggleLayers={() => {/* Toggle layers will be implemented later */}}
          settings={mapSettings}
          onUpdateSettings={(settings) => setMapSettings(prevSettings => ({...prevSettings, ...settings}))}
        />
        
        <div className="absolute right-4 top-4 flex items-center space-x-2 z-10">
          <div className="bg-background/90 dark:bg-card/90 p-1.5 rounded-lg shadow-md border border-border">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium mr-2">ARTCC Zone:</span>
                <select 
                  value={selectedARTCC}
                  onChange={(e) => {
                    const newARTCC = e.target.value;
                    setSelectedARTCC(newARTCC);
                    // When changing ARTCC, update the boundary layer
                    // Notify parent component about ARTCC change
                    if (onARTCCChange) {
                      onARTCCChange(newARTCC);
                    }
                  }}
                  className="text-xs bg-muted px-2 py-1 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {artccOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.id} - {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setDetailedView(!detailedView)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md w-full ${
                  detailedView 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {detailedView ? 'Show Detailed View' : 'Show Overview'}
              </button>
            </div>
          </div>
        </div>

        <div className="absolute left-4 top-20 bg-background/90 dark:bg-card/90 p-2 rounded-lg shadow-md border border-border">
          <div className="flex flex-col space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center px-2 py-1 rounded-md bg-muted/50">
                <span className="inline-block w-3 h-3 rounded-full bg-[hsl(var(--verified))] mr-1.5"></span>
                <span>Verified: {verificationCounts.verified}</span>
              </div>
              <div className="flex items-center px-2 py-1 rounded-md bg-muted/50">
                <span className="inline-block w-3 h-3 rounded-full bg-[hsl(var(--partially-verified))] mr-1.5"></span>
                <span>Partial: {verificationCounts.partiallyVerified}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center px-2 py-1 rounded-md bg-muted/50">
                <span className="inline-block w-3 h-3 rounded-full bg-[hsl(var(--unverified))] mr-1.5"></span>
                <span>Unverified: {verificationCounts.unverified}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-4 bottom-4 bg-background/90 dark:bg-card/90 px-3 py-2 rounded-lg shadow-md border border-border z-10">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span className="font-medium">Sector: {selectedARTCC}</span>
            </div>
            
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>Aircraft: <span className="font-medium">{aircraft.length}</span></span>
            </div>
            
            <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              dataSources.every(ds => ds.status === 'online')
                ? 'bg-[hsl(var(--verified))/15] text-[hsl(var(--verified))]'
                : dataSources.some(ds => ds.status === 'online')
                  ? 'bg-[hsl(var(--partially-verified))/15] text-[hsl(var(--partially-verified))]'
                  : 'bg-[hsl(var(--unverified))/15] text-[hsl(var(--unverified))]'
            }`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                dataSources.every(ds => ds.status === 'online')
                  ? 'bg-[hsl(var(--verified))]'
                  : dataSources.some(ds => ds.status === 'online')
                    ? 'bg-[hsl(var(--partially-verified))]'
                    : 'bg-[hsl(var(--unverified))]'
              }`}></span>
              <span>
                {dataSources.every(ds => ds.status === 'online')
                  ? 'System Health: Optimal'
                  : dataSources.some(ds => ds.status === 'online')
                    ? 'System Health: Degraded'
                    : 'System Health: Offline'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Commented out the aircraft info popup that appears at the bottom of the map
          This popup was causing issues by remaining visible after closing the main detail modal */}
      </section>
    </MapContext.Provider>
  );
};

export default MapView;