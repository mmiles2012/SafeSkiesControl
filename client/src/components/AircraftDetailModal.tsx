import { useState } from 'react';
import { Aircraft, DataSource } from '@/types/aircraft';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatAltitude, formatHeading, formatSpeed } from '@/lib/mapUtils';

interface AircraftDetailModalProps {
  aircraft: Aircraft;
  isOpen: boolean;
  onClose: () => void;
  dataSources: DataSource[];
  onHandoff: () => void;
}

const AircraftDetailModal: React.FC<AircraftDetailModalProps> = ({
  aircraft,
  isOpen,
  onClose,
  dataSources,
  onHandoff
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'communications'>('details');

  // Communication history (mocked for display)
  const communicationHistory = [
    {
      timestamp: '10:42:15',
      from: 'ATC',
      message: `${aircraft.callsign}, descend and maintain flight level 350`
    },
    {
      timestamp: '10:42:22',
      from: aircraft.callsign,
      message: `Descend to flight level 350, ${aircraft.callsign}`
    },
    {
      timestamp: '10:40:05',
      from: 'ATC',
      message: `${aircraft.callsign}, contact Denver Center on 134.55`
    },
    {
      timestamp: '10:40:11',
      from: aircraft.callsign,
      message: `Contact Denver Center 134.55, ${aircraft.callsign}`
    },
  ];

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          // Force remove any remaining popups when modal closes
          document.querySelectorAll('.mapboxgl-popup').forEach(p => p.remove());
          onClose();
        }
      }}
    >
      <DialogContent 
        className="bg-background border-border max-w-3xl" 
        aria-describedby="aircraft-details-description"
        onEscapeKeyDown={() => {
          // Force remove any remaining popups when Esc is pressed
          document.querySelectorAll('.mapboxgl-popup').forEach(p => p.remove());
        }}
        onPointerDownOutside={() => {
          // Force remove any remaining popups when clicking outside
          document.querySelectorAll('.mapboxgl-popup').forEach(p => p.remove());
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            Aircraft Details - {aircraft.callsign}
          </DialogTitle>
        </DialogHeader>
        <p id="aircraft-details-description" className="sr-only">
          Aircraft details including flight information, current status, and data verification
        </p>
        
        <div className="p-4">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium mb-2 pb-1 border-b border-border">Flight Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Call Sign</span>
                  <span className="font-mono">{aircraft.callsign}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{aircraft.aircraftType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Origin</span>
                  <span>{aircraft.origin || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination</span>
                  <span>{aircraft.destination || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Route</span>
                  <span className="font-mono text-xs">{aircraft.origin ? `${aircraft.origin} → ${aircraft.destination}` : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 pb-1 border-b border-border">Current Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Altitude</span>
                  <span className="font-mono">{formatAltitude(aircraft.altitude)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speed</span>
                  <span className="font-mono">{formatSpeed(aircraft.speed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heading</span>
                  <span className="font-mono">{formatHeading(aircraft.heading)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Climb/Descent</span>
                  <span className="font-mono">+0 ft/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Squawk</span>
                  <span className="font-mono">{aircraft.squawk || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 pb-1 border-b border-border">Data Verification</h3>
              <div className="space-y-2">
                {dataSources.map(source => (
                  <div key={source.id} className="flex justify-between">
                    <span className="text-muted-foreground">{source.name}</span>
                    <span className="flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        aircraft.verifiedSources?.includes(source.name as any) 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}></span>
                      <span>
                        {aircraft.verifiedSources?.includes(source.name as any) ? 'Verified' : 'Unverified'}
                      </span>
                    </span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={
                    aircraft.verificationStatus === 'verified' ? 'text-green-500 font-medium' :
                    aircraft.verificationStatus === 'partially_verified' ? 'text-amber-500 font-medium' :
                    'text-red-500 font-medium'
                  }>
                    {aircraft.verificationStatus === 'verified' ? 'Verified' :
                     aircraft.verificationStatus === 'partially_verified' ? 'Partially Verified' :
                     'Unverified'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2 pb-1 border-b border-border">Communication History</h3>
            <div className="h-40 overflow-y-auto bg-secondary/10 p-3 rounded-md text-sm">
              {communicationHistory.map((comm, index) => (
                <div key={index} className="mb-2">
                  <span className="text-muted-foreground mr-2 text-xs">{comm.timestamp}</span>
                  <span className={`${comm.from === 'ATC' ? 'text-primary' : 'text-secondary'} font-medium mr-1`}>
                    {comm.from}:
                  </span>
                  <span>{comm.message}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3 justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => {}} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium flex items-center hover:bg-primary/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Communicate
              </button>
              <button 
                className="px-4 py-2 bg-accent text-accent-foreground border border-border rounded-md font-medium flex items-center hover:bg-accent/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
                Flight History
              </button>
            </div>
            <div>
              <button 
                onClick={() => onHandoff()}
                className="px-4 py-2 bg-warning text-warning-foreground rounded-md font-medium flex items-center hover:bg-warning/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Hand off Aircraft
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AircraftDetailModal;
