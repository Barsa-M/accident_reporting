import { calculateDistance, formatLocation } from '../utils/locationUtils';

describe('Location Utils', () => {
  it('should calculate distance between two points', () => {
    const point1 = { lat: 0, lng: 0 };
    const point2 = { lat: 1, lng: 1 };
    const distance = calculateDistance(point1, point2);
    expect(distance).toBeGreaterThan(0);
  });

  it('should format location as a string', () => {
    const location = { lat: 12.34, lng: 56.78 };
    expect(formatLocation(location)).toBe('12.34, 56.78');
  });
}); 