import {
  getEvents,
  getVenues,
  getEventsByDay,
  getEventsByVenue,
  getEventsByArtist,
  getResidentAdvisorArtistUrl,
  formatTime,
} from './dataService';

describe('dataService', () => {
  describe('getEvents', () => {
    it('returns a non-empty array of events', () => {
      const events = getEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('every event has required fields', () => {
      const events = getEvents();
      for (const event of events) {
        expect(typeof event.id).toBe('string');
        expect(event.id.length).toBeGreaterThan(0);
        expect(typeof event.title).toBe('string');
        expect(typeof event.venueId).toBe('string');
        expect(typeof event.startTime).toBe('string');
        expect(event.startTime).toMatch(/^2026-05-\d{2}T\d{2}:\d{2}:\d{2}$/);
      }
    });
  });

  describe('getVenues', () => {
    it('returns a non-empty array of venues', () => {
      const venues = getVenues();
      expect(Array.isArray(venues)).toBe(true);
      expect(venues.length).toBeGreaterThan(0);
    });

    it('every venue has required fields', () => {
      const venues = getVenues();
      for (const venue of venues) {
        expect(typeof venue.id).toBe('string');
        expect(venue.id.length).toBeGreaterThan(0);
        expect(typeof venue.name).toBe('string');
        expect(typeof venue.address).toBe('string');
        expect(typeof venue.city).toBe('string');
      }
    });
  });

  describe('getEventsByDay', () => {
    it('filters events by date prefix', () => {
      const may21 = getEventsByDay('2026-05-21');
      expect(may21.length).toBeGreaterThan(0);
      for (const event of may21) {
        expect(event.startTime.startsWith('2026-05-21')).toBe(true);
      }
    });

    it('returns empty array for a day with no events', () => {
      const may20 = getEventsByDay('2026-05-20');
      expect(may20).toEqual([]);
    });
  });

  describe('getEventsByVenue', () => {
    it('filters events by venueId', () => {
      const events = getEventsByVenue('venue-tangent');
      expect(events.length).toBeGreaterThan(0);
      for (const event of events) {
        expect(event.venueId).toBe('venue-tangent');
      }
    });

    it('returns empty array for unknown venue', () => {
      expect(getEventsByVenue('nonexistent')).toEqual([]);
    });
  });

  describe('getEventsByArtist', () => {
    it('filters events by artist name across the dataset', () => {
      const events = getEventsByArtist('Mike Servito');
      expect(events.length).toBeGreaterThan(1);
      for (const event of events) {
        expect(event.artists).toContain('Mike Servito');
      }
    });

    it('can exclude the current event from related results', () => {
      const allEvents = getEventsByArtist('Mike Servito');
      const [firstEvent] = allEvents;
      expect(firstEvent).toBeDefined();

      const relatedEvents = getEventsByArtist('Mike Servito', { excludeEventId: firstEvent.id });
      expect(relatedEvents.some((event) => event.id === firstEvent.id)).toBe(false);
    });

    it('matches artist names case-insensitively', () => {
      expect(getEventsByArtist('mike servito')).toEqual(getEventsByArtist('Mike Servito'));
    });

    it('returns the exact set of matching events for every artist in the dataset', () => {
      const events = getEvents();
      const artistNames = new Set(
        events.flatMap((event) => event.artists ?? [])
      );

      for (const artistName of artistNames) {
        const expectedEventIds = events
          .filter((event) =>
            (event.artists ?? []).some(
              (artist) => artist.trim().toLowerCase() === artistName.trim().toLowerCase()
            )
          )
          .map((event) => event.id)
          .sort();

        const actualEventIds = getEventsByArtist(artistName)
          .map((event) => event.id)
          .sort();

        expect(actualEventIds).toEqual(expectedEventIds);
      }
    });

    it('has no artist-name collisions that differ only by case or whitespace', () => {
      const events = getEvents();
      const variantsByNormalizedArtist = new Map<string, Set<string>>();

      for (const event of events) {
        for (const artist of event.artists ?? []) {
          const normalizedArtist = artist.trim().toLowerCase();
          const variants = variantsByNormalizedArtist.get(normalizedArtist) ?? new Set<string>();
          variants.add(artist);
          variantsByNormalizedArtist.set(normalizedArtist, variants);
        }
      }

      const collisions = [...variantsByNormalizedArtist.values()].filter(
        (variants) => variants.size > 1
      );

      expect(collisions).toEqual([]);
    });
  });

  describe('getResidentAdvisorArtistUrl', () => {
    it('builds the expected RA DJ url for simple names', () => {
      expect(getResidentAdvisorArtistUrl('FAITED')).toBe('https://ra.co/dj/faited');
      expect(getResidentAdvisorArtistUrl('Mike Servito')).toBe('https://ra.co/dj/mikeservito');
    });

    it('strips punctuation, accents, and parenthetical suffixes', () => {
      expect(getResidentAdvisorArtistUrl('De León')).toBe('https://ra.co/dj/deleon');
      expect(getResidentAdvisorArtistUrl('John Collins (US)')).toBe('https://ra.co/dj/johncollins');
    });
  });

  describe('formatTime', () => {
    it('formats ISO time to HH:MM', () => {
      expect(formatTime('2026-05-21T22:00:00')).toBe('22:00');
    });

    it('preserves 24-hour format', () => {
      expect(formatTime('2026-05-22T14:30:00')).toBe('14:30');
    });

    it('zero-pads single-digit hours', () => {
      expect(formatTime('2026-05-22T06:05:00')).toBe('06:05');
    });

    it('handles midnight', () => {
      expect(formatTime('2026-05-21T00:00:00')).toBe('00:00');
    });
  });
});
