import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Linking, Platform } from 'react-native';
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

const FONTS =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;700;900&display=swap";

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

    const polylineCoords = routePath.map((c) => [c.latitude, c.longitude]);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="${FONTS}" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --acid: #CCFF00;
      --pink: #FF0080;
      --void: #000000;
      --green: #00FF41;
      --amber: #FF8C00;
      --dim: #0a0a0a;
    }
    body, html {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      background: #000;
      font-family: 'Share Tech Mono', monospace;
      color: var(--acid);
    }
    /* scanlines */
    body::before {
      content: '';
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px);
      pointer-events: none;
      z-index: 9999;
      animation: scanroll 8s linear infinite;
    }
    @keyframes scanroll { 0% { background-position: 0 0; } 100% { background-position: 0 100px; } }
    /* CRT vignette */
    body::after {
      content: '';
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%);
      pointer-events: none;
      z-index: 9998;
    }
    #map { width: 100%; height: 100%; }
    /* Acid tile treatment */
    .leaflet-tile { filter: brightness(0.3) saturate(0) invert(1) hue-rotate(60deg) brightness(0.5); }
    .leaflet-container { background: #000; }
    /* Zoom controls */
    .leaflet-control-zoom a {
      background-color: #000 !important;
      color: var(--acid) !important;
      border: 1px solid var(--acid) !important;
      font-family: 'Bebas Neue', sans-serif !important;
      font-size: 16px !important;
    }
    .leaflet-control-zoom a:hover { background: var(--acid) !important; color: #000 !important; }
    /* Popups */
    .leaflet-popup-content-wrapper {
      background: #000;
      border: 1px solid var(--acid);
      border-radius: 0;
      box-shadow: 0 0 20px rgba(204,255,0,0.3);
    }
    .leaflet-popup-tip { background: var(--acid); }
    .leaflet-popup-content { margin: 10px 14px; font-family: 'Share Tech Mono', monospace; }
    .leaflet-popup-close-button { color: var(--acid) !important; font-size: 18px !important; }
    .venue-popup-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 16px;
      color: var(--acid);
      letter-spacing: 2px;
      margin-bottom: 3px;
    }
    .venue-popup-count { font-size: 11px; color: var(--pink); font-weight: 600; letter-spacing: 1px; }
    .venue-popup-addr { font-size: 10px; color: rgba(204,255,0,0.5); margin-top: 2px; }
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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

    var markers = ${JSON.stringify(markers)};
    var startId = ${JSON.stringify(routeStartId)};
    var endId = ${JSON.stringify(routeEndId)};
    var polylineCoords = ${JSON.stringify(polylineCoords)};

    function categoryColor(type) {
      if (type === 'current') return '#3B82F6';
      if (type === 'custom') return '#FF0080';
      return '#CCFF00';
    }

    function markerIcon(m) {
      var bg = categoryColor(m.type);
      var label = '◆';
      var size = 26;
      var glow = bg;

      if (m.id === startId) { bg = '#00FF41'; label = 'S'; size = 32; glow = '#00FF41'; }
      else if (m.id === endId) { bg = '#FF0080'; label = 'E'; size = 32; glow = '#FF0080'; }

      return L.divIcon({
        className: '',
        html: '<div style="' +
          'background:' + bg + ';' +
          'width:' + size + 'px;height:' + size + 'px;' +
          'display:flex;align-items:center;justify-content:center;' +
          'font-size:11px;color:#000;font-weight:900;' +
          'font-family:Bebas Neue,sans-serif;letter-spacing:1px;' +
          'box-shadow:0 0 12px ' + glow + ',0 0 24px rgba(0,0,0,0.8);' +
          'border:1px solid rgba(0,0,0,0.4);' +
          '">' + label + '</div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2 - 4],
      });
    }

    markers.forEach(function(m) {
      var mk = L.marker([m.lat, m.lng], { icon: markerIcon(m) }).addTo(map);
      var html;
      if (m.type === 'custom' || m.type === 'current') {
        html = '<div class="venue-popup-name">' + m.name + '</div>' +
               '<div class="venue-popup-addr">' + (m.address || 'CUSTOM LOCATION') + '</div>';
      } else {
        html = '<div class="venue-popup-name">' + m.name.toUpperCase() + '</div>' +
               '<div class="venue-popup-count">◆ ' + m.count + ' EVENT' + (m.count !== 1 ? 'S' : '') + '</div>' +
               (m.address ? '<div class="venue-popup-addr">' + m.address + '</div>' : '');
      }
      mk.bindPopup(html);
      mk.on('click', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker', id: m.id }));
      });
    });

    if (polylineCoords.length > 1) {
      var line = L.polyline(polylineCoords, {
        color: '#FF0080',
        weight: 3,
        opacity: 1,
        dashArray: '8, 4',
      }).addTo(map);
      // Animate dash offset via CSS injection
      var lineEl = line.getElement();
      if (lineEl) {
        lineEl.style.animation = 'dashmarch 0.6s linear infinite';
      }
      map.fitBounds(line.getBounds(), { padding: [50, 50] });
    }

    // Add dash march animation to SVG
    var svgStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    svgStyle.textContent = '@keyframes dashmarch { to { stroke-dashoffset: -12; } }';
    document.querySelector('.leaflet-overlay-pane svg')?.appendChild(svgStyle);
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
          if (typeof rawMessage === 'string') onPointSelectRef.current(rawMessage);
        }
      },
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      onLoad={handleLoad}
      style={{ flex: 1, border: 'none', backgroundColor: '#000' }}
      title="Venue Map"
    />
  );
};

