import eventsData from './events.json';
import venuesData from './venues.json';
import { Event, Venue } from './types';

describe('Data integrity', () => {
  describe('events.json', () => {
    const events = eventsData as Event[];

    it('has at least 10 events', () => {
      expect(events.length).toBeGreaterThanOrEqual(10);
    });

    it('every event id is unique', () => {
      const ids = events.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every event id starts with "event-"', () => {
      for (const event of events) {
        expect(event.id.startsWith('event-')).toBe(true);
      }
    });

    it('every event has a startTime before its endTime', () => {
      for (const event of events) {
        expect(new Date(event.startTime).getTime()).toBeLessThan(
          new Date(event.endTime).getTime()
        );
      }
    });

    it('every event startTime is during Movement weekend (May 21-26, 2026)', () => {
      const festivalStart = new Date('2026-05-21T00:00:00').getTime();
      const festivalEnd = new Date('2026-05-27T00:00:00').getTime();
      for (const event of events) {
        const start = new Date(event.startTime).getTime();
        expect(start).toBeGreaterThanOrEqual(festivalStart);
        expect(start).toBeLessThan(festivalEnd);
      }
    });

    it('every event.venueId references a known venue', () => {
      const venueIds = new Set((venuesData as Venue[]).map((v) => v.id));
      for (const event of events) {
        expect(venueIds.has(event.venueId)).toBe(true);
      }
    });
  });

  describe('venues.json', () => {
    const venues = venuesData as Venue[];

    it('has at least 8 venues', () => {
      expect(venues.length).toBeGreaterThanOrEqual(8);
    });

    it('every venue id is unique', () => {
      const ids = venues.map((v) => v.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every venue id starts with "venue-"', () => {
      for (const venue of venues) {
        expect(venue.id.startsWith('venue-')).toBe(true);
      }
    });

    it('venues with coordinates have valid lat/lng ranges', () => {
      for (const venue of venues) {
        if (venue.coordinates) {
          expect(venue.coordinates.latitude).toBeGreaterThan(40);
          expect(venue.coordinates.latitude).toBeLessThan(44);
          expect(venue.coordinates.longitude).toBeLessThan(-82);
          expect(venue.coordinates.longitude).toBeGreaterThan(-84);
        }
      }
    });
  });
});
