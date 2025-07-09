import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AircraftList from '../AircraftList';
import type { Aircraft } from '../../types/aircraft';

describe('AircraftList', () => {
  it('renders aircraft list', () => {
    const mockAircraft: Aircraft[] = [
      {
        id: 1,
        callsign: 'AAL123',
        aircraftType: 'B738',
        altitude: 35000,
        heading: 90,
        speed: 450,
        latitude: 39.1,
        longitude: -94.6,
        verificationStatus: 'verified',
        verifiedSources: ['ADS-B'],
        needsAssistance: false,
      },
      {
        id: 2,
        callsign: 'UAL456',
        aircraftType: 'A320',
        altitude: 32000,
        heading: 270,
        speed: 430,
        latitude: 38.9,
        longitude: -94.7,
        verificationStatus: 'unverified',
        verifiedSources: [],
        needsAssistance: false,
      },
    ];
    render(
      <AircraftList
        aircraft={mockAircraft}
        isLoading={false}
        selectedAircraftId={undefined}
        onSelectAircraft={() => {}}
        filters={{ showFilters: false, searchTerm: '', verificationStatus: 'all', needsAssistance: false }}
        onUpdateFilters={() => {}}
      />
    );
    expect(screen.getByText('AAL123')).toBeInTheDocument();
    expect(screen.getByText('UAL456')).toBeInTheDocument();
  });
});
