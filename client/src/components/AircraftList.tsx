import { useState } from 'react';
import { Aircraft, AircraftFilters } from '@/types/aircraft';
import { formatAltitude, formatHeading, formatSpeed } from '@/lib/mapUtils';

interface AircraftListProps {
  aircraft: Aircraft[];
  isLoading: boolean;
  selectedAircraftId: number | undefined;
  onSelectAircraft: (aircraft: Aircraft) => void;
  filters: AircraftFilters;
  onUpdateFilters: (filters: Partial<AircraftFilters>) => void;
}

const AircraftList: React.FC<AircraftListProps> = ({
  aircraft,
  isLoading,
  selectedAircraftId,
  onSelectAircraft,
  filters,
  onUpdateFilters
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onUpdateFilters({ searchTerm: e.target.value });
  };

  // Handle filter button click
  const handleFilterClick = (status: string) => {
    onUpdateFilters({ 
      verificationStatus: status === 'all' ? 'all' : status as any
    });
  };

  return (
    <section className="w-1/5 border-r border-gray-800 flex flex-col bg-background">
      <div className="p-3 bg-surface border-b border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">Aircraft ({aircraft.length})</h2>
          <button className="text-sm px-2 py-1 bg-surface-light rounded hover:bg-opacity-80">
            <i className="material-icons text-sm align-text-top">filter_list</i> Filter
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search aircraft..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full bg-surface-light rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <i className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-text-secondary">search</i>
        </div>
      </div>
      
      <div className="flex space-x-1 px-3 py-2 bg-surface-light text-sm border-b border-gray-800">
        <button 
          className={`px-2 py-1 rounded ${filters.verificationStatus === 'all' ? 'bg-primary text-white' : 'hover:bg-surface'}`}
          onClick={() => handleFilterClick('all')}
        >
          All
        </button>
        <button 
          className={`px-2 py-1 rounded ${filters.verificationStatus === 'verified' ? 'bg-primary text-white' : 'hover:bg-surface'}`}
          onClick={() => handleFilterClick('verified')}
        >
          Verified
        </button>
        <button 
          className={`px-2 py-1 rounded ${filters.verificationStatus === 'unverified' ? 'bg-primary text-white' : 'hover:bg-surface'}`}
          onClick={() => handleFilterClick('unverified')}
        >
          Unverified
        </button>
        <button 
          className={`px-2 py-1 rounded ${filters.needsAssistance ? 'bg-primary text-white' : 'hover:bg-surface'}`}
          onClick={() => onUpdateFilters({ needsAssistance: !filters.needsAssistance })}
        >
          Alerts
        </button>
      </div>
      
      <div className="overflow-y-auto custom-scrollbar flex-grow">
        {isLoading ? (
          <div className="p-4 text-center text-text-secondary">Loading aircraft data...</div>
        ) : aircraft.length === 0 ? (
          <div className="p-4 text-center text-text-secondary">
            No aircraft match the current filters
          </div>
        ) : (
          aircraft.map((aircraft) => (
            <div
              key={aircraft.id}
              className={`aircraft-item p-3 border-b border-gray-700 hover:cursor-pointer ${
                selectedAircraftId === aircraft.id ? 'bg-surface-light' : ''
              }`}
              onClick={() => onSelectAircraft(aircraft)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div 
                    className={`status-indicator mr-2 ${
                      aircraft.verificationStatus === 'verified' 
                        ? 'bg-success' 
                        : aircraft.verificationStatus === 'partially_verified' 
                          ? 'bg-warning' 
                          : 'bg-danger'
                    } ${aircraft.needsAssistance ? 'animate-pulse' : ''}`}
                  ></div>
                  <span className="font-mono font-medium">{aircraft.callsign}</span>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary">{aircraft.aircraftType}</span>
              </div>
              <div className="text-sm text-text-secondary flex justify-between">
                <span>{formatAltitude(aircraft.altitude)}</span>
                <span>HDG {formatHeading(aircraft.heading)}</span>
                <span>{formatSpeed(aircraft.speed)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default AircraftList;