const monoFont = Platform.OS === 'web' ? "'Share Tech Mono', monospace" : undefined;
const displayFont = Platform.OS === 'web' ? "'Bebas Neue', sans-serif" : undefined;

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
    for (const p of basePoints) {
      if (p.type === 'venue' && p.venueId) counts[p.venueId] = getEventsByVenue(p.venueId).length;
    }
    return counts;
  }, [basePoints]);

  const pointLookup = useMemo(() => {
    const lookup: Record<string, MapPoint> = {};
    for (const p of allPoints) lookup[p.id] = p;
    return lookup;
  }, [allPoints]);

  const routeStart = routeStartId ? pointLookup[routeStartId] : null;
  const routeEnd = routeEndId ? pointLookup[routeEndId] : null;

  useEffect(() => {
    if (!routeStart || !routeEnd) { setRouteState(null); setRouteError(null); setRouteLoading(false); return; }
    let isActive = true;
    const loadRoute = async () => {
      setRouteLoading(true); setRouteError(null);
      try {
        const live = await fetchDrivingRoute(routeStart.coordinates, routeEnd.coordinates);
        if (!isActive) return;
        setRouteState({ path: live.path, distanceKm: live.distanceKm, drivingMinutes: live.durationMinutes, walkingMinutes: estimateTravelTimes(live.distanceKm).walkingMinutes, estimated: false });
      } catch {
        const d = distanceKm(routeStart.coordinates, routeEnd.coordinates);
        const t = estimateTravelTimes(d);
        if (!isActive) return;
        setRouteState({ path: [routeStart.coordinates, routeEnd.coordinates], distanceKm: d, drivingMinutes: t.drivingMinutes, walkingMinutes: t.walkingMinutes, estimated: true });
        setRouteError('LIVE ROUTE UNAVAILABLE — DIRECT ESTIMATE');
      } finally { if (isActive) setRouteLoading(false); }
    };
    loadRoute();
    return () => { isActive = false; };
  }, [routeEnd, routeStart]);

  const clearRoute = useCallback(() => { setRouteStartId(null); setRouteEndId(null); setRouteState(null); setRouteError(null); setRouteLoading(false); }, []);
  const toggleRouteMode = useCallback(() => { setRouteMode(c => { if (c) clearRoute(); return !c; }); }, [clearRoute]);

  const handlePointSelect = useCallback((id: string) => {
    const point = pointLookup[id];
    if (!point) return;
    if (routeMode) {
      setRouteError(null);
      if (!routeStartId || routeEndId) { setRouteStartId(point.id); setRouteEndId(null); return; }
      if (routeStartId === point.id) { clearRoute(); return; }
      setRouteEndId(point.id);
      return;
    }
    if (point.type === 'venue' && point.venueId) onVenueSelect(point.venueId);
  }, [clearRoute, onVenueSelect, pointLookup, routeEndId, routeMode, routeStartId]);

  const useCurrentLocationAsStart = useCallback(() => {
    if (!routeMode) return;
    if (currentLocation) { setRouteStartId(CURRENT_LOCATION_POINT_ID); return; }
    if (!navigator?.geolocation) { setRouteError('LOCATION NOT AVAILABLE'); return; }
    setWaitingForCurrentLocation(true); setRouteError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }; setCurrentLocation(c); setRouteStartId(CURRENT_LOCATION_POINT_ID); setWaitingForCurrentLocation(false); },
      () => { setRouteError('LOCATION PERMISSION DENIED'); setWaitingForCurrentLocation(false); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, [currentLocation, routeMode]);

  const openNavigation = useCallback(() => {
    if (!routeStart || !routeEnd) return;
    Linking.openURL(createDirectionsUrl(routeStart.coordinates, routeEnd.coordinates));
  }, [routeStart, routeEnd]);

  const routeHint = useMemo(() => {
    if (!routeMode) return '// TAP ROUTE TO PLAN NAVIGATION';
    if (!routeStart) return '// SELECT START LOCATION OR TAP MY LOC';
    if (!routeEnd) return `// START: ${routeStart.name.toUpperCase()} — SELECT DEST`;
    return `// ${routeStart.name.toUpperCase()} → ${routeEnd.name.toUpperCase()}`;
  }, [routeMode, routeStart, routeEnd]);

  const routeStats = useMemo(() => {
    if (!routeState || !routeStart || !routeEnd) return null;
    return { distanceLabel: formatDistance(routeState.distanceKm), walkingLabel: formatMinutes(routeState.walkingMinutes), drivingLabel: formatMinutes(routeState.drivingMinutes), estimated: routeState.estimated };
  }, [routeEnd, routeStart, routeState]);

  const html = useMapHtml({ points: allPoints, eventCounts, routeStartId, routeEndId, routePath: routeState?.path ?? [] });

  return (
    <View style={styles.container}>
      <WebMap html={html} onPointSelect={handlePointSelect} />

      <View style={styles.routeCard}>
        <View style={styles.routeCardRow}>
          <TouchableOpacity style={[styles.routeToggle, routeMode && styles.routeToggleActive]} onPress={toggleRouteMode} activeOpacity={0.85}>
            <Text style={[styles.routeToggleText, routeMode && styles.routeToggleTextActive]}>
              {routeMode ? '◈ ROUTING ON' : '◈ ROUTE'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.routeHint} numberOfLines={1}>{routeHint}</Text>
        </View>

        {routeStats && (
          <View style={styles.routeStatsRow}>
            <View style={styles.statBox}><Text style={styles.statLabel}>DIST</Text><Text style={styles.statValue}>{routeStats.distanceLabel}</Text></View>
            <View style={styles.statBox}><Text style={styles.statLabel}>WALK</Text><Text style={styles.statValue}>{routeStats.walkingLabel}</Text></View>
            <View style={styles.statBox}><Text style={styles.statLabel}>DRIVE</Text><Text style={styles.statValue}>{routeStats.drivingLabel}</Text></View>
            {routeStats.estimated && <View style={styles.estimateTag}><Text style={styles.estimateText}>EST</Text></View>}
          </View>
        )}

        {routeLoading && <Text style={styles.statusText}>// LOADING ROAD ROUTE...</Text>}
        {waitingForCurrentLocation && <Text style={styles.statusText}>// ACQUIRING LOCATION...</Text>}
        {routeError && <Text style={styles.errorText}>⚠ {routeError}</Text>}

        {routeMode && (
          <View style={styles.routeActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={useCurrentLocationAsStart} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>MY LOC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={clearRoute} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>CLEAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, !(routeStart && routeEnd) && styles.primaryBtnDisabled]}
              onPress={openNavigation}
              activeOpacity={0.85}
              disabled={!(routeStart && routeEnd)}
            >
              <Text style={styles.primaryBtnText}>NAVIGATE ↗</Text>
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
  container: { flex: 1, backgroundColor: '#000' },
  routeCard: {
    position: 'absolute',
    top: 14,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderWidth: 1,
    borderColor: COLORS.acid,
    padding: 10,
    gap: 8,
    shadowColor: COLORS.acid,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  routeCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeToggle: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: COLORS.acid,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  routeToggleActive: { backgroundColor: COLORS.acid },
  routeToggleText: {
    color: COLORS.acid,
    fontSize: 11,
    fontFamily: monoFont,
    fontWeight: '700',
    letterSpacing: 1,
  },
  routeToggleTextActive: { color: '#000' },
  routeHint: {
    flex: 1,
    color: 'rgba(204,255,0,0.5)',
    fontSize: 10,
    fontFamily: monoFont,
    letterSpacing: 0.5,
  },
  routeStatsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statBox: {
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statLabel: { color: 'rgba(204,255,0,0.45)', fontSize: 8, fontFamily: monoFont, letterSpacing: 1 },
  statValue: { color: COLORS.acid, fontSize: 13, fontFamily: monoFont, fontWeight: '700' },
  estimateTag: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: 'rgba(255,140,0,0.5)', paddingHorizontal: 6, paddingVertical: 2 },
  estimateText: { color: COLORS.amber, fontSize: 9, fontFamily: monoFont, letterSpacing: 1 },
  statusText: { color: 'rgba(204,255,0,0.5)', fontSize: 10, fontFamily: monoFont },
  errorText: { color: COLORS.pink, fontSize: 10, fontFamily: monoFont, fontWeight: '700' },
  routeActions: { flexDirection: 'row', gap: 6 },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.4)',
    paddingVertical: 9,
  },
  secondaryBtnText: { color: COLORS.acid, fontSize: 10, fontFamily: monoFont, fontWeight: '700', letterSpacing: 1 },
  primaryBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.acid,
    paddingVertical: 9,
  },
  primaryBtnDisabled: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: 'rgba(204,255,0,0.2)' },
  primaryBtnText: { color: '#000', fontSize: 11, fontFamily: monoFont, fontWeight: '700', letterSpacing: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 46,
    height: 46,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.pink,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '900', lineHeight: 30 },
});
