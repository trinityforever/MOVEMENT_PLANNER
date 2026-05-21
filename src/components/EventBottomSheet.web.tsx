import React, { useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Modal, Platform, Animated,
} from 'react-native';
import { COLORS } from '../constants/Theme';
import dataService from '../services/dataService';

const monoFont    = Platform.OS === 'web' ? "'Share Tech Mono', monospace"    : undefined;
const displayFont = Platform.OS === 'web' ? "'Bebas Neue', sans-serif"        : undefined;
const condensedFont = Platform.OS === 'web' ? "'Barlow Condensed', sans-serif" : undefined;

const DRAWER_WIDTH = 360; // ~25vw on 1440px; hard floor at 360px

function getCategoryColor(category?: string) {
  switch (category) {
    case 'Afterparty': return COLORS.afterparty;
    case 'Day Party':  return COLORS.dayParty;
    case 'Sunrise':    return COLORS.sunrise;
    default:           return COLORS.festival;
  }
}

// Parse "2026-05-24T22:00:00" → hour as float (handles next-day wrapping)
function parseHour(iso: string, baseDate: string): number {
  const [datePart, timePart] = iso.split('T');
  const [h, m] = timePart.split(':').map(Number);
  const hour = h + m / 60;
  // If end date is after start date, add 24
  if (datePart > baseDate) return hour + 24;
  return hour;
}

interface EventBottomSheetProps {
  eventId: string | null;
  onClose: () => void;
}

