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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface border-gray-700 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            Aircraft Details - {aircraft.callsign}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium mb-2 pb-1 border-b border-gray-700">Flight Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Call Sign</span>
                  <span className="font-mono">{aircraft.callsign}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Type</span>
                  <span>{aircraft.aircraftType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Origin</span>
                  <span>{aircraft.origin || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Destination</span>
                  <span>{aircraft.destination || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Route</span>
                  <span className="font-mono text-xs">{aircraft.origin ? `${aircraft.origin} → ${aircraft.destination}` : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 pb-1 border-b border-gray-700">Current Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Altitude</span>
                  <span className="font-mono">{formatAltitude(aircraft.altitude)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Speed</span>
                  <span className="font-mono">{formatSpeed(aircraft.speed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Heading</span>
                  <span className="font-mono">{formatHeading(aircraft.heading)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Climb/Descent</span>
                  <span className="font-mono">+0 ft/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Squawk</span>
                  <span className="font-mono">{aircraft.squawk || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 pb-1 border-b border-gray-700">Data Verification</h3>
              <div className="space-y-2">
                {dataSources.map(source => (
                  <div key={source.id} className="flex justify-between">
                    <span className="text-text-secondary">{source.name}</span>
                    <span className="flex items-center">
                      <span className={`status-indicator ${
                        aircraft.verifiedSources.includes(source.name as any) ? 'bg-success' : 'bg-danger'
                      } mr-1`}></span>
                      <span>
                        {aircraft.verifiedSources.includes(source.name as any) ? 'Verified' : 'Unverified'}
                      </span>
                    </span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-text-secondary">Status</span>
                  <span className={
                    aircraft.verificationStatus === 'verified' ? 'text-success font-medium' :
                    aircraft.verificationStatus === 'partially_verified' ? 'text-warning font-medium' :
                    'text-danger font-medium'
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
            <h3 className="font-medium mb-2 pb-1 border-b border-gray-700">Communication History</h3>
            <div className="h-40 overflow-y-auto custom-scrollbar bg-surface-light p-2 rounded text-sm">
              {communicationHistory.map((comm, index) => (
                <div key={index} className="mb-2">
                  <span className="text-text-secondary mr-2 text-xs">{comm.timestamp}</span>
                  <span className={`${comm.from === 'ATC' ? 'text-primary' : 'text-secondary'} font-medium mr-1`}>
                    {comm.from}:
                  </span>
                  <span>{comm.message}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex justify-between">
            <div>
              <button 
                onClick={() => {}} 
                className="px-4 py-2 bg-primary rounded font-medium"
              >
                <i className="material-icons align-bottom mr-1">message</i>
                Communicate
              </button>
              <button 
                className="px-4 py-2 bg-surface-light rounded font-medium ml-2"
              >
                <i className="material-icons align-bottom mr-1">timeline</i>
                Flight History
              </button>
            </div>
            <div>
              <button 
                onClick={() => onHandoff()}
                className="px-4 py-2 bg-warning text-black rounded font-medium"
              >
                <i className="material-icons align-bottom mr-1">priority_high</i>
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
