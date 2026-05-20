import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Text, Linking } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getVenues, getEventsByVenue } from '../../services/dataService';
import { COLORS } from '../../constants/Theme';
import { Coordinates, CustomLocation } from '../../models/types';
import {
  buildMapPoints,
  createCurrentLocationPoint,
  createDirectionsUrl,
  CURRENT_LOCATION_POINT_ID,
  distanceKm,
  estimateTravelTimes,
  fetchDrivingRoute,
  formatDistance,
  formatMinutes,
  MapPoint,
} from './mapRouting';

interface MapScreenProps {
  onVenueSelect: (venueId: string) => void;
  customLocations: CustomLocation[];
  onAddPress: () => void;
}

type RouteState = {
  path: Coordinates[];
  distanceKm: number;
  drivingMinutes: number;
  walkingMinutes: number;
  estimated: boolean;
};

const DETROIT_REGION = {
  latitude: 42.3670,
  longitude: -83.0700,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

export default function MapScreen({ onVenueSelect, customLocations, onAddPress }: MapScreenProps) {
  const mapRef = useRef<MapView | null>(null);
  const [routeMode, setRouteMode] = useState(false);
  const [routeStartId, setRouteStartId] = useState<string | null>(null);
  const [routeEndId, setRouteEndId] = useState<string | null>(null);
  const [routeState, setRouteState] = useState<RouteState | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [waitingForCurrentLocation, setWaitingForCurrentLocation] = useState(false);

  const venues = getVenues();

  const basePoints = useMemo(() => buildMapPoints(venues, customLocations), [venues, customLocations]);

  const allPoints = useMemo(() => {
    if (!currentLocation) return basePoints;
    return [createCurrentLocationPoint(currentLocation), ...basePoints];
  }, [basePoints, currentLocation]);

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const point of basePoints) {
      if (point.type === 'venue' && point.venueId) {
        counts[point.venueId] = getEventsByVenue(point.venueId).length;
      }
    }
    return counts;
  }, [basePoints]);

  const pointLookup = useMemo(() => {
    const lookup: Record<string, MapPoint> = {};
    for (const point of allPoints) {
      lookup[point.id] = point;
    }
    return lookup;
  }, [allPoints]);

  const routeStart = routeStartId ? pointLookup[routeStartId] : null;
  const routeEnd = routeEndId ? pointLookup[routeEndId] : null;

  useEffect(() => {
    if (!routeStart || !routeEnd) {
      setRouteState(null);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }

    let isActive = true;

    const loadRoute = async () => {
      setRouteLoading(true);
      setRouteError(null);

      try {
        const liveRoute = await fetchDrivingRoute(routeStart.coordinates, routeEnd.coordinates);
        const walkingMinutes = estimateTravelTimes(liveRoute.distanceKm).walkingMinutes;

        if (!isActive) return;

        setRouteState({
          path: liveRoute.path,
          distanceKm: liveRoute.distanceKm,
          drivingMinutes: liveRoute.durationMinutes,
          walkingMinutes,
          estimated: false,
        });
      } catch {
        const fallbackDistance = distanceKm(routeStart.coordinates, routeEnd.coordinates);
        const fallbackTimes = estimateTravelTimes(fallbackDistance);

        if (!isActive) return;

        setRouteState({
          path: [routeStart.coordinates, routeEnd.coordinates],
          distanceKm: fallbackDistance,
          drivingMinutes: fallbackTimes.drivingMinutes,
          walkingMinutes: fallbackTimes.walkingMinutes,
          estimated: true,
        });
        setRouteError('Live road route unavailable. Showing direct estimate.');
      } finally {
        if (isActive) {
          setRouteLoading(false);
        }
      }
    };

    loadRoute();

    return () => {
      isActive = false;
    };
  }, [routeEnd, routeStart]);

  useEffect(() => {
    if (!routeStart || !routeEnd) return;

    const fitCoordinates = routeState?.path?.length ? routeState.path : [routeStart.coordinates, routeEnd.coordinates];

    mapRef.current?.fitToCoordinates(fitCoordinates, {
      edgePadding: { top: 80, right: 80, bottom: 160, left: 80 },
      animated: true,
    });
  }, [routeEnd, routeStart, routeState?.path]);

  useEffect(() => {
    if (!waitingForCurrentLocation || !currentLocation) return;
    setWaitingForCurrentLocation(false);
    setRouteStartId(CURRENT_LOCATION_POINT_ID);
  }, [currentLocation, waitingForCurrentLocation]);

  const clearRoute = useCallback(() => {
    setRouteStartId(null);
    setRouteEndId(null);
    setRouteState(null);
    setRouteError(null);
    setRouteLoading(false);
  }, []);

  const toggleRouteMode = useCallback(() => {
    setRouteMode((current) => {
      const next = !current;
      if (!next) {
        clearRoute();
      }
      return next;
    });
  }, [clearRoute]);

  const handlePointSelect = useCallback(
    (point: MapPoint) => {
      if (routeMode) {
        setRouteError(null);

        if (!routeStartId || routeEndId) {
          setRouteStartId(point.id);
          setRouteEndId(null);
          return;
        }

        if (routeStartId === point.id) {
          clearRoute();
          return;
        }

        setRouteEndId(point.id);
        return;
      }

      if (point.type === 'venue' && point.venueId) {
        onVenueSelect(point.venueId);
      }
    },
    [clearRoute, onVenueSelect, routeEndId, routeMode, routeStartId],
  );

  const onUserLocationChange = useCallback((event: any) => {
    const coordinate = event?.nativeEvent?.coordinate;
    if (!coordinate) return;

    const latitude = Number(coordinate.latitude);
    const longitude = Number(coordinate.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      setCurrentLocation({ latitude, longitude });
    }
  }, []);

  const useCurrentLocationAsStart = useCallback(() => {
    if (!routeMode) return;

    if (currentLocation) {
      setRouteStartId(CURRENT_LOCATION_POINT_ID);
      return;
    }

    setWaitingForCurrentLocation(true);
  }, [currentLocation, routeMode]);

  const openNavigation = useCallback(() => {
    if (!routeStart || !routeEnd) return;
    Linking.openURL(createDirectionsUrl(routeStart.coordinates, routeEnd.coordinates));
  }, [routeStart, routeEnd]);

  const routeHint = useMemo(() => {
    if (!routeMode) return 'Tap Route to plan navigation between two points.';
    if (!routeStart) return 'Select a start location or tap My Location.';
    if (!routeEnd) return `Start: ${routeStart.name}. Select a destination.`;
    return `${routeStart.name} → ${routeEnd.name}`;
  }, [routeMode, routeStart, routeEnd]);

  const routeStats = useMemo(() => {
    if (!routeState || !routeStart || !routeEnd) return null;
    return {
      distanceLabel: formatDistance(routeState.distanceKm),
      walkingLabel: formatMinutes(routeState.walkingMinutes),
      drivingLabel: formatMinutes(routeState.drivingMinutes),
      estimated: routeState.estimated,
    };
  }, [routeEnd, routeStart, routeState]);

  return (
    <View style={styles.container}>
      <MapView
        ref={(instance) => {
          mapRef.current = instance;
        }}
        style={styles.map}
        initialRegion={DETROIT_REGION}
        customMapStyle={Platform.OS === 'ios' ? undefined : DARK_MAP_STYLE}
        showsUserLocation={routeMode}
        onUserLocationChange={onUserLocationChange}
      >
        {routeState?.path && routeState.path.length > 1 && (
          <Polyline
            coordinates={routeState.path}
            strokeColor={COLORS.afterparty}
            strokeWidth={4}
          />
        )}

        {allPoints.map((point) => {
          const isStart = point.id === routeStartId;
          const isEnd = point.id === routeEndId;
          const pinColor = isStart
            ? '#22C55E'
            : isEnd
              ? '#EF4444'
              : point.type === 'custom'
                ? COLORS.customLocation
                : point.type === 'current'
                  ? '#3B82F6'
                  : COLORS.afterparty;

          const description = point.type === 'venue' && point.venueId
            ? `${eventCounts[point.venueId] ?? 0} event${eventCounts[point.venueId] === 1 ? '' : 's'}`
            : point.address;

          return (
            <Marker
              key={point.id}
              coordinate={point.coordinates}
              title={point.name}
              description={description}
              pinColor={pinColor}
              onPress={() => handlePointSelect(point)}
            />
          );
        })}
      </MapView>

      <View style={styles.routeCard}>
        <TouchableOpacity
          style={[styles.routeToggle, routeMode && styles.routeToggleActive]}
          onPress={toggleRouteMode}
          activeOpacity={0.85}
        >
          <Text style={[styles.routeToggleText, routeMode && styles.routeToggleTextActive]}>
            {routeMode ? 'Routing On' : 'Route'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.routeHint}>{routeHint}</Text>

        {routeStats && (
          <View style={styles.routeStatsRow}>
            <Text style={styles.routeStat}>{routeStats.distanceLabel}</Text>
            <Text style={styles.routeStat}>Walk {routeStats.walkingLabel}</Text>
            <Text style={styles.routeStat}>Drive {routeStats.drivingLabel}</Text>
            {routeStats.estimated && <Text style={styles.estimateTag}>Estimated</Text>}
          </View>
        )}

        {routeLoading && <Text style={styles.loadingText}>Loading road route...</Text>}
        {waitingForCurrentLocation && <Text style={styles.loadingText}>Waiting for current location...</Text>}
        {routeError && <Text style={styles.errorText}>{routeError}</Text>}

        {routeMode && (
          <View style={styles.routeActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={useCurrentLocationAsStart} activeOpacity={0.85}>
              <Text style={styles.secondaryButtonText}>My Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={clearRoute} activeOpacity={0.85}>
              <Text style={styles.secondaryButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, !(routeStart && routeEnd) && styles.primaryButtonDisabled]}
              onPress={openNavigation}
              activeOpacity={0.85}
              disabled={!(routeStart && routeEnd)}
            >
              <Text style={styles.primaryButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.fab} onPress={onAddPress} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  routeCard: {
    position: 'absolute',
    top: 18,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(26, 26, 26, 0.94)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#323232',
    gap: 8,
  },
  routeToggle: {
    alignSelf: 'flex-start',
    backgroundColor: '#27272A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  routeToggleActive: {
    backgroundColor: COLORS.afterparty,
    borderColor: COLORS.afterparty,
  },
  routeToggleText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeToggleTextActive: {
    color: '#FFF',
  },
  routeHint: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  routeStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  routeStat: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  estimateTag: {
    backgroundColor: '#3F3F46',
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  loadingText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  routeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: '#374151',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.customLocation,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
});
