import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal } from 'react-native';
import { router } from 'expo-router';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { COLORS } from '../constants/Theme';
import dataService from '../services/dataService';

interface EventBottomSheetProps {
  eventId: string | null;
  onClose: () => void;
  onEventSelect: (eventId: string) => void;
}

const EventBottomSheet: React.FC<EventBottomSheetProps> = ({ eventId, onClose, onEventSelect }) => {
  const snapPoints = useMemo(() => ['35%', '60%'], []);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const venues = useMemo(() => dataService.getVenues(), []);

  const event = useMemo(() => {
    if (!eventId) return null;
    return dataService.getEvents().find((e) => e.id === eventId);
  }, [eventId]);

  const venue = useMemo(() => {
    if (!event) return null;
    return venues.find((v) => v.id === event.venueId);
  }, [event, venues]);

  const relatedArtistEvents = useMemo(() => {
    if (!selectedArtist || !event) return [];
    return dataService.getEventsByArtist(selectedArtist, { excludeEventId: event.id });
  }, [selectedArtist, event]);

  const venueNameById = useMemo(
    () => Object.fromEntries(venues.map((venue) => [venue.id, venue.name])),
    [venues]
  );

  useEffect(() => {
    setSelectedArtist(null);
  }, [eventId]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  if (!event) return null;

  const isFree = event.price === 0 || event.priceNote === 'FREE';
  const handleRelatedEventPress = (relatedEventId: string) => {
    setSelectedArtist(null);
    onEventSelect(relatedEventId);
  };
  const residentAdvisorArtistUrl = selectedArtist
    ? dataService.getResidentAdvisorArtistUrl(selectedArtist)
    : null;

  return (
    <>
      <BottomSheet
        index={eventId ? 0 : -1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetView style={styles.content}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) }]}>
                <Text style={styles.categoryText}>{event.category}</Text>
              </View>
              <Text style={styles.title}>{event.title}</Text>
              <TouchableOpacity onPress={() => venue && router.push(`/map?venueId=${venue.id}`)}>
                <Text style={styles.venueName}>{venue?.name}</Text>
              </TouchableOpacity>
              <Text style={styles.time}>
                {dataService.formatTime(event.startTime)} – {dataService.formatTime(event.endTime)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Artists</Text>
              <View style={styles.artistList}>
                {event.artists?.length ? (() => {
                  const artists = event.artists;
                  return artists.map((artist, i) => (
                    <TouchableOpacity
                      key={artist}
                      onPress={() => setSelectedArtist(artist)}
                    >
                      <Text style={styles.artistLink}>{artist}{i < artists.length - 1 ? ' · ' : ''}</Text>
                    </TouchableOpacity>
                  ));
                })() : <Text style={styles.bodyText}>Lineup TBA</Text>}
              </View>
            </View>

            {event.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.bodyText}>{event.description}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Price</Text>
                <Text style={[styles.infoValue, isFree && { color: COLORS.festival }]}>
                  {isFree ? 'FREE' : `$${event.price}`}
                </Text>
              </View>
              {event.organizer && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Organizer</Text>
                  <Text style={styles.infoValue}>{event.organizer}</Text>
                </View>
              )}
            </View>

            {event.seriesName && (
              <View style={styles.seriesBadge}>
                <Text style={styles.seriesText}>{event.seriesName}</Text>
              </View>
            )}

            {event.raUrl && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => Linking.openURL(event.raUrl!)}
              >
                <Text style={styles.buttonText}>View on Resident Advisor</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>

      <Modal
        visible={!!selectedArtist}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedArtist(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalDismissZone} activeOpacity={1} onPress={() => setSelectedArtist(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedArtist}</Text>
            <View style={styles.artistLinks}>
              <TouchableOpacity
                style={styles.artistLinkBtn}
                onPress={() => Linking.openURL(`https://soundcloud.com/search?q=${encodeURIComponent(selectedArtist ?? '')}`)}
              >
                <Text style={styles.artistLinkText}>↗ SOUNDCLOUD</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.artistLinkBtn, { borderColor: 'rgba(255,85,0,0.5)' }]}
                onPress={() => residentAdvisorArtistUrl && Linking.openURL(residentAdvisorArtistUrl)}
              >
                <Text style={[styles.artistLinkText, { color: '#FF5500' }]}>↗ RA DJ PAGE</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Other parties in the database</Text>
            <Text style={styles.modalNote}>RA page uses a best-effort slug from the artist name.</Text>
            <ScrollView contentContainerStyle={styles.relatedEventsList}>
              {relatedArtistEvents.length ? relatedArtistEvents.map((relatedEvent) => (
                <TouchableOpacity
                  key={relatedEvent.id}
                  style={styles.relatedEventCard}
                  onPress={() => handleRelatedEventPress(relatedEvent.id)}
                >
                  <Text style={styles.relatedEventTitle}>{relatedEvent.title}</Text>
                  <Text style={styles.relatedEventMeta}>
                    {venueNameById[relatedEvent.venueId] ?? 'Unknown venue'} · {dataService.formatTime(relatedEvent.startTime)}
                  </Text>
                </TouchableOpacity>
              )) : (
                <Text style={styles.emptyRelatedText}>No other parties for this artist are in the local database yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'Afterparty': return COLORS.afterparty;
    case 'Day Party': return COLORS.dayParty;
    case 'Sunrise': return COLORS.sunrise;
    default: return COLORS.festival;
  }
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: COLORS.surface,
  },
  indicator: {
    backgroundColor: COLORS.textSecondary,
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  venueName: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  time: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  bodyText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  artistList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  artistLink: {
    color: '#60A5FA',
    fontSize: 14,
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  seriesBadge: {
    backgroundColor: COLORS.afterparty + '33',
    borderColor: COLORS.afterparty,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  seriesText: {
    color: COLORS.afterparty,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.textPrimary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalDismissZone: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.25)',
    borderRadius: 12,
    padding: 18,
    maxHeight: '70%',
    zIndex: 1,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  artistLinks: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  artistLinkBtn: {
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  artistLinkText: {
    color: COLORS.acid,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalNote: {
    color: 'rgba(204,255,0,0.45)',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  relatedEventsList: {
    paddingBottom: 8,
    gap: 10,
  },
  relatedEventCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.08)',
  },
  relatedEventTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  relatedEventMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyRelatedText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default EventBottomSheet;
