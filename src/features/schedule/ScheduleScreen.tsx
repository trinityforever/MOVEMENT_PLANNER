import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import ScreenLayout from '../../components/ScreenLayout';
import ListView from './ListView';
import GanttView from './GanttView';
import { SegmentedControl } from '../../components/SegmentedControl';
import EventBottomSheet from '../../components/EventBottomSheet';
import { COLORS, SPACING } from '../../constants/Theme';

export default function ScheduleScreen() {
  const [viewMode, setViewMode] = useState(0); // 0: Gantt, 1: List
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleVenueSelect = (venueId: string) => {
    router.push(`/map?venueId=${venueId}`);
  };

  const handleCloseBottomSheet = () => {
    setSelectedEventId(null);
  };

  return (
    <ScreenLayout title="Schedule">
      <View style={styles.header}>
        <SegmentedControl
          options={['Gantt', 'List']}
          selectedIndex={viewMode}
          onChange={setViewMode}
        />
      </View>
      
      <View style={styles.container}>
        {viewMode === 0 ? (
          <GanttView onEventSelect={handleEventSelect} onVenueSelect={handleVenueSelect} />
        ) : (
          <ListView onEventSelect={handleEventSelect} />
        )}
      </View>

      <EventBottomSheet 
        eventId={selectedEventId} 
        onClose={handleCloseBottomSheet} 
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
});
