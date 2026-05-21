import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import ScreenLayout from '../../components/ScreenLayout';
import GanttView from './GanttView';
import EventBottomSheet from '../../components/EventBottomSheet';

export default function ScheduleScreen() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleEventSelect = (eventId: string) => setSelectedEventId(eventId);
  const handleVenueSelect = (venueId: string) => router.push(`/map?venueId=${venueId}`);
  const handleCloseBottomSheet = () => setSelectedEventId(null);

  return (
    <ScreenLayout title="Schedule">
      <View style={styles.container}>
        <GanttView onEventSelect={handleEventSelect} onVenueSelect={handleVenueSelect} />
      </View>

      <EventBottomSheet
        eventId={selectedEventId}
        onClose={handleCloseBottomSheet}
        onEventSelect={handleEventSelect}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
