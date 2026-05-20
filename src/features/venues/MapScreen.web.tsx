import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Linking } from 'react-native';
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

interface MapHtmlInput {
  points: MapPoint[];
  eventCounts: Record<string, number>;
  routeStartId: string | null;
  routeEndId: string | null;
  routePath: Coordinates[];
}

function useMapHtml({ points, eventCounts, routeStartId, routeEndId, routePath }: MapHtmlInput) {
  return useMemo(() => {
    const markers = points.map((point) => ({
      id: point.id,
      name: point.name,
      lat: point.coordinates.latitude,
      lng: point.coordinates.longitude,
      count: point.venueId ? eventCounts[point.venueId] ?? 0 : 0,
      type: point.type,
      address: point.address,
    }));

    const polylineCoords = routePath.map((coordinate) => [coordinate.latitude, coordinate.longitude]);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; }
    #map { width: 100%; height: 100%; }
    .leaflet-tile { filter: brightness(0.4) invert(1) grayscale(100%) hue-rotate(180deg); }
    .leaflet-container { background: #000; }
    .leaflet-control-zoom a { background-color: #1A1A1A !important; color: #fff !important; border-color: #333 !important; }
    .leaflet-popup-content-wrapper { background: #1A1A1A; color: #fff; border-radius: 10px; }
    .leaflet-popup-tip { background: #1A1A1A; }
    .leaflet-popup-content { margin: 10px 14px; font-family: -apple-system, sans-serif; }
    .venue-popup-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .venue-popup-count { font-size: 12px; color: #A78BFA; font-weight: 600; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      center: [42.367, -83.07],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);

    var markers = ${JSON.stringify(markers)};
    var startId = ${JSON.stringify(routeStartId)};
    var endId = ${JSON.stringify(routeEndId)};
    var polylineCoords = ${JSON.stringify(polylineCoords)};

    function markerIcon(marker) {
      var background = marker.type === 'custom' ? '#EC4899' : marker.type === 'current' ? '#3B82F6' : '#7C3AED';
      var label = '&bull;';
      var size = 28;

      if (marker.id === startId) {
        background = '#22C55E';
        label = 'S';
        size = 32;
      } else if (marker.id === endId) {
        background = '#EF4444';
        label = 'E';
        size = 32;
      }

      return L.divIcon({
        className: '',
        html: '<div style="background:' + background + ';width:' + size + 'px;height:' + size + 'px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;font-family:-apple-system,sans-serif;">' + label + '</div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -16]
      });
    }

    markers.forEach(function(m) {
      var marker = L.marker([m.lat, m.lng], { icon: markerIcon(m) }).addTo(map);
      var popupHtml;
      if (m.type === 'custom' || m.type === 'current') {
        popupHtml = '<div class="venue-popup-name">' + m.name + '</div>' +
          '<div class="venue-popup-count">' + (m.address || 'Custom location') + '</div>';
      } else {
        popupHtml = '<div class="venue-popup-name">' + m.name + '</div>' +
          '<div class="venue-popup-count">' + m.count + ' event' + (m.count !== 1 ? 's' : '') + '</div>';
      }
      marker.bindPopup(popupHtml);
      marker.on('click', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker', id: m.id }));
      });
    });

    if (polylineCoords.length > 1) {
      var line = L.polyline(polylineCoords, {
        color: '#7C3AED',
        weight: 5,
        opacity: 0.85
      }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [40, 40] });
    }
  </script>
</body>
</html>`;
  }, [points, eventCounts, routeStartId, routeEndId, routePath]);
}

const WebMap: React.FC<{ html: string; onPointSelect: (id: string) => void }> = ({ html, onPointSelect }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onPointSelectRef = useRef(onPointSelect);
  onPointSelectRef.current = onPointSelect;

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    (iframe.contentWindow as any).ReactNativeWebView = {
      postMessage: (rawMessage: string) => {
        try {
          const parsed = JSON.parse(rawMessage);
          if (parsed?.type === 'marker' && typeof parsed.id === 'string') {
            onPointSelectRef.current(parsed.id);
          }
        } catch {
          if (typeof rawMessage === 'string') {
            onPointSelectRef.current(rawMessage);
          }
        }
      },
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      onLoad={handleLoad}
      style={{ flex: 1, border: 'none', backgroundColor: COLORS.background }}
      title="Venue Map"
    />
  );
};

export default function MapScreen({ onVenueSelect, customLocations, onAddPress }: MapScreenProps) {
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
    (id: string) => {
      const point = pointLookup[id];
      if (!point) return;

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
    [clearRoute, onVenueSelect, pointLookup, routeEndId, routeMode, routeStartId],
  );

  const useCurrentLocationAsStart = useCallback(() => {
    if (!routeMode) return;

    if (currentLocation) {
      setRouteStartId(CURRENT_LOCATION_POINT_ID);
      return;
    }

    if (!navigator?.geolocation) {
      setRouteError('Location is not available in this browser.');
      return;
    }

    setWaitingForCurrentLocation(true);
    setRouteError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentLocation(coordinates);
        setRouteStartId(CURRENT_LOCATION_POINT_ID);
        setWaitingForCurrentLocation(false);
      },
      () => {
        setRouteError('Location permission denied or unavailable.');
        setWaitingForCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
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

  const html = useMapHtml({
    points: allPoints,
    eventCounts,
    routeStartId,
    routeEndId,
    routePath: routeState?.path ?? [],
  });

  return (
    <View style={styles.container}>
      <WebMap html={html} onPointSelect={handlePointSelect} />

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
        {waitingForCurrentLocation && <Text style={styles.loadingText}>Fetching current location...</Text>}
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
