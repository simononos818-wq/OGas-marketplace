// Haversine formula - distance in km between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate delivery time based on distance
export function estimateDeliveryTime(distanceKm: number): string {
  const baseSpeed = 20;
  const timeHours = distanceKm / baseSpeed;
  const timeMinutes = Math.ceil(timeHours * 60);
  const prepTime = distanceKm < 3 ? 15 : 30;
  const totalMin = timeMinutes + prepTime;
  const min = Math.max(20, Math.floor(totalMin * 0.8));
  const max = Math.ceil(totalMin * 1.2);
  return `${min}-${max} mins`;
}

// Nigerian city coordinates for manual fallback
export const CITY_COORDS: Record<string, [number, number]> = {
  warri: [5.5167, 5.75],
  ughelli: [5.5, 5.8],
  sapele: [5.89, 5.68],
  effurun: [5.55, 5.78],
  oteri: [5.52, 5.82],
  lagos: [6.5244, 3.3792],
  abuja: [9.0765, 7.3986],
  'port harcourt': [4.8156, 7.0498],
  benin: [6.335, 5.6037],
  ibadan: [7.3775, 3.947],
  asaba: [6.2056, 6.6959],
};
