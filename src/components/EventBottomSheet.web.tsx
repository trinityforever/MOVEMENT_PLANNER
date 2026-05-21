import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, Platform } from 'react-native';
import { COLORS } from '../constants/Theme';
import dataService from '../services/dataService';

interface EventBottomSheetProps {
  eventId: string | null;
  onClose: () => void;
}

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

const EventBottomSheet: React.FC<EventBottomSheetProps> = ({ eventId, onClose }) => {
  const event = useMemo(
    () => (!eventId ? null : dataService.getEvents().find((e) => e.id === eventId)),
    [eventId],
  );
  const venue = useMemo(
    () => (!event ? null : dataService.getVenues().find((v) => v.id === event.venueId)),
    [event],
  );

  if (!event) return null;

  const color = getCategoryColor(event.category);
  const isFree = event.price === 0 || event.priceNote === 'FREE';
  const priceDisplay = isFree ? 'FREE' : event.price != null ? `$${event.price}` : '—';

  return (
    <Modal visible={!!eventId} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          {/* Top accent bar */}
          <View style={[styles.accentBar, { backgroundColor: color }]} />

          <ScrollView contentContainerStyle={styles.content}>
            {/* Close */}
            <TouchableOpacity onPress={onClose} style={styles.closeRow}>
              <Text style={styles.closeText}>✕ CLOSE</Text>
            </TouchableOpacity>

            {/* Artist name — Bebas Neue + glitch vibe */}
            <Text style={[styles.artistName, { color }]}>{event.title.toUpperCase()}</Text>

            {/* Category tag */}
            <View style={[styles.categoryTag, { borderColor: color + '66' }]}>
              <Text style={[styles.categoryTagText, { color }]}>
                {(event.category ?? 'EVENT').toUpperCase()}
              </Text>
            </View>

            {/* Detail grid */}
            <View style={styles.detailGrid}>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>VENUE</Text>
                <Text style={styles.detailValue}>{(venue?.name ?? '—').toUpperCase()}</Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>PRICE</Text>
                <Text style={[styles.detailValue, isFree && { color: COLORS.festival }]}>
                  {priceDisplay}
                </Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>TIME</Text>
                <Text style={styles.detailValue}>
                  {dataService.formatTime(event.startTime)} – {dataService.formatTime(event.endTime)}
                </Text>
              </View>
              {event.organizer && (
                <View style={styles.detailCell}>
                  <Text style={styles.detailLabel}>ORGANIZER</Text>
                  <Text style={styles.detailValue}>{event.organizer.toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Artists */}
            {!!event.artists?.length && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>LINEUP</Text>
                <View style={styles.artistList}>
                  {event.artists.map((artist, i) => (
                    <TouchableOpacity
                      key={artist}
                      onPress={() =>
                        Linking.openURL(`https://soundcloud.com/search?q=${encodeURIComponent(artist)}`)
                      }
                    >
                      <Text style={styles.artistLink}>
                        {artist.toUpperCase()}
                        {i < event.artists!.length - 1 ? '  ·  ' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Description */}
            {!!event.description && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>INFO</Text>
                <Text style={styles.bodyText}>{event.description}</Text>
              </View>
            )}

            {/* Series badge */}
            {!!event.seriesName && (
              <View style={[styles.seriesBadge, { borderColor: color + '55' }]}>
                <Text style={[styles.seriesText, { color }]}>{event.seriesName.toUpperCase()}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: color, shadowColor: color }]}>
                <Text style={styles.btnPrimaryText}>+ MY PLAN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSecondary, { borderColor: color + '55' }]}>
                <Text style={[styles.btnSecondaryText, { color }]}>WANT TO GO</Text>
              </TouchableOpacity>
            </View>

            {event.raUrl && (
              <TouchableOpacity
                style={styles.btnRa}
                onPress={() => Linking.openURL(event.raUrl!)}
              >
                <Text style={styles.btnRaText}>↗ VIEW ON RESIDENT ADVISOR</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#000',
    borderTopWidth: 2,
    borderTopColor: COLORS.acid,
    maxHeight: '75%',
    shadowColor: COLORS.acid,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
  },
  accentBar: { height: 2, width: '100%' },
  content: { padding: 16, paddingBottom: 40 },
  closeRow: { marginBottom: 12 },
  closeText: {
    color: 'rgba(204,255,0,0.4)',
    fontSize: 10,
    fontFamily: monoFont,
    letterSpacing: 2,
  },
  artistName: {
    fontSize: 40,
    fontFamily: displayFont,
    fontWeight: '900',
    letterSpacing: 3,
    lineHeight: 42,
    marginBottom: 8,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 14,
  },
  categoryTagText: {
    fontSize: 9,
    fontFamily: monoFont,
    fontWeight: '700',
    letterSpacing: 2,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.15)',
    marginBottom: 14,
  },
  detailCell: {
    width: '50%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.1)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(204,255,0,0.1)',
    backgroundColor: '#0a0a0a',
  },
  detailLabel: {
    fontSize: 9,
    color: 'rgba(204,255,0,0.4)',
    fontFamily: monoFont,
    letterSpacing: 1,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    color: '#fff',
    fontFamily: condensedFont,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 9,
    color: 'rgba(204,255,0,0.4)',
    fontFamily: monoFont,
    letterSpacing: 2,
    marginBottom: 6,
  },
  artistList: { flexDirection: 'row', flexWrap: 'wrap' },
  artistLink: {
    color: COLORS.acid,
    fontSize: 13,
    fontFamily: monoFont,
    lineHeight: 22,
  },
  bodyText: {
    color: 'rgba(204,255,0,0.7)',
    fontSize: 12,
    fontFamily: monoFont,
    lineHeight: 18,
  },
  seriesBadge: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
    alignItems: 'center',
  },
  seriesText: {
    fontSize: 11,
    fontFamily: monoFont,
    fontWeight: '700',
    letterSpacing: 2,
  },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnPrimary: {
    flex: 1,
    alignItems: 'center',
    padding: 13,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  btnPrimaryText: {
    color: '#000',
    fontSize: 13,
    fontFamily: displayFont,
    fontWeight: '900',
    letterSpacing: 2,
  },
  btnSecondary: {
    flex: 1,
    alignItems: 'center',
    padding: 13,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontFamily: displayFont,
    fontWeight: '900',
    letterSpacing: 2,
  },
  btnRa: {
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
    padding: 13,
    alignItems: 'center',
  },
  btnRaText: {
    color: 'rgba(204,255,0,0.5)',
    fontSize: 11,
    fontFamily: monoFont,
    letterSpacing: 1.5,
  },
});

export default EventBottomSheet;
