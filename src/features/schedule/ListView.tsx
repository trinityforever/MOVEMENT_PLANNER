import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { getEventsByDay, getVenues, formatTime } from '../../services/dataService';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/Theme';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Event } from '../../models/types';

interface ListViewProps {
  onEventSelect: (eventId: string) => void;
}

const DAYS = [
  { label: 'Thu', date: '2026-05-21' },
  { label: 'Fri', date: '2026-05-22' },
  { label: 'Sat', date: '2026-05-23' },
  { label: 'Sun', date: '2026-05-24' },
  { label: 'Mon', date: '2026-05-25' },
  { label: 'Tue', date: '2026-05-26' },
];

const ListView: React.FC<ListViewProps> = ({ onEventSelect }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const venues = useMemo(() => getVenues(), []);
  
  const selectedDate = DAYS[selectedDayIndex].date;
  const events = useMemo(() => {
    return getEventsByDay(selectedDate).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
  }, [selectedDate]);

  const renderItem = ({ item }: { item: Event }) => {
    const venue = venues.find((v) => v.id === item.venueId);
    return (
      <TouchableOpacity 
        style={styles.eventItem} 
        onPress={() => onEventSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(item.startTime)}</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.venueName} onPress={() => venue && router.push(`/map?venueId=${venue.id}`)}>{venue?.name || 'Unknown Venue'}</Text>
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
            <Text style={styles.emptyStateText}>No events scheduled for this day.</Text>
          </View>
        }
      />
    </View>
  );
};

export default ListView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  selectorContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeContainer: {
    width: 60,
    marginRight: SPACING.md,
    justifyContent: 'center',
  },
  timeText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800', // High contrast / bold
    fontVariant: ['tabular-nums'],
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  venueName: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
