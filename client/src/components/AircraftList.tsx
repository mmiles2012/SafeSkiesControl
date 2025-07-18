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
  aircraft = [],
  isLoading = false,
  selectedAircraftId,
  onSelectAircraft,
  filters = { showFilters: false, searchTerm: '', verificationStatus: 'all', needsAssistance: false },
  onUpdateFilters = () => {}
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

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    let sortBy: AircraftFilters['sortBy'] = undefined;
    let sortOrder: AircraftFilters['sortOrder'] = 'asc';
    if (value === 'proximity' || value === 'altitude' || value === 'destination' || value === 'origin' || value === 'latitude' || value === 'longitude') {
      sortBy = value as AircraftFilters['sortBy'];
    }
    // Default: ascending, but allow user to select descending in future
    onUpdateFilters({ sortBy, sortOrder });
  };

  // Create a safe copy of the aircraft array with additional validation
  const safeAircraft = Array.isArray(aircraft) ? aircraft.filter(a => 
    a && typeof a === 'object' && 'id' in a && 'callsign' in a
  ) : [];
  
  return (
    <section className="flex flex-col w-full h-full overflow-hidden">
      <div className="panel-header">
        <h2 className="panel-title">Aircraft ({safeAircraft.length})</h2>
        <button 
          className="flex items-center text-sm px-2 py-1 bg-secondary rounded hover:bg-muted transition-colors"
          onClick={() => onUpdateFilters({ showFilters: !filters.showFilters })}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span>Filter</span>
        </button>
      </div>

      <div className="p-3 border-b border-border">
        <div className="relative">
          <input
            type="text"
            placeholder="Search aircraft..."
            value={searchTerm}
            onChange={handleSearch}
            className="form-input w-full"
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 p-3 border-b border-border bg-muted text-sm">
        <button 
          className={`px-2 py-1 rounded-md transition-colors ${filters.verificationStatus === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}
          onClick={() => handleFilterClick('all')}
        >
          All
        </button>
        <button 
          className={`px-2 py-1 rounded-md transition-colors ${filters.verificationStatus === 'verified' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}
          onClick={() => handleFilterClick('verified')}
        >
          Verified
        </button>
        <button 
          className={`px-2 py-1 rounded-md transition-colors ${filters.verificationStatus === 'unverified' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}
          onClick={() => handleFilterClick('unverified')}
        >
          Unverified
        </button>
        <button 
          className={`px-2 py-1 rounded-md transition-colors ${filters.needsAssistance ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}
          onClick={() => onUpdateFilters({ needsAssistance: !filters.needsAssistance })}
        >
          Alerts
        </button>
        <select
          className="ml-auto px-2 py-1 rounded-md border border-border bg-background text-sm"
          value={filters.sortBy || ''}
          onChange={handleSortChange}
        >
          <option value="">Sort by...</option>
          <option value="proximity">Proximity</option>
          <option value="altitude">Altitude</option>
          <option value="destination">Destination</option>
          <option value="origin">Origin</option>
          <option value="latitude">Latitude (N-S)</option>
          <option value="longitude">Longitude (E-W)</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar scrollbar-w-2 scrollbar-thumb-rounded-lg scrollbar-thumb-accent scrollbar-track-muted/20">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            <svg className="animate-spin h-5 w-5 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading aircraft data...
          </div>
        ) : safeAircraft.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No aircraft match the current filters
          </div>
        ) : (
          safeAircraft.map((aircraft) => (
            <div
              key={aircraft.id}
              className={`aircraft-item ${selectedAircraftId === aircraft.id ? 'selected' : ''}`}
              onClick={() => onSelectAircraft(aircraft)}
            >
              <div className="flex items-center space-x-2">
                <div>
                  {aircraft.needsAssistance ? (
                    <span className="flex h-2.5 w-2.5 pulse">
                      <span className="animate-ping absolute h-2.5 w-2.5 rounded-full bg-destructive opacity-75"></span>
                      <span className="relative rounded-full h-2.5 w-2.5 bg-destructive"></span>
                    </span>
                  ) : (
                    <span className={`flex h-2.5 w-2.5 rounded-full ${
                      aircraft.verificationStatus === 'verified' 
                        ? 'bg-[hsl(var(--verified))]' 
                        : aircraft.verificationStatus === 'partially_verified' 
                          ? 'bg-[hsl(var(--partially-verified))]' 
                          : 'bg-[hsl(var(--unverified))]'
                    }`}></span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium">{aircraft.callsign}</span>
                    <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-primary/10 text-primary">{aircraft.aircraftType}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs mt-2">
                    <div className="px-1.5 py-1 rounded-md bg-muted/50 flex justify-between items-center">
                      <span className="text-muted-foreground">ALT</span>
                      <span className="font-mono font-medium">{formatAltitude(aircraft.altitude)}</span>
                    </div>
                    <div className="px-1.5 py-1 rounded-md bg-muted/50 flex justify-between items-center">
                      <span className="text-muted-foreground">HDG</span>
                      <span className="font-mono font-medium">{formatHeading(aircraft.heading)}</span>
                    </div>
                    <div className="px-1.5 py-1 rounded-md bg-muted/50 flex justify-between items-center">
                      <span className="text-muted-foreground">SPD</span>
                      <span className="font-mono font-medium">{formatSpeed(aircraft.speed)}</span>
                    </div>
                    <div className="col-span-2 px-1.5 py-1 rounded-md bg-muted/50 flex justify-between items-center">
                      <span className="text-muted-foreground">PLAN</span>
                      <span className="font-mono font-medium text-primary">IFR</span>
                    </div>
                    {aircraft && aircraft.destination && (
                      <div className="px-1.5 py-1 rounded-md bg-muted/50 flex justify-between items-center">
                        <span className="text-muted-foreground">DEST</span>
                        <span className="font-mono">{typeof aircraft.destination === 'string' ? aircraft.destination : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default AircraftList;