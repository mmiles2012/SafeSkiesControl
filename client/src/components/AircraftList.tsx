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
    <section className="flex-col-fixed w-full h-full">
      <div className="panel-header">
        <h2 className="panel-title">Aircraft ({aircraft.length})</h2>
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
      </div>
      
      <div className="scrollable-content">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            <svg className="animate-spin h-5 w-5 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading aircraft data...
          </div>
        ) : aircraft.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No aircraft match the current filters
          </div>
        ) : (
          aircraft.map((aircraft) => (
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
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                    <div className="flex justify-between">
                      <span>ALT</span>
                      <span className="font-mono">{formatAltitude(aircraft.altitude)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HDG</span>
                      <span className="font-mono">{formatHeading(aircraft.heading)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SPD</span>
                      <span className="font-mono">{formatSpeed(aircraft.speed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PLAN</span>
                      <span className={`font-mono ${aircraft.flightPlan === 'IFR' ? 'text-primary' : 'text-accent'}`}>
                        {aircraft.flightPlan}
                      </span>
                    </div>
                    {aircraft.flightPlan === 'IFR' && aircraft.nextWaypoint && (
                      <div className="col-span-2 flex justify-between">
                        <span>NEXT</span>
                        <span className="font-mono">{aircraft.nextWaypoint}</span>
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
