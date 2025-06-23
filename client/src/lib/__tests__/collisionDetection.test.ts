import { detectCollision } from '../collisionDetection';

describe('detectCollision', () => {
  it('returns true for colliding aircraft', () => {
    const a1 = { lat: 0, lon: 0, alt: 1000 };
    const a2 = { lat: 0, lon: 0, alt: 1000 };
    expect(detectCollision(a1, a2)).toBe(true);
  });
  it('returns false for non-colliding aircraft', () => {
    const a1 = { lat: 0, lon: 0, alt: 1000 };
    const a2 = { lat: 10, lon: 10, alt: 2000 };
    expect(detectCollision(a1, a2)).toBe(false);
  });
});