const EventBottomSheet: React.FC<EventBottomSheetProps> = ({ eventId, onClose }) => {
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  const event = useMemo(
    () => (!eventId ? null : dataService.getEvents().find((e) => e.id === eventId)),
    [eventId],
  );
  const venue = useMemo(
    () => (!event ? null : dataService.getVenues().find((v) => v.id === event.venueId)),
    [event],
  );

  // Slide in when eventId set, reset when closed
  useEffect(() => {
    if (eventId) {
      translateX.setValue(DRAWER_WIDTH);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 340,
        useNativeDriver: false,
      }).start();
    }
  }, [eventId]);

  if (!event) return null;

  const color = getCategoryColor(event.category);
  const colorDim = color + '22';
  const isFree = event.price === 0 || event.priceNote === 'FREE';
  const priceDisplay = isFree ? 'FREE' : event.price != null ? `$${event.price}` : '—';
  const artists = event.artists ?? [];

  // ── Timeline math ──────────────────────────────────────────────
  const startDate = event.startTime.split('T')[0];
  const startHour = parseHour(event.startTime, startDate);
  const endHour   = parseHour(event.endTime,   startDate);
  const durationHours = Math.max(endHour - startHour, 1);
  const PX_PER_HOUR = 80;
  const TOTAL_TL_WIDTH = Math.round(durationHours * PX_PER_HOUR);

  // Distribute artists equally across the duration
  const slotHours = artists.length > 0 ? durationHours / artists.length : durationHours;
  const slotPx    = Math.round(slotHours * PX_PER_HOUR);

  // Hour tick marks
  const hourTicks: { label: string; x: number }[] = [];
  for (let i = 0; i <= Math.ceil(durationHours); i++) {
    const absHour = startHour + i;
    const displayHour = absHour % 24;
    const ampm = displayHour < 12 ? 'AM' : 'PM';
    const h12 = displayHour === 0 ? 12 : displayHour > 12 ? displayHour - 12 : displayHour;
    hourTicks.push({ label: `${h12}${ampm}`, x: i * PX_PER_HOUR });
  }

  const handleClose = () => {
    Animated.timing(translateX, {
      toValue: DRAWER_WIDTH,
      duration: 260,
      useNativeDriver: false,
    }).start(() => onClose());
  };

  return (
    <Modal visible={!!eventId} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop — fills left of screen, click to dismiss */}
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouchZone} activeOpacity={1} onPress={handleClose} />

        {/* Drawer — right side */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX }], borderLeftColor: color }]}>

          {/* ── Accent top bar (category color) ── */}
          <View style={[styles.accentTop, { backgroundColor: color }]} />

          {/* ── Ticker strip ── */}
          <View style={[styles.ticker, { backgroundColor: color }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
              scrollEnabled={false}
            >
              <Text style={styles.tickerText} numberOfLines={1}>
                {event.title.toUpperCase()}
                {'  ◆  '}
                {(event.category ?? 'EVENT').toUpperCase()}
                {'  ◆  '}
                {venue?.name.toUpperCase() ?? ''}
                {'  ◆  '}
                {dataService.formatTime(event.startTime)} — {dataService.formatTime(event.endTime)}
                {'  ◆  '}
              </Text>
            </ScrollView>
            <TouchableOpacity onPress={handleClose} style={styles.tickerClose}>
              <Text style={styles.tickerCloseText}>ESC ×</Text>
            </TouchableOpacity>
          </View>

          {/* ── Main scrollable content ── */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* Event title */}
            <Text style={[styles.eventTitle, { color }]} numberOfLines={3}>
              {event.title.toUpperCase()}
            </Text>

            {/* Category tag */}
            <View style={[styles.catTag, { borderColor: color + '66' }]}>
              <View style={[styles.catDot, { backgroundColor: color }]} />
              <Text style={[styles.catTagText, { color }]}>
                {(event.category ?? 'EVENT').toUpperCase()}
              </Text>
            </View>

            {/* ── Stat grid (2×2) ── */}
            <View style={styles.statGrid}>
              <View style={[styles.statCell, { borderColor: colorDim }]}>
                <Text style={styles.statLabel}>TIME</Text>
                <Text style={styles.statValue}>
                  {dataService.formatTime(event.startTime)}
                </Text>
                <Text style={[styles.statValueSmall, { color: COLORS.acid + '88' }]}>
                  → {dataService.formatTime(event.endTime)}
                </Text>
              </View>
              <View style={[styles.statCell, { borderColor: colorDim }]}>
                <Text style={styles.statLabel}>PRICE</Text>
                <Text style={[styles.statValue, isFree && { color: COLORS.festival }]}>
                  {priceDisplay}
                </Text>
              </View>
              <View style={[styles.statCell, { borderColor: colorDim }]}>
                <Text style={styles.statLabel}>VENUE</Text>
                <Text style={styles.statValue} numberOfLines={2}>
                  {(venue?.name ?? '—').toUpperCase()}
                </Text>
              </View>
              <View style={[styles.statCell, { borderColor: colorDim }]}>
                <Text style={styles.statLabel}>DURATION</Text>
                <Text style={styles.statValue}>
                  {Math.round(durationHours)}H
                </Text>
              </View>
            </View>

            {/* ── Timeline (horizontal scroll) ── */}
            {artists.length > 0 && (
              <View style={styles.tlSection}>
                <Text style={styles.sectionLabel}>// LINEUP TIMELINE — SCROLL →</Text>
                <View style={styles.tlWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator
                    contentContainerStyle={{ width: TOTAL_TL_WIDTH + 40, paddingRight: 40 }}
                    style={styles.tlScroll}
                  >
                    {/* Hour ticks */}
                    {hourTicks.map((tick) => (
                      <View key={tick.x} style={[styles.hrLine, { left: tick.x }]} />
                    ))}
                    {hourTicks.map((tick) => (
                      <Text key={`lbl-${tick.x}`} style={[styles.hrLabel, { left: tick.x }]}>
                        {tick.label}
                      </Text>
                    ))}

                    {/* NOW marker at x=0 */}
                    <View style={styles.nowLine} />
                    <Text style={styles.nowLabel}>NOW</Text>

                    {/* Artist blocks */}
                    {artists.map((artist, i) => {
                      const left = i * slotPx + 2;
                      const width = slotPx - 3;
                      const slotStartHour = startHour + i * slotHours;
                      const slotEndHour   = slotStartHour + slotHours;
                      const fmt = (h: number) => {
                        const d = h % 24;
                        const ampm = d < 12 ? 'AM' : 'PM';
                        const h12 = d === 0 ? 12 : d > 12 ? d - 12 : d;
                        return `${Math.floor(h12)}${ampm}`;
                      };
                      return (
                        <View
                          key={artist}
                          style={[
                            styles.artistBlock,
                            {
                              left,
                              width: Math.max(width, 60),
                              borderLeftColor: color,
                            },
                          ]}
                        >
                          <Text style={styles.artistBlockName} numberOfLines={1}>
                            {artist.toUpperCase()}
                          </Text>
                          <Text style={styles.artistBlockTime}>
                            {fmt(slotStartHour)}→{fmt(slotEndHour)}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* ── Description ── */}
            {!!event.description && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>// INFO</Text>
                <Text style={styles.bodyText}>{event.description}</Text>
              </View>
            )}

            {/* ── Series badge ── */}
            {!!event.seriesName && (
              <View style={[styles.seriesBadge, { borderColor: color + '55' }]}>
                <Text style={[styles.seriesText, { color }]}>
                  {event.seriesName.toUpperCase()}
                </Text>
              </View>
            )}

          </ScrollView>

          {/* ── Footer actions ── */}
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: color }]}>
              <Text style={styles.btnPrimaryText}>+ ADD TO PLAN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnSecondary, { borderColor: color + '66' }]}>
              <Text style={[styles.btnSecondaryText, { color }]}>♥ WANT TO GO</Text>
            </TouchableOpacity>
            {event.raUrl && (
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => Linking.openURL(event.raUrl!)}
              >
                <Text style={styles.btnGhostText}>↗ RESIDENT ADVISOR</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* CRT scanlines overlay */}
          <View style={styles.scanlines} pointerEvents="none" />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────
  backdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  backdropTouchZone: {
    flex: 1,
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#000',
    borderLeftWidth: 2,
    flexDirection: 'column',
    shadowColor: '#FF0080',
    shadowOpacity: 0.35,
    shadowRadius: 40,
    shadowOffset: { width: -8, height: 0 },
    overflow: 'hidden',
  },

  // ── Accent bar ──────────────────────────────────────────────────
  accentTop: {
    height: 2,
    width: '100%',
  },

  // ── Ticker ──────────────────────────────────────────────────────
  ticker: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  tickerText: {
    fontFamily: displayFont,
    fontSize: 16,
    color: '#000',
    letterSpacing: 3,
    paddingHorizontal: 12,
    lineHeight: 32,
  },
  tickerClose: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.2)',
  },
  tickerCloseText: {
    fontFamily: monoFont,
    fontSize: 9,
    color: '#000',
    letterSpacing: 2,
    opacity: 0.6,
  },

  // ── Content ─────────────────────────────────────────────────────
  content: {
    padding: 16,
    paddingBottom: 8,
  },

  // ── Event title ──────────────────────────────────────────────────
  eventTitle: {
    fontFamily: displayFont,
    fontSize: 48,
    lineHeight: 46,
    letterSpacing: 2,
    marginBottom: 8,
  },

  // ── Category tag ─────────────────────────────────────────────────
  catTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 14,
    gap: 6,
  },
  catDot: {
    width: 6,
    height: 6,
  },
  catTagText: {
    fontFamily: monoFont,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
  },

  // ── Stat grid ────────────────────────────────────────────────────
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  statCell: {
    width: '50%',
    padding: 10,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1a1a1a',
    backgroundColor: '#080808',
  },
  statLabel: {
    fontFamily: monoFont,
    fontSize: 8,
    color: 'rgba(204,255,0,0.35)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: condensedFont,
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValueSmall: {
    fontFamily: monoFont,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // ── Timeline ─────────────────────────────────────────────────────
  tlSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: monoFont,
    fontSize: 8,
    color: 'rgba(204,255,0,0.3)',
    letterSpacing: 3,
    marginBottom: 8,
  },
  tlWrapper: {
    borderWidth: 1,
    borderColor: '#111',
    backgroundColor: '#050505',
    overflow: 'hidden',
  },
  tlScroll: {
    height: 72,
  },
  hrLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#111',
  },
  hrLabel: {
    position: 'absolute',
    top: 4,
    fontFamily: monoFont,
    fontSize: 7,
    color: '#1e1e1e',
    letterSpacing: 1,
  },
  nowLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    backgroundColor: COLORS.acid,
  },
  nowLabel: {
    position: 'absolute',
    top: 4,
    left: 4,
    fontFamily: monoFont,
    fontSize: 7,
    color: COLORS.acid,
    letterSpacing: 2,
  },
  artistBlock: {
    position: 'absolute',
    top: 14,
    height: 44,
    backgroundColor: '#0c0c0c',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  artistBlockName: {
    fontFamily: condensedFont,
    fontSize: 13,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  artistBlockTime: {
    fontFamily: monoFont,
    fontSize: 7,
    color: '#2a2a2a',
    letterSpacing: 1,
  },

  // ── Description ──────────────────────────────────────────────────
  section: {
    marginBottom: 14,
  },
  bodyText: {
    fontFamily: monoFont,
    fontSize: 11,
    color: 'rgba(204,255,0,0.6)',
    lineHeight: 17,
  },

  // ── Series badge ──────────────────────────────────────────────────
  seriesBadge: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 14,
    alignItems: 'center',
  },
  seriesText: {
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // ── Footer ────────────────────────────────────────────────────────
  footer: {
    padding: 12,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#111',
    flexShrink: 0,
  },
  btnPrimary: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  btnPrimaryText: {
    fontFamily: monoFont,
    fontSize: 11,
    color: '#000',
    letterSpacing: 2,
    fontWeight: '700',
  },
  btnSecondary: {
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  btnGhost: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  btnGhostText: {
    fontFamily: monoFont,
    fontSize: 9,
    color: 'rgba(204,255,0,0.35)',
    letterSpacing: 2,
  },

  // ── CRT overlay ──────────────────────────────────────────────────
  scanlines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Web-only: repeating scanline gradient injected via CSS
    pointerEvents: 'none',
  } as any,
});

export default EventBottomSheet;
