import eventsData from '../models/events.json';
import venuesData from '../models/venues.json';
import { Event, Venue, CustomLocation } from '../models/types';

const events = eventsData as Event[];
const venues = venuesData as Venue[];
const customLocations: CustomLocation[] = (() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem('customLocations');
      if (saved) return JSON.parse(saved);
    } catch { /* corrupted data, start fresh */ }
  }
  return [];
})();

function persistCustomLocations() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('customLocations', JSON.stringify(customLocations));
  }
}

export const getEvents = (): Event[] => {
  return events;
};

export const getVenues = (): Venue[] => {
  return venues;
};

export const getEventsByDay = (date: string): Event[] => {
  // date expected in 'YYYY-MM-DD' format
  return events.filter((event) => event.startTime.startsWith(date));
};

export const getEventsByVenue = (venueId: string): Event[] => {
  return events.filter((event) => event.venueId === venueId);
};

export const getEventsByArtist = (
  artistName: string,
  options?: { excludeEventId?: string }
): Event[] => {
  const normalizedArtist = artistName.trim().toLowerCase();
  if (!normalizedArtist) return [];

  return events
    .filter((event) => {
      if (options?.excludeEventId && event.id === options.excludeEventId) {
        return false;
      }

      return (event.artists ?? []).some(
        (artist) => artist.trim().toLowerCase() === normalizedArtist
      );
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

export const getCustomLocations = (): CustomLocation[] => {
  return customLocations;
};

export const addCustomLocation = (location: CustomLocation): void => {
  customLocations.push(location);
  persistCustomLocations();
};

export const removeCustomLocation = (id: string): void => {
  const idx = customLocations.findIndex((l) => l.id === id);
  if (idx >= 0) {
    customLocations.splice(idx, 1);
    persistCustomLocations();
  }
};

export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default {
  getEvents,
  getVenues,
  getEventsByDay,
  getEventsByVenue,
  getEventsByArtist,
  getCustomLocations,
  addCustomLocation,
  removeCustomLocation,
  formatTime,
};
