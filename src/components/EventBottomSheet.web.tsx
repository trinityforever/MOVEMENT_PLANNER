import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../constants/Theme';
import dataService from '../services/dataService';

const monoFont = Platform.OS === 'web' ? "'Share Tech Mono', monospace" : undefined;
const displayFont = Platform.OS === 'web' ? "'Bebas Neue', sans-serif" : undefined;
const condensedFont = Platform.OS === 'web' ? "'Barlow Condensed', sans-serif" : undefined;

interface EventBottomSheetProps {
  eventId: string | null;
  onClose: () => void;
  onEventSelect: (eventId: string) => void;
}

function getCategoryColor(category?: string) {
  switch (category) {
    case 'Afterparty': return COLORS.afterparty;
    case 'Day Party': return COLORS.dayParty;
    case 'Sunrise': return COLORS.sunrise;
    default: return COLORS.festival;
  }
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();
}

const EventBottomSheet: React.FC<EventBottomSheetProps> = ({ eventId, onClose, onEventSelect }) => {
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const venues = useMemo(() => dataService.getVenues(), []);

  const event = useMemo(
    () => (!eventId ? null : dataService.getEvents().find((currentEvent) => currentEvent.id === eventId)),
    [eventId],
  );

  const venue = useMemo(
    () => (!event ? null : venues.find((currentVenue) => currentVenue.id === event.venueId)),
    [event, venues],
  );

  const relatedArtistEvents = useMemo(() => {
    if (!selectedArtist || !event) return [];
    return dataService.getEventsByArtist(selectedArtist, { excludeEventId: event.id });
  }, [selectedArtist, event]);

  const venueNameById = useMemo(
    () => Object.fromEntries(venues.map((currentVenue) => [currentVenue.id, currentVenue.name])),
    [venues],
  );

  useEffect(() => {
    setSelectedArtist(null);
  }, [eventId]);

  const [rsvp, setRsvp] = useState<'going' | 'want' | null>(null);

  useEffect(() => {
    if (!eventId) { setRsvp(null); return; }
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage?.getItem('rsvps_v1') : null;
      const rsvps = raw ? JSON.parse(raw) : {};
      setRsvp(rsvps[eventId] ?? null);
    } catch { setRsvp(null); }
  }, [eventId]);

  const handleRsvp = useCallback((state: 'going' | 'want') => {
    if (!eventId) return;
    const next = rsvp === state ? null : state;
    setRsvp(next);
    try {
      const raw = window.localStorage?.getItem('rsvps_v1');
      const rsvps = raw ? JSON.parse(raw) : {};
      if (next === null) delete rsvps[eventId];
      else rsvps[eventId] = next;
      window.localStorage?.setItem('rsvps_v1', JSON.stringify(rsvps));
    } catch {}
  }, [eventId, rsvp]);

  if (!event) return null;

  const color = getCategoryColor(event.category);
  const artists = event.artists ?? [];
  const isFree = event.price === 0 || event.priceNote === 'FREE';
  const priceDisplay = isFree ? 'FREE' : event.price != null ? `$${event.price}` : '—';

  const handleRelatedEventPress = (relatedEventId: string) => {
    setSelectedArtist(null);
    onEventSelect(relatedEventId);
  };

  return (
    <>
      <Modal visible={!!eventId} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.dismissZone} activeOpacity={1} onPress={onClose} />
          <View style={[styles.modalCard, { borderColor: color + '55' }]}>
            <View style={[styles.modalAccent, { backgroundColor: color }]} />

            <View style={styles.ticker}>
              <Text style={styles.tickerText} numberOfLines={1}>
                {event.title.toUpperCase()} {'  ◆  '} {(event.category ?? 'EVENT').toUpperCase()} {'  ◆  '}
                {(venue?.name ?? 'TBA').toUpperCase()} {'  ◆  '}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.tickerClose}>
                <Text style={styles.tickerCloseText}>ESC ×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <TouchableOpacity onPress={onClose} style={styles.closeRow}>
                <Text style={styles.closeText}>× CLOSE</Text>
              </TouchableOpacity>

              <Text style={[styles.title, { color }]}>{event.title.toUpperCase()}</Text>

              <View style={[styles.categoryBadge, { borderColor: color + '66' }]}>
                <View style={[styles.categoryDot, { backgroundColor: color }]} />
                <Text style={[styles.categoryBadgeText, { color }]}>
                  {(event.category ?? 'EVENT').toUpperCase()}
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>VENUE</Text>
                  <TouchableOpacity onPress={() => venue && router.push(`/map?venueId=${venue.id}`)}>
                    <Text style={styles.statValue}>{(venue?.name ?? 'TBA').toUpperCase()}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>DATE</Text>
                  <Text style={styles.statValue}>{formatDate(event.startTime)}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>TIME</Text>
                  <Text style={styles.statValue}>
                    {dataService.formatTime(event.startTime)}–{dataService.formatTime(event.endTime)}
                  </Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>PRICE</Text>
                  <Text style={styles.statValue}>{priceDisplay}</Text>
                </View>
              </View>

              {!!artists.length && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>ARTISTS</Text>
                  <View style={styles.artistList}>
                    {artists.map((artist) => (
                      <TouchableOpacity
                        key={artist}
                        style={[styles.artistChip, { borderColor: color + '44' }]}
                        onPress={() => setSelectedArtist(artist)}
                      >
                        <Text style={[styles.artistChipText, { color }]}>{artist.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {!!event.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>INFO</Text>
                  <Text style={styles.bodyText}>{event.description}</Text>
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.primaryButton, rsvp === 'going'
                    ? { backgroundColor: COLORS.acid }
                    : { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.acid }]}
                  onPress={() => handleRsvp('going')}
                >
                  <Text style={[styles.primaryButtonText, rsvp !== 'going' && { color: COLORS.acid }]}>
                    {rsvp === 'going' ? '★ GOING' : '+ MY PLAN'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: rsvp === 'want' ? COLORS.pink : color + '66' }]}
                  onPress={() => handleRsvp('want')}
                >
                  <Text style={[styles.secondaryButtonText, { color: rsvp === 'want' ? COLORS.pink : color }]}>
                    {rsvp === 'want' ? '♥ WANT' : '♡ WANT TO GO'}
                  </Text>
                </TouchableOpacity>
              </View>

              {event.raUrl && (
                <TouchableOpacity style={styles.ghostButton} onPress={() => Linking.openURL(event.raUrl!)}>
                  <Text style={styles.ghostButtonText}>↗ VIEW ON RESIDENT ADVISOR</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedArtist}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedArtist(null)}
      >
        <View style={styles.artistModalBackdrop}>
          <TouchableOpacity
            style={styles.dismissZone}
            activeOpacity={1}
            onPress={() => setSelectedArtist(null)}
          />
          <View style={styles.artistModalCard}>
            <Text style={styles.artistModalTitle}>{selectedArtist?.toUpperCase()}</Text>
            <Text style={styles.artistModalSubtitle}>OTHER PARTIES IN DATABASE</Text>
            <ScrollView contentContainerStyle={styles.artistModalList}>
              {relatedArtistEvents.length ? relatedArtistEvents.map((relatedEvent) => (
                <TouchableOpacity
                  key={relatedEvent.id}
                  style={styles.artistModalItem}
                  onPress={() => handleRelatedEventPress(relatedEvent.id)}
                >
                  <Text style={styles.artistModalEventTitle}>{relatedEvent.title.toUpperCase()}</Text>
                  <Text style={styles.artistModalEventMeta}>
                    {(venueNameById[relatedEvent.venueId] ?? 'UNKNOWN VENUE').toUpperCase()}
                    {'  //  '}
                    {dataService.formatTime(relatedEvent.startTime)}
                  </Text>
                </TouchableOpacity>
              )) : (
                <Text style={styles.artistModalEmpty}>
                  NO OTHER PARTIES FOR THIS ARTIST ARE IN THE LOCAL DATABASE YET.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dismissZone: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '82%',
    backgroundColor: '#000',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: COLORS.acid,
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    zIndex: 1,
  },
  modalAccent: {
    height: 2,
    width: '100%',
  },
  ticker: {
    height: 44,
    backgroundColor: COLORS.pink,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerText: {
    flex: 1,
    fontFamily: monoFont,
    fontSize: 12,
    color: '#000',
    letterSpacing: 2,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  tickerClose: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.15)',
  },
  tickerCloseText: {
    fontFamily: monoFont,
    fontSize: 10,
    color: '#000',
    letterSpacing: 2,
  },
  content: {
    padding: 28,
    paddingBottom: 24,
  },
  closeRow: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  closeText: {
    fontFamily: monoFont,
    fontSize: 10,
    color: 'rgba(204,255,0,0.45)',
    letterSpacing: 2,
  },
  title: {
    fontFamily: displayFont,
    fontSize: 64,
    lineHeight: 58,
    letterSpacing: 2,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    marginBottom: 24,
  },
  categoryDot: {
    width: 8,
    height: 8,
  },
  categoryBadgeText: {
    fontFamily: monoFont,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.1)',
    marginBottom: 24,
  },
  statCell: {
    width: '50%',
    padding: 16,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(204,255,0,0.1)',
    backgroundColor: '#060606',
  },
  statLabel: {
    fontFamily: monoFont,
    fontSize: 9,
    color: 'rgba(204,255,0,0.35)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  statValue: {
    fontFamily: condensedFont,
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: monoFont,
    fontSize: 10,
    color: 'rgba(204,255,0,0.35)',
    letterSpacing: 3,
    marginBottom: 12,
  },
  artistList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  artistChip: {
    borderWidth: 1,
    backgroundColor: '#050505',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  artistChipText: {
    fontFamily: monoFont,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: '700',
  },
  bodyText: {
    fontFamily: monoFont,
    fontSize: 14,
    color: 'rgba(204,255,0,0.68)',
    lineHeight: 28,
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  primaryButtonText: {
    fontFamily: monoFont,
    fontSize: 15,
    color: '#000',
    fontWeight: '700',
    letterSpacing: 2,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontFamily: monoFont,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
  },
  ghostButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.08)',
    backgroundColor: '#020202',
  },
  ghostButtonText: {
    fontFamily: monoFont,
    fontSize: 12,
    color: 'rgba(204,255,0,0.4)',
    letterSpacing: 2,
    fontWeight: '700',
  },
  artistModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  artistModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '72%',
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.22)',
    padding: 18,
    zIndex: 1,
  },
  artistModalTitle: {
    fontFamily: displayFont,
    fontSize: 28,
    color: COLORS.acid,
    letterSpacing: 2,
    marginBottom: 4,
  },
  artistModalSubtitle: {
    fontFamily: monoFont,
    fontSize: 9,
    color: 'rgba(204,255,0,0.45)',
    letterSpacing: 2,
    marginBottom: 12,
  },
  artistModalList: {
    gap: 10,
    paddingBottom: 8,
  },
  artistModalItem: {
    borderWidth: 1,
    borderColor: '#161616',
    backgroundColor: '#0A0A0A',
    padding: 12,
  },
  artistModalEventTitle: {
    fontFamily: condensedFont,
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  artistModalEventMeta: {
    fontFamily: monoFont,
    fontSize: 9,
    color: 'rgba(204,255,0,0.45)',
    letterSpacing: 1,
  },
  artistModalEmpty: {
    fontFamily: monoFont,
    fontSize: 10,
    color: 'rgba(204,255,0,0.45)',
    lineHeight: 16,
    letterSpacing: 1,
  },
});

export default EventBottomSheet;
