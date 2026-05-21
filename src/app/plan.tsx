import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Platform, FlatList, TextInput,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { COLORS } from '../constants/Theme';
import dataService from '../services/dataService';
import { Event } from '../models/types';

// ─── Fonts ───────────────────────────────────────────────────────────────────
const monoFont = Platform.OS === 'web' ? "'Share Tech Mono', monospace" : undefined;
const displayFont = Platform.OS === 'web' ? "'Bebas Neue', sans-serif" : undefined;
const condensedFont = Platform.OS === 'web' ? "'Barlow Condensed', sans-serif" : undefined;

// ─── Persistence (localStorage RSVP state) ───────────────────────────────────
type RsvpState = 'going' | 'want' | null;

function loadRsvps(): Record<string, RsvpState> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('rsvps_v1');
      if (raw) return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return {};
}

function saveRsvps(map: Record<string, RsvpState>) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('rsvps_v1', JSON.stringify(map));
    }
  } catch { /* ignore */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCategoryColor(category?: string) {
  switch (category) {
    case 'Afterparty': return COLORS.afterparty;
    case 'Day Party':  return COLORS.dayParty;
    case 'Sunrise':    return COLORS.sunrise;
    default:           return COLORS.festival;
  }
}

const DAYS = [
  { key: '2026-05-21', label: 'THU 21' },
  { key: '2026-05-22', label: 'FRI 22' },
  { key: '2026-05-23', label: 'SAT 23' },
  { key: '2026-05-24', label: 'SUN 24' },
  { key: '2026-05-25', label: 'MON 25' },
];

const TABS = ['ITINERARY', 'TICKETS', 'SCHEDULE'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RsvpRow({
  event,
  rsvp,
  onToggle,
}: {
  event: Event;
  rsvp: RsvpState;
  onToggle: (id: string, current: RsvpState) => void;
}) {
  const venue = dataService.getVenues().find((v) => v.id === event.venueId);
  const color = getCategoryColor(event.category);
  const isGoing = rsvp === 'going';
  const isWant = rsvp === 'want';

  return (
    <View style={styles.rsvpRow}>
      <View style={[styles.rsvpColorBar, { backgroundColor: color }]} />
      <View style={styles.rsvpBody}>
        <Text style={[styles.rsvpArtist, { color }]}>{event.title.toUpperCase()}</Text>
        <Text style={styles.rsvpMeta}>
          {(venue?.name ?? '').toUpperCase()}
          {'  ·  '}
          {dataService.formatTime(event.startTime)}
        </Text>
      </View>
      <View style={styles.rsvpActions}>
        <TouchableOpacity
          style={[styles.rsvpBtn, isGoing && { backgroundColor: COLORS.acid }]}
          onPress={() => onToggle(event.id, rsvp)}
        >
          <Text style={[styles.rsvpBtnText, isGoing && { color: '#000' }]}>
            {isGoing ? '★ GOING' : 'GOING'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rsvpBtnSmall, isWant && { borderColor: COLORS.pink }]}
          onPress={() => onToggle(event.id, rsvp === 'want' ? null : 'want')}
        >
          <Text style={[styles.rsvpBtnSmallText, isWant && { color: COLORS.pink }]}>
            {isWant ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Tab: Itinerary ───────────────────────────────────────────────────────────

function ItineraryTab({
  rsvps,
  onToggle,
}: {
  rsvps: Record<string, RsvpState>;
  onToggle: (id: string, current: RsvpState) => void;
}) {
  const allEvents = dataService.getEvents();
  const goingIds = Object.entries(rsvps)
    .filter(([, s]) => s === 'going')
    .map(([id]) => id);
  const wantIds = Object.entries(rsvps)
    .filter(([, s]) => s === 'want')
    .map(([id]) => id);

  const goingEvents = allEvents.filter((e) => goingIds.includes(e.id));
  const wantEvents = allEvents.filter((e) => wantIds.includes(e.id));

  const byDay = (evts: Event[]) =>
    DAYS.map((d) => ({
      ...d,
      events: evts
        .filter((e) => e.startTime.startsWith(d.key))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    })).filter((d) => d.events.length > 0);

  const goingDays = byDay(goingEvents);
  const wantDays = byDay(wantEvents);

  if (goingEvents.length === 0 && wantEvents.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyGlyph}>◈</Text>
        <Text style={styles.emptyTitle}>NO RSVPS YET</Text>
        <Text style={styles.emptyBody}>
          BROWSE THE SCHEDULE TAB{'\n'}AND TAP GOING ON EVENTS
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {goingDays.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>GOING</Text>
            <Text style={styles.sectionHeaderCount}>{goingEvents.length} EVENTS</Text>
          </View>
          {goingDays.map((day) => (
            <View key={day.key}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              {day.events.map((e) => (
                <RsvpRow key={e.id} event={e} rsvp={rsvps[e.id]} onToggle={onToggle} />
              ))}
            </View>
          ))}
        </>
      )}

      {wantDays.length > 0 && (
        <>
          <View style={[styles.sectionHeader, { marginTop: 16 }]}>
            <Text style={[styles.sectionHeaderText, { color: COLORS.pink }]}>WANT TO GO</Text>
            <Text style={[styles.sectionHeaderCount, { color: COLORS.pink }]}>{wantEvents.length} EVENTS</Text>
          </View>
          {wantDays.map((day) => (
            <View key={day.key}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              {day.events.map((e) => (
                <RsvpRow key={e.id} event={e} rsvp={rsvps[e.id]} onToggle={onToggle} />
              ))}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Tab: Tickets ─────────────────────────────────────────────────────────────

function TicketsTab({ rsvps, budget, onBudgetChange }: { rsvps: Record<string, RsvpState>; budget: number; onBudgetChange: (v: number) => void }) {
  const allEvents = dataService.getEvents();
  const goingEvents = allEvents.filter((e) => rsvps[e.id] === 'going');

  const paid = goingEvents.reduce((sum, e) => sum + (e.price ?? 0), 0);
  const wantEvents = allEvents.filter((e) => rsvps[e.id] === 'want');
  const projected = paid + wantEvents.reduce((sum, e) => sum + (e.price ?? 0), 0);
  const pct = Math.min((paid / budget) * 100, 100);

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Spend card */}
      <View style={styles.spendCard}>
        <View style={styles.spendRow}>
          <View>
            <Text style={styles.spendLabel}>TOTAL PAID</Text>
            <Text style={styles.spendAmount}>${paid}</Text>
          </View>
          <View style={styles.spendDivider} />
          <View>
            <Text style={styles.spendLabel}>PROJECTED</Text>
            <Text style={[styles.spendAmount, { color: COLORS.pink }]}>${projected}</Text>
          </View>
          <View style={styles.spendDivider} />
          <View>
            <Text style={styles.spendLabel}>BUDGET</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={[styles.spendAmount, { color: 'rgba(204,255,0,0.45)' }]}>$</Text>
              <TextInput
                value={String(budget)}
                onChangeText={(t) => {
                  const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(n) && n >= 0) onBudgetChange(n);
                }}
                keyboardType="numeric"
                style={[styles.spendAmount, { color: 'rgba(204,255,0,0.45)', minWidth: 40 } as any]}
                selectTextOnFocus
              />
            </View>
          </View>
        </View>

        {/* Budget bar */}
        <View style={styles.budgetBarTrack}>
          <View style={[styles.budgetBarFill, { width: `${pct}%` as any, backgroundColor: pct > 85 ? COLORS.pink : COLORS.acid }]} />
          <Text style={styles.budgetPct}>{Math.round(pct)}%</Text>
        </View>
        <Text style={styles.budgetLabel}>BUDGET UTILIZATION</Text>
      </View>

      {/* Ticket manifest */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>TICKET MANIFEST</Text>
        <Text style={styles.sectionHeaderCount}>{goingEvents.length} TICKETS</Text>
      </View>

      {goingEvents.length === 0 ? (
        <Text style={styles.emptyInline}>NO CONFIRMED TICKETS YET</Text>
      ) : (
        goingEvents.map((e) => {
          const color = getCategoryColor(e.category);
          const venue = dataService.getVenues().find((v) => v.id === e.venueId);
          return (
            <View key={e.id} style={styles.ticketRow}>
              <View style={[styles.ticketSwatch, { backgroundColor: color }]} />
              <View style={styles.ticketBody}>
                <Text style={[styles.ticketArtist, { color }]}>{e.title.toUpperCase()}</Text>
                <Text style={styles.ticketVenue}>{(venue?.name ?? '').toUpperCase()}</Text>
              </View>
              <View style={styles.ticketRight}>
                <Text style={styles.ticketPrice}>{e.price === 0 ? 'FREE' : `$${e.price}`}</Text>
                <View style={styles.ticketConfirmed}>
                  <Text style={styles.ticketConfirmedText}>★ GOING</Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      {wantEvents.length > 0 && (
        <>
          <View style={[styles.sectionHeader, { marginTop: 16 }]}>
            <Text style={[styles.sectionHeaderText, { color: COLORS.pink }]}>PENDING TICKETS</Text>
            <Text style={[styles.sectionHeaderCount, { color: COLORS.pink }]}>{wantEvents.length} EVENTS</Text>
          </View>
          {wantEvents.map((e) => {
            const color = getCategoryColor(e.category);
            const venue = dataService.getVenues().find((v) => v.id === e.venueId);
            return (
              <View key={e.id} style={[styles.ticketRow, { opacity: 0.6 }]}>
                <View style={[styles.ticketSwatch, { backgroundColor: color, opacity: 0.5 }]} />
                <View style={styles.ticketBody}>
                  <Text style={[styles.ticketArtist, { color }]}>{e.title.toUpperCase()}</Text>
                  <Text style={styles.ticketVenue}>{(venue?.name ?? '').toUpperCase()}</Text>
                </View>
                <View style={styles.ticketRight}>
                  <Text style={[styles.ticketPrice, { color: COLORS.pink }]}>
                    {e.price === 0 ? 'FREE' : e.price != null ? `$${e.price}` : '—'}
                  </Text>
                  <View style={[styles.ticketConfirmed, { borderColor: COLORS.pink + '55' }]}>
                    <Text style={[styles.ticketConfirmedText, { color: COLORS.pink }]}>WANT</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

// ─── Tab: Schedule (day-by-day personal planner) ─────────────────────────────

function ScheduleTab({ rsvps }: { rsvps: Record<string, RsvpState> }) {
  const [selectedDay, setSelectedDay] = useState('2026-05-22');
  const allEvents = dataService.getEvents();

  const dayEvents = useMemo(() => {
    const going = allEvents.filter(
      (e) => rsvps[e.id] === 'going' && e.startTime.startsWith(selectedDay),
    );
    const want = allEvents.filter(
      (e) => rsvps[e.id] === 'want' && e.startTime.startsWith(selectedDay),
    );
    return [...going, ...want].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allEvents, rsvps, selectedDay]);

  return (
    <View style={{ flex: 1 }}>
      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
        {DAYS.map((d) => {
          const count = allEvents.filter(
            (e) => (rsvps[e.id] === 'going' || rsvps[e.id] === 'want') && e.startTime.startsWith(d.key),
          ).length;
          const isActive = d.key === selectedDay;
          return (
            <TouchableOpacity
              key={d.key}
              style={[styles.dayChip, isActive && styles.dayChipActive]}
              onPress={() => setSelectedDay(d.key)}
            >
              <Text style={[styles.dayChipText, isActive && { color: '#000' }]}>{d.label}</Text>
              {count > 0 && (
                <Text style={[styles.dayChipCount, isActive && { color: '#000' }]}>·{count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.tabContent}>
        {dayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>NOTHING PLANNED</Text>
            <Text style={styles.emptyBody}>ADD EVENTS FROM THE SCHEDULE TAB</Text>
          </View>
        ) : (
          dayEvents.map((e, idx) => {
            const color = getCategoryColor(e.category);
            const venue = dataService.getVenues().find((v) => v.id === e.venueId);
            const isGoing = rsvps[e.id] === 'going';
            return (
              <View key={e.id} style={styles.scheduleEntry}>
                {/* Timeline line */}
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: color, shadowColor: color }]} />
                  {idx < dayEvents.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.scheduleCard}>
                  <View style={styles.scheduleCardHeader}>
                    <Text style={[styles.scheduleTime, { color: 'rgba(204,255,0,0.6)' }]}>
                      {dataService.formatTime(e.startTime)} – {dataService.formatTime(e.endTime)}
                    </Text>
                    <View style={[styles.scheduleStatus, isGoing ? { borderColor: COLORS.acid + '66' } : { borderColor: COLORS.pink + '55' }]}>
                      <Text style={[styles.scheduleStatusText, isGoing ? { color: COLORS.acid } : { color: COLORS.pink }]}>
                        {isGoing ? '★ GOING' : '♥ WANT'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.scheduleArtist, { color }]}>{e.title.toUpperCase()}</Text>
                  <Text style={styles.scheduleVenue}>{(venue?.name ?? '').toUpperCase()}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlanScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [rsvps, setRsvps] = useState<Record<string, RsvpState>>(() => loadRsvps());
  const [budget, setBudget] = useState<number>(() => {
    try {
      const v = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('budget_v1') : null;
      const n = v ? parseInt(v, 10) : NaN;
      return isNaN(n) ? 150 : n;
    } catch { return 150; }
  });
  const handleBudgetChange = useCallback((val: number) => {
    setBudget(val);
    try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('budget_v1', String(val)); } catch {}
  }, []);

  const handleToggle = useCallback((id: string, current: RsvpState) => {
    setRsvps((prev) => {
      const next = { ...prev };
      if (current === 'going') {
        delete next[id];
      } else {
        next[id] = 'going';
      }
      saveRsvps(next);
      return next;
    });
  }, []);

  const goingCount = Object.values(rsvps).filter((s) => s === 'going').length;
  const wantCount = Object.values(rsvps).filter((s) => s === 'want').length;

  return (
    <ScreenLayout title="My Plan">
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, i === activeTab && styles.tabBtnActive]}
            onPress={() => setActiveTab(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, i === activeTab && styles.tabBtnTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusItem}>
          <Text style={{ color: COLORS.acid }}>★ {goingCount}</Text>
          <Text style={{ color: 'rgba(204,255,0,0.45)' }}> GOING</Text>
        </Text>
        <Text style={styles.statusDivider}>|</Text>
        <Text style={styles.statusItem}>
          <Text style={{ color: COLORS.pink }}>♥ {wantCount}</Text>
          <Text style={{ color: 'rgba(204,255,0,0.45)' }}> WANT</Text>
        </Text>
        <Text style={styles.statusDivider}>|</Text>
        <Text style={styles.statusItem}>
          <Text style={{ color: COLORS.amber }}>
            ${dataService.getEvents().filter((e) => rsvps[e.id] === 'going').reduce((s, e) => s + (e.price ?? 0), 0)}
          </Text>
          <Text style={{ color: 'rgba(204,255,0,0.45)' }}> SPENT</Text>
        </Text>
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 0 && <ItineraryTab rsvps={rsvps} onToggle={handleToggle} />}
        {activeTab === 1 && <TicketsTab rsvps={rsvps} budget={budget} onBudgetChange={handleBudgetChange} />}
        {activeTab === 2 && <ScheduleTab rsvps={rsvps} />}
      </View>
    </ScreenLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.2)',
    backgroundColor: '#000',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(204,255,0,0.1)',
  },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.acid },
  tabBtnText: {
    fontSize: 10,
    color: 'rgba(204,255,0,0.4)',
    fontFamily: monoFont,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  tabBtnTextActive: { color: COLORS.acid },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.1)',
    backgroundColor: '#050505',
    gap: 10,
  },
  statusItem: { fontSize: 11, fontFamily: monoFont },
  statusDivider: { color: 'rgba(204,255,0,0.2)', fontSize: 11, fontFamily: monoFont },

  // Tab content
  tabContent: { paddingBottom: 40 },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.15)',
    backgroundColor: '#050505',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontFamily: displayFont,
    color: COLORS.acid,
    letterSpacing: 2,
  },
  sectionHeaderCount: {
    fontSize: 10,
    fontFamily: monoFont,
    color: 'rgba(204,255,0,0.5)',
    letterSpacing: 1,
  },

  dayLabel: {
    fontSize: 11,
    fontFamily: monoFont,
    color: 'rgba(204,255,0,0.4)',
    letterSpacing: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.06)',
    backgroundColor: '#030303',
  },

  // RSVP rows
  rsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.06)',
  },
  rsvpColorBar: { width: 3, alignSelf: 'stretch', flexShrink: 0 },
  rsvpBody: { flex: 1, padding: 10 },
  rsvpArtist: {
    fontSize: 15,
    fontFamily: condensedFont,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 17,
  },
  rsvpMeta: {
    fontSize: 9,
    fontFamily: monoFont,
    color: 'rgba(204,255,0,0.4)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  rsvpActions: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 10 },
  rsvpBtn: {
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rsvpBtnText: {
    fontSize: 9,
    fontFamily: monoFont,
    color: COLORS.acid,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rsvpBtnSmall: {
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpBtnSmallText: {
    fontSize: 14,
    color: 'rgba(204,255,0,0.4)',
  },

  // Spend card
  spendCard: {
    margin: 12,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.25)',
    padding: 14,
    backgroundColor: '#050505',
  },
  spendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 0 },
  spendLabel: {
    fontSize: 8,
    fontFamily: monoFont,
    color: 'rgba(204,255,0,0.4)',
    letterSpacing: 1,
    marginBottom: 3,
  },
  spendAmount: {
    fontSize: 28,
    fontFamily: displayFont,
    color: COLORS.acid,
    letterSpacing: 2,
    lineHeight: 30,
  },
  spendDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(204,255,0,0.15)',
    marginHorizontal: 16,
  },
  budgetBarTrack: {
    height: 6,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.15)',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetBarFill: { height: '100%' },
  budgetPct: {
    fontSize: 9,
    fontFamily: monoFont,
    color: 'rgba(204,255,0,0.5)',
    marginLeft: 6,
  },
  budgetLabel: {
    fontSize: 8,
    fontFamily: monoFont,
    color: 'rgba(204,255,0,0.3)',
    letterSpacing: 1.5,
  },

  // Ticket rows
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.06)',
  },
  ticketSwatch: { width: 3, alignSelf: 'stretch', flexShrink: 0 },
  ticketBody: { flex: 1, padding: 10 },
  ticketArtist: {
    fontSize: 14,
    fontFamily: condensedFont,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ticketVenue: {
    fontSize: 9,
    fontFamily: monoFont,
    color: 'rgba(204,255,0,0.4)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  ticketRight: { alignItems: 'flex-end', padding: 10, gap: 4 },
  ticketPrice: {
    fontSize: 14,
    fontFamily: monoFont,
    color: COLORS.acid,
    fontWeight: '700',
  },
  ticketConfirmed: {
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.35)',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ticketConfirmedText: {
    fontSize: 8,
    fontFamily: monoFont,
    color: COLORS.acid,
    letterSpacing: 1,
  },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyGlyph: {
    fontSize: 40,
    color: 'rgba(204,255,0,0.15)',
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: displayFont,
    color: 'rgba(204,255,0,0.3)',
    letterSpacing: 3,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 10,
    fontFamily: monoFont,
    color: 'rgba(204,255,0,0.2)',
    letterSpacing: 1.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyInline: {
    fontSize: 11,
    fontFamily: monoFont,
    color: 'rgba(204,255,0,0.25)',
    letterSpacing: 2,
    textAlign: 'center',
    padding: 24,
  },

  // Schedule tab
  dayScroll: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.15)',
    backgroundColor: '#000',
    flexGrow: 0,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(204,255,0,0.1)',
  },
  dayChipActive: { backgroundColor: COLORS.acid },
  dayChipText: {
    fontSize: 11,
    fontFamily: displayFont,
    color: 'rgba(204,255,0,0.5)',
    letterSpacing: 1.5,
  },
  dayChipCount: {
    fontSize: 9,
    fontFamily: monoFont,
    color: COLORS.pink,
  },

  scheduleEntry: { flexDirection: 'row', paddingHorizontal: 12 },
  timelineLeft: { width: 24, alignItems: 'center' },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 16,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(204,255,0,0.1)',
    marginTop: 4,
    minHeight: 20,
  },
  scheduleCard: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204,255,0,0.06)',
  },
  scheduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  scheduleTime: {
    fontSize: 10,
    fontFamily: monoFont,
    letterSpacing: 0.5,
  },
  scheduleStatus: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scheduleStatusText: {
    fontSize: 8,
    fontFamily: monoFont,
    letterSpacing: 1,
    fontWeight: '700',
  },
  scheduleArtist: {
    fontSize: 16,
    fontFamily: condensedFont,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  scheduleVenue: {
    fontSize: 9,
    fontFamily: monoFont,
    color: 'rgba(204,255,0,0.4)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
