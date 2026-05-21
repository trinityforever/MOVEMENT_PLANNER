import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Linking, Platform } from 'react-native';
import { COLORS } from '../constants/Theme';
import dataService from '../services/dataService';

const monoFont = Platform.OS === 'web' ? "'Share Tech Mono', monospace" : undefined;
const displayFont = Platform.OS === 'web' ? "'Bebas Neue', sans-serif" : undefined;
const condensedFont = Platform.OS === 'web' ? "'Barlow Condensed', sans-serif" : undefined;

function openMaps(address: string, city: string) {
  Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(`${address}, ${city}`)}`);
}

function getCategoryColor(category?: string) {
  switch (category) {
    case 'Afterparty': return COLORS.afterparty;
    case 'Day Party':  return COLORS.dayParty;
    case 'Sunrise':    return COLORS.sunrise;
    default:           return COLORS.festival;
  }
}

interface VenueBottomSheetProps {
  venueId: string | null;
  onClose: () => void;
  onEventSelect: (eventId: string) => void;
}

const VenueBottomSheet: React.FC<VenueBottomSheetProps> = ({ venueId, onClose, onEventSelect }) => {
  const venue = useMemo(
    () => (!venueId ? null : dataService.getVenues().find((v) => v.id === venueId)),
    [venueId],
  );
  const venueEvents = useMemo(
    () => (!venueId ? [] : dataService.getEventsByVenue(venueId)),
    [venueId],
  );

  if (!venue) return null;

  return (
    <Modal visible={!!venueId} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.accentBar} />
          <ScrollView contentContainerStyle={styles.content}>
            {/* Close */}
            <TouchableOpacity onPress={onClose} style={styles.closeRow}>
              <Text style={styles.closeText}>✕ CLOSE</Text>
            </TouchableOpacity>

            {/* Venue name */}
            <Text style={styles.venueName}>{venue.name.toUpperCase()}</Text>
            <TouchableOpacity onPress={() => openMaps(venue.address, venue.city)}>
              <Text style={styles.addressLink}>
                ↗ {venue.address.toUpperCase()}, {venue.city.toUpperCase()}
              </Text>
            </TouchableOpacity>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>EVENTS</Text>
                <Text style={styles.statValue}>{venueEvents.length}</Text>
              </View>
              {venue.popular && (
                <View style={[styles.statBox, { borderColor: COLORS.pink + '66' }]}>
                  <Text style={[styles.statLabel, { color: COLORS.pink }]}>STATUS</Text>
                  <Text style={[styles.statValue, { color: COLORS.pink }]}>HOT</Text>
                </View>
              )}
            </View>

            {/* Events list */}
            <Text style={styles.sectionLabel}>EVENTS AT THIS VENUE</Text>
            {venueEvents.length > 0 ? (
              venueEvents.map((event) => {
                const color = getCategoryColor(event.category);
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventItem}
                    onPress={() => { onClose(); setTimeout(() => onEventSelect(event.id), 100); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.colorBar, { backgroundColor: color }]} />
                    <View style={styles.eventInfo}>
                      <Text style={[styles.eventTitle, { color }]}>{event.title.toUpperCase()}</Text>
                      <Text style={styles.eventTime}>
                        {dataService.formatTime(event.startTime)} – {dataService.formatTime(event.endTime)}
                      </Text>
                    </View>
                    <View style={[styles.eventBadge, { borderColor: color + '55' }]}>
                      <Text style={[styles.eventBadgeText, { color }]}>
                        {(event.category ?? 'EVENT').toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyText}>NO EVENTS SCHEDULED</Text>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#000',
    borderTopWidth: 2,
    borderTopColor: COLORS.acid,
    maxHeight: '65%',
    shadowColor: COLORS.acid,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  accentBar: { height: 2, backgroundColor: COLORS.acid, width: '100%' },
  content: { padding: 16, paddingBottom: 40 },
  closeRow: { marginBottom: 12 },
  closeText: {
    color: 'rgba(204,255,0,0.4)',
    fontSize: 10,
    fontFamily: monoFont,
    letterSpacing: 2,
  },
  venueName: {
    fontSize: 36,
    fontFamily: displayFont,
    fontWeight: '900',
    color: COLORS.acid,
    letterSpacing: 3,
    lineHeight: 38,
    marginBottom: 6,
  },
  addressLink: {
    color: COLORS.pink,
    fontSize: 10,
    fontFamily: monoFont,
    letterSpacing: 0.5,
    marginBottom: 14,
    textDecorationLine: 'underline',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0a0a0a',
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(204,255,0,0.4)',
    fontFamily: monoFont,
    letterSpacing: 1,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontFamily: displayFont,
    color: COLORS.acid,
    letterSpacing: 2,
  },
  sectionLabel: {
    fontSize: 9,
    color: 'rgba(204,255,0,0.4)',
    fontFamily: monoFont,
    letterSpacing: 2,
    marginBottom: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.06)',
  },
  colorBar: { width: 3, flexShrink: 0 },
  eventInfo: { flex: 1, padding: 10 },
  eventTitle: {
    fontSize: 14,
    fontFamily: condensedFont,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  eventTime: {
    color: 'rgba(204,255,0,0.45)',
    fontSize: 10,
    fontFamily: monoFont,
    letterSpacing: 0.5,
  },
  eventBadge: {
    borderWidth: 1,
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 10,
  },
  eventBadgeText: {
    fontSize: 8,
    fontFamily: monoFont,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyText: {
    color: 'rgba(204,255,0,0.25)',
    fontSize: 13,
    fontFamily: monoFont,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default VenueBottomSheet;
