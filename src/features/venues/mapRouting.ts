import { Platform } from 'react-native';
import { Coordinates, CustomLocation, Venue } from '../../models/types';

export const CURRENT_LOCATION_POINT_ID = 'current-location';

export type MapPoint = {
  id: string;
  name: string;
  coordinates: Coordinates;
  type: 'venue' | 'custom' | 'current';
  venueId?: string;
  address?: string;
  city?: string;
};

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
    distance?: number;
    duration?: number;
  }>;
}

const EARTH_RADIUS_KM = 6371;
const WALKING_SPEED_KMH = 4.8;
const DRIVING_SPEED_KMH = 32;

export function buildMapPoints(venues: Venue[], customLocations: CustomLocation[]): MapPoint[] {
  const venuePoints = venues
    .filter((venue) => venue.coordinates !== null)
    .map((venue) => ({
      id: `venue:${venue.id}`,
      name: venue.name,
      coordinates: venue.coordinates!,
      type: 'venue' as const,
      venueId: venue.id,
      address: venue.address,
      city: venue.city,
    }));

  const customPoints = customLocations.map((location) => ({
    id: `custom:${location.id}`,
    name: location.name,
    coordinates: location.coordinates,
    type: 'custom' as const,
    address: location.address,
  }));

  return [...venuePoints, ...customPoints];
}

export function createCurrentLocationPoint(coordinates: Coordinates): MapPoint {
  return {
    id: CURRENT_LOCATION_POINT_ID,
    name: 'My Location',
    coordinates,
    type: 'current',
    address: 'Current location',
  };
}

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const latDelta = toRadians(to.latitude - from.latitude);
  const lngDelta = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function estimateTravelTimes(distanceInKm: number): { walkingMinutes: number; drivingMinutes: number } {
  return {
    walkingMinutes: Math.max(1, Math.round((distanceInKm / WALKING_SPEED_KMH) * 60)),
    drivingMinutes: Math.max(1, Math.round((distanceInKm / DRIVING_SPEED_KMH) * 60)),
  };
}

export function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
}

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function createDirectionsUrl(start: Coordinates, end: Coordinates): string {
  const origin = `${start.latitude},${start.longitude}`;
  const destination = `${end.latitude},${end.longitude}`;

  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`;
  }

  if (Platform.OS === 'android') {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

export async function fetchDrivingRoute(start: Coordinates, end: Coordinates): Promise<{
  path: Coordinates[];
  distanceKm: number;
  durationMinutes: number;
}> {
  const requestUrl =
    `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};` +
    `${end.longitude},${end.latitude}?overview=full&geometries=geojson&alternatives=false`;

  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`Route request failed: ${response.status}`);
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const route = data.routes?.[0];
  const routeCoordinates = route?.geometry?.coordinates ?? [];

  if (data.code !== 'Ok' || routeCoordinates.length < 2) {
    throw new Error('Route data unavailable');
  }

  const path = routeCoordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
  const routeDistance = route?.distance;
  const routeDuration = route?.duration;
  const distanceKmValue = typeof routeDistance === 'number' ? routeDistance / 1000 : distanceKm(start, end);
  const durationMinutesValue = typeof routeDuration === 'number'
    ? Math.max(1, Math.round(routeDuration / 60))
    : estimateTravelTimes(distanceKmValue).drivingMinutes;

  return {
    path,
    distanceKm: distanceKmValue,
    durationMinutes: durationMinutesValue,
  };
}
