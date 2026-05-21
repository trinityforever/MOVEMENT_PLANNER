import React, { useState, useCallback, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import MapScreen from '../features/venues/MapScreen';
import VenueBottomSheet from '../components/VenueBottomSheet';
import EventBottomSheet from '../components/EventBottomSheet';
import AddLocationModal from '../components/AddLocationModal';
import { getCustomLocations, addCustomLocation } from '../services/dataService';
import { CustomLocation } from '../models/types';

export default function MapTab() {
  const params = useLocalSearchParams<{ venueId?: string }>();
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customLocations, setCustomLocations] = useState<CustomLocation[]>(getCustomLocations);

  useEffect(() => {
    if (params.venueId) {
      setSelectedVenueId(params.venueId);
    }
  }, [params.venueId]);

  const handleVenueSelect = (venueId: string) => {
    setSelectedVenueId(venueId);
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleCloseVenueSheet = () => {
    setSelectedVenueId(null);
  };

  const handleCloseEventSheet = () => {
    setSelectedEventId(null);
  };

  const handleAddCustomLocation = useCallback((location: CustomLocation) => {
    addCustomLocation(location);
    setCustomLocations([...getCustomLocations()]);
  }, []);

  return (
    <>
      <MapScreen
        onVenueSelect={handleVenueSelect}
        customLocations={customLocations}
        onAddPress={() => setShowAddModal(true)}
      />

      <VenueBottomSheet
        venueId={selectedVenueId}
        onClose={handleCloseVenueSheet}
        onEventSelect={handleEventSelect}
      />

      <EventBottomSheet
        eventId={selectedEventId}
        onClose={handleCloseEventSheet}
        onEventSelect={handleEventSelect}
      />

      <AddLocationModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCustomLocation}
      />
    </>
  );
}
