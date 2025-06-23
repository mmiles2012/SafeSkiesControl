import { render, screen } from '@testing-library/react';
import AircraftList from '../AircraftList';

describe('AircraftList', () => {
  it('renders aircraft list', () => {
    const mockAircraft = [
      { id: 1, callsign: 'AAL123', aircraftType: 'B738' },
      { id: 2, callsign: 'UAL456', aircraftType: 'A320' },
    ];
    render(<AircraftList aircraft={mockAircraft} onSelect={() => {}} />);
    expect(screen.getByText('AAL123')).toBeInTheDocument();
    expect(screen.getByText('UAL456')).toBeInTheDocument();
  });
});
