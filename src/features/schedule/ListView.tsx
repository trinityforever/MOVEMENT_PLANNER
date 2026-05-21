import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { getEventsByDay, getVenues, formatTime } from '../../services/dataService';
import { COLORS } from '../../constants/Theme';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Event } from '../../models/types';

interface ListViewProps {
  onEventSelect: (eventId: string) => void;
}

const DAYS = [
  { label: 'THU', date: '2026-05-21' },
  { label: 'FRI', date: '2026-05-22' },
  { label: 'SAT', date: '2026-05-23' },
  { label: 'SUN', date: '2026-05-24' },
  { label: 'MON', date: '2026-05-25' },
  { label: 'TUE', date: '2026-05-26' },
];

const monoFont = Platform.OS === 'web' ? "'Share Tech Mono', monospace" : undefined;
const displayFont = Platform.OS === 'web' ? "'Bebas Neue', sans-serif" : undefined;
const condensedFont = Platform.OS === 'web' ? "'Barlow Condensed', sans-serif" : undefined;

function getCategoryColor(category?: string) {
  switch (category) {
    case 'Afterparty': return COLORS.afterparty;
    case 'Day Party':  return COLORS.dayParty;
    case 'Sunrise':    return COLORS.sunrise;
    default:           return COLORS.festival;
  }
}

const ListView: React.FC<ListViewProps> = ({ onEventSelect }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(1); // default FRI
  const venues = useMemo(() => getVenues(), []);

  const selectedDate = DAYS[selectedDayIndex].date;
  const events = useMemo(
    () => getEventsByDay(selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [selectedDate],
  );

  const renderItem = ({ item }: { item: Event }) => {
    const venue = venues.find((v) => v.id === item.venueId);
    const color = getCategoryColor(item.category);
    return (
      <TouchableOpacity style={styles.eventItem} onPress={() => onEventSelect(item.id)} activeOpacity={0.7}>
        <View style={[styles.colorBar, { backgroundColor: color }]} />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(item.startTime)}</Text>
          <Text style={styles.timeEnd}>{formatTime(item.endTime)}</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.eventTitle, { color }]}>{item.title.toUpperCase()}</Text>
          <TouchableOpacity onPress={() => venue && router.push(`/map?venueId=${venue.id}`)}>
            <Text style={styles.venueName}>{(venue?.name ?? 'UNKNOWN VENUE').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.metaContainer}>
          {item.price != null && (
            <Text style={styles.priceText}>{item.price === 0 ? 'FREE' : `$${item.price}`}</Text>
          )}
          <View style={[styles.categoryBadge, { borderColor: color + '66' }]}>
            <Text style={[styles.categoryBadgeText, { color }]}>
              {(item.category ?? 'EVENT').toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.selectorContainer}>
        <SegmentedControl
          options={DAYS.map((d) => d.label)}
          selectedIndex={selectedDayIndex}
          onChange={setSelectedDayIndex}
        />
      </View>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>NO EVENTS THIS DAY</Text>
          </View>
        }
      />
    </View>
  );
};

export default ListView;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  selectorContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.2)',
  },
  listContent: { paddingBottom: 32 },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.06)',
  },
  colorBar: { width: 3, flexShrink: 0 },
  timeContainer: {
    width: 64,
    flexShrink: 0,
    padding: 10,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(204,255,0,0.08)',
  },
  timeText: {
    color: 'rgba(204,255,0,0.7)',
    fontSize: 11,
    fontFamily: monoFont,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeEnd: {
    color: 'rgba(204,255,0,0.3)',
    fontSize: 9,
    fontFamily: monoFont,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  contentContainer: { flex: 1, padding: 10, justifyContent: 'center', minWidth: 0 },
  eventTitle: {
    fontSize: 16,
    fontFamily: condensedFont,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  venueName: {
    color: 'rgba(204,255,0,0.45)',
    fontSize: 10,
    fontFamily: monoFont,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  metaContainer: {
    padding: 10,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
  },
  priceText: {
    color: COLORS.acid,
    fontSize: 11,
    fontFamily: monoFont,
    fontWeight: '700',
  },
  categoryBadge: {
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 8,
    fontFamily: monoFont,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyState: { padding: 48, alignItems: 'center' },
  emptyStateText: {
    color: 'rgba(204,255,0,0.25)',
    fontSize: 18,
    fontFamily: displayFont,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
