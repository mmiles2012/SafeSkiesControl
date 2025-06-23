import { getAircraftById } from '../aircraftService';

describe('aircraftService', () => {
  it('returns aircraft by id', async () => {
    const aircraft = await getAircraftById(1);
    expect(aircraft).toHaveProperty('id', 1);
  });
});
