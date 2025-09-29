// School location coordinates (25.637146, 85.012951)
export const SCHOOL_COORDINATES = {
  latitude: 25.637146,
  longitude: 85.012951
};

export const ALLOWED_RADIUS_METERS = 500;

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

// Check if user is within allowed radius of school
export function isWithinSchoolRadius(userLat: number, userLon: number): boolean {
  const distance = calculateDistance(
    userLat, 
    userLon, 
    SCHOOL_COORDINATES.latitude, 
    SCHOOL_COORDINATES.longitude
  );
  return distance <= ALLOWED_RADIUS_METERS;
}

// Get user's current location
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}