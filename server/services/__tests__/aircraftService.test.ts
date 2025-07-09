import { aircraftService } from '../aircraftService';

describe('aircraftService', () => {
  it('returns aircraft by id', async () => {
    // Insert a mock aircraft for testing
    const mockAircraft = await aircraftService.createAircraft({
      callsign: 'TEST123',
      aircraftType: 'A320',
      altitude: 30000,
      heading: 180,
      speed: 400,
      latitude: 40.0,
      longitude: -75.0,
      verificationStatus: 'verified',
      verifiedSources: ['ADS-B'],
      needsAssistance: false
    });
    const aircraft = await aircraftService.getAircraft(mockAircraft.id);
    expect(aircraft).toHaveProperty('id', mockAircraft.id);
    expect(aircraft?.callsign).toBe('TEST123');
  });
});
