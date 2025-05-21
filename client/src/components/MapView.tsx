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
}

const MapView: React.FC<MapViewProps> = ({
  aircraft,
  selectedAircraft,
  onSelectAircraft,
  dataSources
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [showKansasCityView, setShowKansasCityView] = useState(true);
  
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    showGrid: true,
    showRestrictions: true,
    showSectors: true,
    showVerifiedOnly: false,
    showLabels: true,
    showFlightPaths: true
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

  // Update markers when aircraft data changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || aircraft.length === 0) return;
    
    console.log('Updating aircraft markers');
    
    // Remove existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());
    
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
      
      // Create popup with basic info
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'aircraft-popup'
      }).setHTML(`
        <div class="px-2 py-1 text-xs font-medium">
          <div class="font-bold">${a.callsign}</div>
          <div>${a.aircraftType}</div>
          <div>${formatAltitude(a.altitude)}</div>
        </div>
      `);
      
      // Add marker to map
      new mapboxgl.Marker(el)
        .setLngLat([a.longitude, a.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);
        
      // Add click handler to select aircraft
      el.addEventListener('click', () => {
        onSelectAircraft(a);
      });
    });
  }, [aircraft, mapLoaded, onSelectAircraft]);
  
  // Focus on selected aircraft
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !selectedAircraft) return;
    
    mapRef.current.flyTo({
      center: [selectedAircraft.longitude, selectedAircraft.latitude],
      zoom: 9,
      speed: 1.5,
      curve: 1.5,
      essential: true
    });
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
            facilityId="ZKC" 
            showKansasCityView={showKansasCityView}
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
        
        <div className="absolute right-4 top-4 flex items-center space-x-2">
          <button
            onClick={() => setShowKansasCityView(!showKansasCityView)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              showKansasCityView 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            {showKansasCityView ? 'Kansas City View' : 'Show Kansas City'}
          </button>
        </div>

        <div className="absolute left-4 top-4 bg-background/90 dark:bg-card/90 p-2 rounded-lg shadow-md border border-border">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-[hsl(var(--verified))] mr-1.5"></span>
              <span>Verified: {verificationCounts.verified}</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-[hsl(var(--partially-verified))] mr-1.5"></span>
              <span>Partial: {verificationCounts.partiallyVerified}</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-[hsl(var(--unverified))] mr-1.5"></span>
              <span>Unverified: {verificationCounts.unverified}</span>
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
              <span className="font-medium">Sector: {showKansasCityView ? 'ZKC' : 'ZOA35'}</span>
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
        
        {selectedAircraft && (
          <div className="absolute left-1/2 bottom-5 transform -translate-x-1/2 bg-background/95 dark:bg-card/95 p-4 rounded-lg shadow-lg max-w-md border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                {selectedAircraft.needsAssistance ? (
                  <span className="flex h-3 w-3 pulse">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                  </span>
                ) : (
                  <span className={`flex h-3 w-3 rounded-full ${
                    selectedAircraft.verificationStatus === 'verified' 
                      ? 'bg-[hsl(var(--verified))]' 
                      : selectedAircraft.verificationStatus === 'partially_verified' 
                        ? 'bg-[hsl(var(--partially-verified))]' 
                        : 'bg-[hsl(var(--unverified))]'
                  }`}></span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{selectedAircraft.callsign}</h3>
                <div className="text-xs text-muted-foreground">{selectedAircraft.aircraftType}</div>
              </div>
              <div className="ml-auto">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  selectedAircraft.verificationStatus === 'verified' 
                    ? 'bg-[hsl(var(--verified))]' 
                    : selectedAircraft.verificationStatus === 'partially_verified' 
                      ? 'bg-[hsl(var(--partially-verified))]' 
                      : 'bg-[hsl(var(--unverified))]'
                } text-white`}>
                  {selectedAircraft.verificationStatus === 'verified' 
                    ? 'Verified' 
                    : selectedAircraft.verificationStatus === 'partially_verified' 
                      ? 'Partial' 
                      : 'Unverified'
                  }
                </span>
              </div>
              <div className="flex gap-1">
                <button className="w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
                <button className="w-7 h-7 rounded-full bg-secondary hover:bg-accent/50 flex items-center justify-center transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-muted/50 rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">Altitude</div>
                <div className="font-mono font-medium">{formatAltitude(selectedAircraft.altitude)}</div>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">Speed</div>
                <div className="font-mono font-medium">{formatSpeed(selectedAircraft.speed)}</div>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">Heading</div>
                <div className="font-mono font-medium">{formatHeading(selectedAircraft.heading)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">From</div>
                <div className="truncate">{selectedAircraft.origin || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">To</div>
                <div className="truncate">{selectedAircraft.destination || 'N/A'}</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center justify-center hover:bg-primary/90 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 9l14-5 -5 14-3-8z"/>
                </svg>
                Hand Off
              </button>
              <button className="flex-1 px-3 py-1.5 bg-secondary hover:bg-accent/50 rounded-md text-sm font-medium flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Reroute
              </button>
            </div>
          </div>
        )}
      </section>
    </MapContext.Provider>
  );
};

export default MapView;