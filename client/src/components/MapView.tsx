import { useRef, useEffect, useState } from 'react';
import { Aircraft, DataSource, MapSettings, Restriction, Sector } from '@/types/aircraft';
import { useMapControls } from '@/hooks/useMapControls';
import { useQuery } from '@tanstack/react-query';
import MapControls from './MapControls';
import { detectCollisions, detectAirspaceViolations } from '@/lib/dataIntegration';

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
  const {
    mapContainer,
    mapSettings,
    updateMapSettings,
    updateAircraftMarkers,
    updateRestrictions,
    updateSectors,
    focusOnAircraft,
    resetMapView
  } = useMapControls();

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
  
  // Run periodic collision detection
  useEffect(() => {
    const checkCollisions = async () => {
      try {
        await detectCollisions();
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
  }, []);
  
  // Run periodic airspace violation detection
  useEffect(() => {
    const checkAirspaceViolations = async () => {
      try {
        await detectAirspaceViolations();
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
  }, []);

  // Update map markers whenever aircraft data changes
  useEffect(() => {
    if (aircraft.length > 0) {
      updateAircraftMarkers(aircraft);
    }
  }, [aircraft, updateAircraftMarkers]);
  
  // Update restrictions whenever they change
  useEffect(() => {
    if (restrictions.length > 0) {
      updateRestrictions(restrictions);
    }
  }, [restrictions, updateRestrictions]);
  
  // Update sectors whenever they change
  useEffect(() => {
    if (sectors.length > 0) {
      updateSectors(sectors);
    }
  }, [sectors, updateSectors]);
  
  // Focus on selected aircraft
  useEffect(() => {
    if (selectedAircraft) {
      focusOnAircraft(selectedAircraft);
    }
  }, [selectedAircraft, focusOnAircraft]);

  return (
    <section className="w-[65%] relative">
      <div ref={mapContainer} className="absolute inset-0 bg-surface-light">
        {/* Map container - Mapbox GL will render here */}
      </div>
      
      <MapControls 
        onZoomIn={() => {/* Implemented in useMapControls */}}
        onZoomOut={() => {/* Implemented in useMapControls */}}
        onResetView={resetMapView}
        onToggleLayers={() => {/* This will be handled by MapSettings dialog */}}
        settings={mapSettings}
        onUpdateSettings={updateMapSettings}
      />

      <div className="absolute left-4 top-4 bg-surface p-2 rounded shadow-md">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="status-indicator bg-success mr-1"></div>
            <span>Verified ({verificationCounts.verified})</span>
          </div>
          <div className="flex items-center">
            <div className="status-indicator bg-warning mr-1"></div>
            <span>Single Source ({verificationCounts.partiallyVerified})</span>
          </div>
          <div className="flex items-center">
            <div className="status-indicator bg-danger mr-1"></div>
            <span>Unverified ({verificationCounts.unverified})</span>
          </div>
        </div>
      </div>

      <div className="absolute left-4 bottom-4 bg-surface p-2 rounded shadow-md text-sm">
        <div className="flex items-center space-x-3">
          <div>Sector: ZOA35</div>
          <div>Aircraft: {aircraft.length}</div>
          <div>
            <span className={`inline-block w-2 h-2 rounded-full ${
              dataSources.every(ds => ds.status === 'online')
                ? 'bg-success'
                : dataSources.some(ds => ds.status === 'online')
                  ? 'bg-warning'
                  : 'bg-danger'
            } mr-1`}></span>
            <span>
              {dataSources.every(ds => ds.status === 'online')
                ? 'System Health OK'
                : 'System Degraded'}
            </span>
          </div>
        </div>
      </div>
      
      {selectedAircraft && (
        <div className="absolute left-1/2 bottom-5 transform -translate-x-1/2 bg-surface p-4 rounded shadow-lg w-96">
          <div className="flex justify-between mb-2">
            <h3 className="font-medium">{selectedAircraft.callsign} - {selectedAircraft.aircraftType}</h3>
            <div className="flex space-x-2">
              <button className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <i className="material-icons text-sm">message</i>
              </button>
              <button className="w-6 h-6 rounded bg-surface-light flex items-center justify-center">
                <i className="material-icons text-sm">info</i>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm mb-3">
            <div>
              <div className="text-text-secondary">Altitude</div>
              <div className="font-mono">{formatAltitude(selectedAircraft.altitude)}</div>
            </div>
            <div>
              <div className="text-text-secondary">Speed</div>
              <div className="font-mono">{formatSpeed(selectedAircraft.speed)}</div>
            </div>
            <div>
              <div className="text-text-secondary">Heading</div>
              <div className="font-mono">{formatHeading(selectedAircraft.heading)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-text-secondary">From</div>
              <div>{selectedAircraft.origin || 'N/A'}</div>
            </div>
            <div>
              <div className="text-text-secondary">To</div>
              <div>{selectedAircraft.destination || 'N/A'}</div>
            </div>
          </div>
          <div className="flex mt-2 space-x-2">
            <button className="px-3 py-1 bg-primary rounded text-sm flex items-center">
              <i className="material-icons text-sm mr-1">flight_takeoff</i> Hand Off
            </button>
            <button className="px-3 py-1 bg-surface-light rounded text-sm flex items-center">
              <i className="material-icons text-sm mr-1">alt_route</i> Reroute
            </button>
            <button className="px-3 py-1 bg-surface-light rounded text-sm flex items-center">
              <i className="material-icons text-sm mr-1">priority_high</i> Flag
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default MapView;
