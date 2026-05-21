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
  useWindowDimensions,
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
  const { width, height } = useWindowDimensions();
  const isCompactScreen = width < 768;
  const hiddenOffset = isCompactScreen ? Math.min(height * 0.82, 680) : DRAWER_WIDTH;
  const translate = useRef(new Animated.Value(DRAWER_WIDTH)).current;

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
    translate.setValue(hiddenOffset);
    Animated.timing(translate, {
      toValue: 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [venueId, hiddenOffset, translate]);

  if (!venue) return null;

  const handleClose = () => {
    Animated.timing(translate, {
      toValue: hiddenOffset,
      duration: 220,
      useNativeDriver: false,
    }).start(() => onClose());
  };

  return (
    <Modal visible={!!venueId} transparent animationType="none" onRequestClose={handleClose}>
      <View style={[styles.backdrop, isCompactScreen && styles.backdropCompact]}>
        <TouchableOpacity style={styles.dismissZone} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={[
            styles.drawer,
            isCompactScreen ? styles.drawerCompact : styles.drawerDesktop,
            {
              transform: isCompactScreen
                ? [{ translateY: translate }]
                : [{ translateX: translate }],
            },
          ]}
        >
          <View style={styles.acidRule} />

          <ScrollView
            contentContainerStyle={[styles.content, isCompactScreen && styles.contentCompact]}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity onPress={handleClose} style={styles.closeRow}>
              <Text style={styles.closeText}>× CLOSE</Text>
            </TouchableOpacity>

            <Text style={[styles.venueName, isCompactScreen && styles.venueNameCompact]}>
              {venue.name.toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => openMaps(venue.address, venue.city)}>
              <Text style={[styles.addressLink, isCompactScreen && styles.addressLinkCompact]}>
                ↗ {venue.address.toUpperCase()}, {venue.city.toUpperCase()}
              </Text>
            </TouchableOpacity>

            <View style={[styles.statsRow, isCompactScreen && styles.statsRowCompact]}>
              <View style={[styles.statBox, isCompactScreen && styles.statBoxCompact]}>
                <Text style={styles.statLabel}>EVENTS</Text>
                <Text style={styles.statValue}>{venueEvents.length}</Text>
              </View>
              {venue.popular && (
                <View style={[styles.statBox, styles.hotStatBox, isCompactScreen && styles.statBoxCompact]}>
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
                  style={[styles.eventItem, isCompactScreen && styles.eventItemCompact]}
                  onPress={() => {
                    handleClose();
                    setTimeout(() => onEventSelect(event.id), 120);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.eventColorBar, { backgroundColor: color }]} />
                  <View style={[styles.eventInfo, isCompactScreen && styles.eventInfoCompact]}>
                    <Text style={[styles.eventTitle, { color }, isCompactScreen && styles.eventTitleCompact]}>
                      {event.title.toUpperCase()}
                    </Text>
                    <Text style={[styles.eventTime, isCompactScreen && styles.eventTimeCompact]}>
                      {dataService.formatTime(event.startTime)} – {dataService.formatTime(event.endTime)}
                    </Text>
                  </View>
                  <View style={[styles.eventBadge, isCompactScreen && styles.eventBadgeCompact, { borderColor: color + '55' }]}>
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
  backdropCompact: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  dismissZone: {
    flex: 1,
  },
  drawer: {
    backgroundColor: '#000',
    shadowColor: COLORS.acid,
    shadowOpacity: 0.18,
    shadowRadius: 26,
    overflow: 'hidden',
  },
  drawerDesktop: {
    width: DRAWER_WIDTH,
    maxWidth: '42%',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(204,255,0,0.12)',
    shadowOffset: { width: -8, height: 0 },
  },
  drawerCompact: {
    width: '100%',
    maxWidth: '100%',
    maxHeight: '82%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(204,255,0,0.12)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowOffset: { width: 0, height: -8 },
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
  contentCompact: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
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
  venueNameCompact: {
    fontSize: 34,
    lineHeight: 34,
    marginBottom: 8,
  },
  addressLink: {
    color: COLORS.pink,
    fontSize: 12,
    fontFamily: monoFont,
    letterSpacing: 1,
    marginBottom: 22,
    textDecorationLine: 'underline',
  },
  addressLinkCompact: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statsRowCompact: {
    gap: 8,
    marginBottom: 18,
  },
  statBox: {
    minWidth: 110,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
    backgroundColor: '#070707',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statBoxCompact: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  eventItemCompact: {
    flexWrap: 'wrap',
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
  eventInfoCompact: {
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: condensedFont,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  eventTitleCompact: {
    fontSize: 14,
    lineHeight: 16,
  },
  eventTime: {
    color: 'rgba(204,255,0,0.42)',
    fontSize: 11,
    fontFamily: monoFont,
    letterSpacing: 1,
  },
  eventTimeCompact: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  eventBadge: {
    alignSelf: 'center',
    marginRight: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eventBadgeCompact: {
    marginRight: 0,
    marginLeft: 12,
    marginBottom: 12,
    alignSelf: 'flex-start',
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
