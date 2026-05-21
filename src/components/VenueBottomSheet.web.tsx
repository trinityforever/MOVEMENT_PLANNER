import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import { COLORS } from '../constants/Theme';
import dataService from '../services/dataService';

const monoFont = Platform.OS === 'web' ? "'Share Tech Mono', monospace" : undefined;
const displayFont = Platform.OS === 'web' ? "'Bebas Neue', sans-serif" : undefined;
const condensedFont = Platform.OS === 'web' ? "'Barlow Condensed', sans-serif" : undefined;
const DRAWER_WIDTH = 540;

function openMaps(address: string, city: string) {
  Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(`${address}, ${city}`)}`);
}

function getCategoryColor(category?: string) {
  switch (category) {
    case 'Afterparty': return COLORS.afterparty;
    case 'Day Party': return COLORS.dayParty;
    case 'Sunrise': return COLORS.sunrise;
    default: return COLORS.festival;
  }
}

interface VenueBottomSheetProps {
  venueId: string | null;
  onClose: () => void;
  onEventSelect: (eventId: string) => void;
}

const VenueBottomSheet: React.FC<VenueBottomSheetProps> = ({ venueId, onClose, onEventSelect }) => {
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  const venue = useMemo(
    () => (!venueId ? null : dataService.getVenues().find((currentVenue) => currentVenue.id === venueId)),
    [venueId],
  );

  const venueEvents = useMemo(
    () => (!venueId ? [] : dataService.getEventsByVenue(venueId).sort((a, b) => a.startTime.localeCompare(b.startTime))),
    [venueId],
  );

  useEffect(() => {
    if (!venueId) return;
    translateX.setValue(DRAWER_WIDTH);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [venueId, translateX]);

  if (!venue) return null;

  const handleClose = () => {
    Animated.timing(translateX, {
      toValue: DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: false,
    }).start(() => onClose());
  };

  return (
    <Modal visible={!!venueId} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissZone} activeOpacity={1} onPress={handleClose} />
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          <View style={styles.acidRule} />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={handleClose} style={styles.closeRow}>
              <Text style={styles.closeText}>× CLOSE</Text>
            </TouchableOpacity>

            <Text style={styles.venueName}>{venue.name.toUpperCase()}</Text>
            <TouchableOpacity onPress={() => openMaps(venue.address, venue.city)}>
              <Text style={styles.addressLink}>
                ↗ {venue.address.toUpperCase()}, {venue.city.toUpperCase()}
              </Text>
            </TouchableOpacity>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>EVENTS</Text>
                <Text style={styles.statValue}>{venueEvents.length}</Text>
              </View>
              {venue.popular && (
                <View style={[styles.statBox, styles.hotStatBox]}>
                  <Text style={[styles.statLabel, styles.hotText]}>STATUS</Text>
                  <Text style={[styles.statValue, styles.hotText]}>HOT</Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionLabel}>EVENTS AT THIS VENUE</Text>
            {venueEvents.length ? venueEvents.map((event) => {
              const color = getCategoryColor(event.category);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventItem}
                  onPress={() => {
                    handleClose();
                    setTimeout(() => onEventSelect(event.id), 120);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.eventColorBar, { backgroundColor: color }]} />
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
            }) : (
              <Text style={styles.emptyText}>NO EVENTS SCHEDULED AT THIS VENUE.</Text>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  dismissZone: {
    flex: 1,
  },
  drawer: {
    width: DRAWER_WIDTH,
    maxWidth: '42%',
    backgroundColor: '#000',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(204,255,0,0.12)',
    shadowColor: COLORS.acid,
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: -8, height: 0 },
    overflow: 'hidden',
  },
  acidRule: {
    height: 2,
    width: '100%',
    backgroundColor: COLORS.acid,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  closeRow: {
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  closeText: {
    color: 'rgba(204,255,0,0.45)',
    fontSize: 11,
    fontFamily: monoFont,
    letterSpacing: 2,
  },
  venueName: {
    fontSize: 54,
    lineHeight: 50,
    fontFamily: displayFont,
    fontWeight: '900',
    color: COLORS.acid,
    letterSpacing: 2,
    marginBottom: 10,
  },
  addressLink: {
    color: COLORS.pink,
    fontSize: 12,
    fontFamily: monoFont,
    letterSpacing: 1,
    marginBottom: 22,
    textDecorationLine: 'underline',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    minWidth: 110,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
    backgroundColor: '#070707',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hotStatBox: {
    borderColor: COLORS.pink + '66',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(204,255,0,0.42)',
    fontFamily: monoFont,
    letterSpacing: 2,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontFamily: displayFont,
    color: COLORS.acid,
    letterSpacing: 2,
  },
  hotText: {
    color: COLORS.pink,
  },
  sectionLabel: {
    fontSize: 10,
    color: 'rgba(204,255,0,0.32)',
    fontFamily: monoFont,
    letterSpacing: 3,
    marginBottom: 10,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.08)',
    backgroundColor: 'rgba(8,8,8,0.75)',
  },
  eventColorBar: {
    width: 4,
    flexShrink: 0,
  },
  eventInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: condensedFont,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  eventTime: {
    color: 'rgba(204,255,0,0.42)',
    fontSize: 11,
    fontFamily: monoFont,
    letterSpacing: 1,
  },
  eventBadge: {
    alignSelf: 'center',
    marginRight: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eventBadgeText: {
    fontSize: 9,
    fontFamily: monoFont,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  emptyText: {
    color: 'rgba(204,255,0,0.32)',
    fontSize: 12,
    fontFamily: monoFont,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 24,
  },
});

export default VenueBottomSheet;
