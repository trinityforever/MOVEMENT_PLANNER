import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { COLORS } from '../constants/Theme';
import { Event, Venue } from '../models/types';
import dataService from '../services/dataService';

function openMaps(address: string, city: string) {
  const query = encodeURIComponent(`${address}, ${city}`);
  const url = Platform.select({
    ios: `maps://?q=${query}`,
    android: `geo:0,0?q=${query}`,
    default: `https://maps.google.com/?q=${query}`,
  });
  Linking.openURL(url);
}

interface VenueBottomSheetProps {
  venueId: string | null;
  onClose: () => void;
  onEventSelect: (eventId: string) => void;
}

const VenueBottomSheet: React.FC<VenueBottomSheetProps> = ({ venueId, onClose, onEventSelect }) => {
  const snapPoints = useMemo(() => ['35%', '60%'], []);

  const venue = useMemo(() => {
    if (!venueId) return null;
    return dataService.getVenues().find((v) => v.id === venueId);
  }, [venueId]);

  const venueEvents = useMemo(() => {
    if (!venueId) return [];
    return dataService.getEventsByVenue(venueId);
  }, [venueId]);

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

  if (!venue) return null;

  return (
    <BottomSheet
      index={venueId ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{venue.name}</Text>
          <TouchableOpacity onPress={() => openMaps(venue.address, venue.city)}>
            <Text style={styles.addressLink}>{venue.address}, {venue.city}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Events at this venue</Text>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {venueEvents.length > 0 ? (
            venueEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventItem}
                onPress={() => onEventSelect(event.id)}
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
      </BottomSheetView>
    </BottomSheet>
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