import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal } from 'react-native';
import { COLORS } from '../constants/Theme';
import dataService from '../services/dataService';

interface EventBottomSheetProps {
  eventId: string | null;
  onClose: () => void;
}

const EventBottomSheet: React.FC<EventBottomSheetProps> = ({ eventId, onClose }) => {
  const event = useMemo(() => {
    if (!eventId) return null;
    return dataService.getEvents().find((e) => e.id === eventId);
  }, [eventId]);

  const venue = useMemo(() => {
    if (!event) return null;
    return dataService.getVenues().find((v) => v.id === event.venueId);
  }, [event]);

  if (!event) return null;

  const isFree = event.price === 0 || event.priceNote === 'FREE';

  return (
    <Modal visible={!!eventId} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) }]}>
                <Text style={styles.categoryText}>{event.category}</Text>
              </View>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.venueName}>{venue?.name}</Text>
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
                      onPress={() => Linking.openURL(`https://soundcloud.com/search?q=${encodeURIComponent(artist)}`)}
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
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '40%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  content: {
    padding: 16,
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
});

export default EventBottomSheet;
