import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Linking } from 'react-native';
import { COLORS } from '../constants/Theme';
import dataService from '../services/dataService';

function openMaps(address: string, city: string) {
  const query = encodeURIComponent(`${address}, ${city}`);
  Linking.openURL(`https://maps.google.com/?q=${query}`);
}

interface VenueBottomSheetProps {
  venueId: string | null;
  onClose: () => void;
  onEventSelect: (eventId: string) => void;
}

const VenueBottomSheet: React.FC<VenueBottomSheetProps> = ({ venueId, onClose, onEventSelect }) => {
  const venue = useMemo(() => {
    if (!venueId) return null;
    return dataService.getVenues().find((v) => v.id === venueId);
  }, [venueId]);

  const venueEvents = useMemo(() => {
    if (!venueId) return [];
    return dataService.getEventsByVenue(venueId);
  }, [venueId]);

  if (!venue) return null;

  return (
    <Modal visible={!!venueId} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{venue.name}</Text>
              <TouchableOpacity onPress={() => openMaps(venue.address, venue.city)}>
                <Text style={styles.addressLink}>{venue.address}, {venue.city}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Events at this venue</Text>
            {venueEvents.length > 0 ? (
              venueEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventItem}
                  onPress={() => {
                    onClose();
                    setTimeout(() => onEventSelect(event.id), 100);
                  }}
                >
                  <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor(event.category) }]} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>
                      {dataService.formatTime(event.startTime)} – {dataService.formatTime(event.endTime)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No events scheduled at this venue.</Text>
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
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  addressLink: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryIndicator: {
    width: 5,
  },
  eventInfo: {
    flex: 1,
    padding: 10,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  eventTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default VenueBottomSheet;
