import React, { useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import ScreenLayout from '../../components/ScreenLayout';
import ListView from './ListView';
import GanttView from './GanttView';
import { SegmentedControl } from '../../components/SegmentedControl';
import EventBottomSheet from '../../components/EventBottomSheet';
import { COLORS, SPACING } from '../../constants/Theme';

const monoFont = Platform.OS === 'web' ? "'Share Tech Mono', monospace" : undefined;

export default function ScheduleScreen() {
  const [viewMode, setViewMode] = useState(0); // 0: Gantt, 1: List
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleEventSelect = (eventId: string) => setSelectedEventId(eventId);
  const handleVenueSelect = (venueId: string) => router.push(`/map?venueId=${venueId}`);
  const handleCloseBottomSheet = () => setSelectedEventId(null);

  return (
    <ScreenLayout title="Schedule">
      <View style={styles.toolbar}>
        <SegmentedControl
          options={['Gantt', 'List']}
          selectedIndex={viewMode}
          onChange={setViewMode}
        />
        <Text style={styles.subtitle}>79 EVENTS · 41 VENUES</Text>
      </View>

      <View style={styles.container}>
        {viewMode === 0 ? (
          <GanttView onEventSelect={handleEventSelect} onVenueSelect={handleVenueSelect} />
        ) : (
          <ListView onEventSelect={handleEventSelect} />
        )}
      </View>

      <EventBottomSheet eventId={selectedEventId} onClose={handleCloseBottomSheet} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.15)',
    backgroundColor: COLORS.background,
  },
  subtitle: {
    fontSize: 9,
    color: 'rgba(204,255,0,0.4)',
    fontFamily: monoFont,
    letterSpacing: 1.5,
  },
  container: { flex: 1 },
});
