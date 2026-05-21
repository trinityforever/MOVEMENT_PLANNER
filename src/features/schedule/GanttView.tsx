import React, { useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import dataService from '../../services/dataService';
import { COLORS } from '../../constants/Theme';

interface GanttViewProps {
  onEventSelect: (eventId: string) => void;
  onVenueSelect: (venueId: string) => void;
}

const FONTS =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;700;900&display=swap";

// Hour width in px per hour for the Gantt
const HOUR_PX = 72;
// The Gantt shows from this hour (noon = 12) to noon+24 next day
const GANTT_START_HOUR = 12;
const GANTT_TOTAL_HOURS = 26; // 12:00 to 14:00 next day

function useHtmlContent() {
  const events = dataService.getEvents();
  const venues = dataService.getVenues();

  return useMemo(() => {
    // Serialise data for injection into the iframe
    const eventsJson = JSON.stringify(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        venueId: e.venueId,
        startTime: e.startTime,
        endTime: e.endTime,
        category: e.category ?? 'Festival',
        price: e.price != null ? (e.price === 0 ? 'FREE' : `$${e.price}`) : '—',
        artists: e.artists ?? [],
        raUrl: e.raUrl ?? null,
        organizer: e.organizer ?? null,
      }))
    );
    const venuesJson = JSON.stringify(
      venues.map((v) => ({ id: v.id, name: v.name, address: v.address }))
    );

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${FONTS}" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --acid: #CCFF00;
  --pink: #FF0080;
  --void: #000000;
  --white: #FFFFFF;
  --green: #00FF41;
  --amber: #FF8C00;
  --dim: #0a0a0a;
  --hour-px: ${HOUR_PX}px;
}

html, body {
  background: var(--void);
  color: var(--acid);
  font-family: 'Share Tech Mono', monospace;
  width: 100%;
  overflow-x: hidden;
  min-height: 100vh;
}

body::before {
  content: '';
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px);
  pointer-events: none;
  z-index: 9999;
  animation: scanroll 10s linear infinite;
}
@keyframes scanroll { 0% { background-position: 0 0; } 100% { background-position: 0 100px; } }
body::after {
  content: '';
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.65) 100%);
  pointer-events: none;
  z-index: 9998;
}

/* VIEW CONTROLS */
.view-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(204,255,0,0.2);
  background: var(--void);
  position: sticky;
  top: 0;
  z-index: 100;
}
.view-toggle { display: flex; border: 1px solid var(--acid); }
.view-btn {
  padding: 6px 16px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--acid);
  background: transparent;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
}
.view-btn.active { background: var(--acid); color: #000; }
.view-btn:not(:last-child) { border-right: 1px solid rgba(204,255,0,0.35); }
.event-total { font-size: 10px; color: rgba(204,255,0,0.45); letter-spacing: 1px; }

/* DAY TABS */
.day-tabs {
  display: flex;
  border-bottom: 1px solid rgba(204,255,0,0.2);
  background: var(--void);
  position: sticky;
  top: 37px;
  z-index: 99;
  overflow-x: auto;
  scrollbar-width: none;
}
.day-tabs::-webkit-scrollbar { display: none; }
.day-tab {
  flex: 1;
  min-width: 70px;
  padding: 9px 8px;
  text-align: center;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 14px;
  letter-spacing: 2px;
  color: rgba(204,255,0,0.4);
  cursor: pointer;
  border-right: 1px solid rgba(204,255,0,0.1);
  transition: color 0.15s;
}
.day-tab.active { color: var(--acid); border-bottom: 2px solid var(--acid); }
.day-tab-count { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: var(--pink); margin-left: 4px; }

/* LEGEND BAR */
.legend-bar {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  background: #050505;
  border-bottom: 1px solid rgba(204,255,0,0.1);
}
.legend-bar::-webkit-scrollbar { display: none; }
.legend-item {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 10px;
  letter-spacing: 1px;
  border-right: 1px solid rgba(204,255,0,0.08);
}
.legend-swatch { width: 8px; height: 8px; flex-shrink: 0; }
.legend-item.afterparty { color: #FF0080; }
.legend-item.afterparty .legend-swatch { background: #FF0080; box-shadow: 0 0 5px #FF0080; }
.legend-item.sunrise { color: #FF8C00; }
.legend-item.sunrise .legend-swatch { background: #FF8C00; box-shadow: 0 0 5px #FF8C00; }
.legend-item.dayparty { color: #CCFF00; }
.legend-item.dayparty .legend-swatch { background: #CCFF00; box-shadow: 0 0 5px #CCFF00; }
.legend-item.festival { color: #00FF41; }
.legend-item.festival .legend-swatch { background: #00FF41; box-shadow: 0 0 5px #00FF41; }

/* GANTT VIEW */
.gantt-view { overflow: hidden; }
.gantt-view.hidden { display: none; }
.gantt-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  max-height: calc(100vh - 130px);
  touch-action: pan-x pan-y;
}
.gantt-wrapper::-webkit-scrollbar { height: 3px; width: 3px; }
.gantt-wrapper::-webkit-scrollbar-thumb { background: rgba(204,255,0,0.3); }

.gantt-inner { display: flex; flex-direction: column; min-width: max-content; }

.gantt-time-header {
  display: flex;
  border-bottom: 1px solid rgba(204,255,0,0.2);
  position: sticky;
  top: 0;
  background: #000;
  z-index: 10;
}
.gantt-header-spacer {
  width: 90px;
  flex-shrink: 0;
  position: sticky;
  left: 0;
  background: #000;
  z-index: 11;
  border-right: 1px solid rgba(204,255,0,0.15);
}
.gantt-hour {
  width: var(--hour-px);
  flex-shrink: 0;
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  color: rgba(204,255,0,0.4);
  padding: 4px 3px;
  border-left: 1px solid rgba(204,255,0,0.08);
  letter-spacing: 0.5px;
}
.gantt-hour.midnight { color: var(--pink); border-left-color: rgba(255,0,128,0.3); }

.gantt-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(204,255,0,0.06);
  min-height: 44px;
}
.gantt-row:hover { background: rgba(204,255,0,0.015); }
.gantt-venue-label {
  width: 90px;
  flex-shrink: 0;
  padding: 4px 8px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  color: rgba(204,255,0,0.55);
  letter-spacing: 0.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid rgba(204,255,0,0.15);
  cursor: pointer;
  line-height: 1.2;
  text-transform: uppercase;
  position: sticky;
  left: 0;
  background: var(--void);
  z-index: 5;
}
.gantt-venue-label:hover { color: var(--acid); }

.gantt-track {
  position: relative;
  height: 44px;
  flex: 1;
  min-width: calc(var(--hour-px) * ${GANTT_TOTAL_HOURS});
}

.gantt-grid-lines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
}
.gantt-grid-cell {
  width: var(--hour-px);
  flex-shrink: 0;
  border-left: 1px solid rgba(204,255,0,0.05);
  height: 100%;
}
.gantt-grid-cell.midnight { border-left-color: rgba(255,0,128,0.15); }

.gantt-event {
  position: absolute;
  top: 5px;
  height: 34px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  cursor: pointer;
  overflow: hidden;
  transition: filter 0.15s, transform 0.1s;
  min-width: 20px;
}
.gantt-event:active { transform: scale(0.97); }
.gantt-event:hover { filter: brightness(1.2); }
.gantt-event-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900;
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}
.rsvp-star {
  font-size: 9px;
  margin-left: 4px;
  opacity: 0.9;
  flex-shrink: 0;
}

.gantt-event.Afterparty { background: #FF0080; box-shadow: 0 0 10px rgba(255,0,128,0.4); }
.gantt-event.Sunrise    { background: #FF8C00; box-shadow: 0 0 10px rgba(255,140,0,0.4); }
.gantt-event.DayParty,
.gantt-event.Day-Party,
.gantt-event.Day\\ Party { background: #CCFF00; box-shadow: 0 0 10px rgba(204,255,0,0.4); }
.gantt-event.Festival   { background: #00FF41; box-shadow: 0 0 10px rgba(0,255,65,0.35); }
.gantt-event.default    { background: #444; }

/* LIST VIEW */
.list-view { overflow-y: auto; max-height: calc(100vh - 130px); }
.list-view.hidden { display: none; }
.list-scroller { padding-bottom: 32px; }

.list-day-header {
  padding: 8px 12px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 18px;
  letter-spacing: 3px;
  color: var(--acid);
  border-bottom: 1px solid rgba(204,255,0,0.3);
  border-top: 1px solid rgba(204,255,0,0.1);
  background: var(--void);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.list-day-count { font-family: 'Share Tech Mono', monospace; font-size: 10px; color: var(--pink); letter-spacing: 1px; }

.list-item {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid rgba(204,255,0,0.06);
  cursor: pointer;
  transition: background 0.1s;
}
.list-item:hover { background: rgba(204,255,0,0.025); }
.list-item:active { background: rgba(204,255,0,0.05); }

.list-color-bar { width: 3px; flex-shrink: 0; }
.list-time {
  width: 64px;
  flex-shrink: 0;
  padding: 11px 8px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: rgba(204,255,0,0.7);
  letter-spacing: 0.5px;
  border-right: 1px solid rgba(204,255,0,0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.list-time-end { font-size: 9px; color: rgba(204,255,0,0.35); margin-top: 1px; }

.list-body { flex: 1; padding: 10px 12px; min-width: 0; }
.list-artist {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900;
  font-size: 16px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  line-height: 1.1;
}
.list-venue { font-family: 'Share Tech Mono', monospace; font-size: 10px; color: rgba(204,255,0,0.5); margin-top: 2px; letter-spacing: 0.5px; }

.list-meta { display: flex; flex-direction: column; align-items: flex-end; padding: 10px 10px 10px 0; gap: 4px; flex-shrink: 0; }
.list-price { font-family: 'Share Tech Mono', monospace; font-size: 11px; color: var(--acid); font-weight: 700; }
.list-badge {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 9px;
  letter-spacing: 1px;
  padding: 2px 5px;
}
.list-badge.Afterparty { color: #FF0080; border: 1px solid rgba(255,0,128,0.4); }
.list-badge.Sunrise    { color: #FF8C00; border: 1px solid rgba(255,140,0,0.4); }
.list-badge.DayParty,
.list-badge.Day-Party,
.list-badge.Day\\ Party { color: #CCFF00; border: 1px solid rgba(204,255,0,0.4); }
.list-badge.Festival   { color: #00FF41; border: 1px solid rgba(0,255,65,0.4); }
.rsvp-dot { font-size: 9px; color: var(--pink); }

.empty-state {
  padding: 48px 16px;
  text-align: center;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 20px;
  letter-spacing: 3px;
  color: rgba(204,255,0,0.25);
}
</style>
</head>
<body>

<div class="view-controls">
  <div class="view-toggle">
    <button class="view-btn active" id="ganttBtn" onclick="setView('gantt')">TIMELINE</button>
    <button class="view-btn" id="weekendBtn" onclick="setView('weekend')">WKND</button>
    <button class="view-btn" id="listBtn" onclick="setView('list')">LIST</button>
  </div>
  <div class="event-total" id="eventTotal">— EVENTS</div>
</div>

<div class="day-tabs" id="dayTabs"></div>

<div class="legend-bar">
  <div class="legend-item afterparty"><div class="legend-swatch"></div>AFTERPARTY</div>
  <div class="legend-item dayparty"><div class="legend-swatch"></div>DAY PARTY</div>
  <div class="legend-item sunrise"><div class="legend-swatch"></div>SUNRISE</div>
  <div class="legend-item festival"><div class="legend-swatch"></div>FESTIVAL</div>
</div>

<div class="gantt-view" id="ganttView">
  <div class="gantt-wrapper">
    <div class="gantt-inner" id="ganttInner"></div>
  </div>
</div>

<div class="list-view hidden" id="listView">
  <div class="list-scroller" id="listScroller"></div>
</div>

<script>
// ===== DATA (injected) =====
const ALL_EVENTS = ${eventsJson};
const ALL_VENUES = ${venuesJson};

const VENUE_MAP = {};
ALL_VENUES.forEach(v => { VENUE_MAP[v.id] = v; });

// ===== CONSTANTS =====
const HOUR_PX = ${HOUR_PX};
const GANTT_START = ${GANTT_START_HOUR}; // noon
const GANTT_HOURS = ${GANTT_TOTAL_HOURS};
const LABEL_WIDTH_PX = 90;
const MIN_HOUR_PX = 36;
const MAX_HOUR_PX = 144;

const DAYS = [
  { key: '2026-05-21', label: 'THU 21' },
  { key: '2026-05-22', label: 'FRI 22' },
  { key: '2026-05-23', label: 'SAT 23' },
  { key: '2026-05-24', label: 'SUN 24' },
  { key: '2026-05-25', label: 'MON 25' },
  { key: '2026-05-26', label: 'TUE 26' },
];

const CAT_CLASS = {
  'Afterparty': 'Afterparty',
  'Day Party':  'DayParty',
  'Sunrise':    'Sunrise',
  'Festival':   'Festival',
};
const CAT_COLORS = { Afterparty: '#FF0080', Sunrise: '#FF8C00', DayParty: '#CCFF00', 'Day Party': '#CCFF00', Festival: '#00FF41' };

let currentDay = '2026-05-22';
let currentView = 'gantt';
let rsvps = {};
try { rsvps = JSON.parse(localStorage.getItem('rsvps_v1') || '{}'); } catch(e) {}

const WEEKEND_HOUR_PX = 10;
const MIN_WEEKEND_HOUR_PX = 4;
const MAX_WEEKEND_HOUR_PX = 28;
const WEEKEND_ORIGIN_MS = new Date('2026-05-21T12:00:00').getTime();
const WEEKEND_TOTAL_HOURS = Math.ceil((new Date('2026-05-26T14:00:00').getTime() - WEEKEND_ORIGIN_MS) / 3600000);
let currentHourPx = HOUR_PX;
let currentWeekendHourPx = WEEKEND_HOUR_PX;
let pinchState = null;
let pinchRaf = null;

// ===== HELPERS =====
function parseHour(iso) {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function getDate(iso) {
  return iso.slice(0, 10);
}

function getDayLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

function fmtTime(iso) {
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return hh + (m ? ':' + String(m).padStart(2,'0') : '') + ampm;
}

function hourToX(h) {
  // Adjust: hours < GANTT_START mean "next day" (e.g. 2AM = 26h from noon-12h=14h)
  const adj = h < GANTT_START ? h + 24 : h;
  return (adj - GANTT_START) * currentHourPx;
}

function getDayWindowMs(dateKey) {
  const startMs = new Date(dateKey + 'T12:00:00').getTime();
  const endMs = startMs + GANTT_HOURS * 3600000;
  return { startMs, endMs };
}

function eventsForDay(dateKey) {
  return ALL_EVENTS.filter(e => {
    const startDate = getDate(e.startTime);
    // Include events that START on this day OR events that end on this day but start after noon previous day
    if (startDate === dateKey) return true;
    // Events starting late night spill to next day; check if startTime is ≥ midnight of dateKey-1
    const prev = new Date(dateKey + 'T00:00:00');
    prev.setDate(prev.getDate() - 1);
    const prevKey = prev.toISOString().slice(0, 10);
    if (startDate === prevKey) {
      const h = parseHour(e.startTime);
      return h < GANTT_START; // early morning (before noon) counted as previous night
    }
    return false;
  });
}

function selectEvent(eventId) {
  window.ReactNativeWebView.postMessage(eventId);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function syncZoomCssVars() {
  document.documentElement.style.setProperty('--hour-px', currentHourPx + 'px');
}

function getPinchDistance(touches) {
  if (!touches || touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPinchCenterX(touches, rect) {
  return ((touches[0].clientX + touches[1].clientX) / 2) - rect.left;
}

function zoomTimelineAroundPoint(nextPx, centerX) {
  if (currentView === 'list') return;
  const wrapper = document.querySelector('.gantt-wrapper');
  if (!wrapper) return;

  const currentPx = currentView === 'weekend' ? currentWeekendHourPx : currentHourPx;
  const clampedNextPx = currentView === 'weekend'
    ? clamp(nextPx, MIN_WEEKEND_HOUR_PX, MAX_WEEKEND_HOUR_PX)
    : clamp(nextPx, MIN_HOUR_PX, MAX_HOUR_PX);

  if (Math.abs(clampedNextPx - currentPx) < 0.5) return;

  const focalHours = Math.max(0, (wrapper.scrollLeft + centerX - LABEL_WIDTH_PX) / currentPx);

  if (currentView === 'weekend') currentWeekendHourPx = clampedNextPx;
  else currentHourPx = clampedNextPx;

  syncZoomCssVars();
  render();

  wrapper.scrollLeft = Math.max(0, focalHours * clampedNextPx - centerX + LABEL_WIDTH_PX);
}

function queuePinchZoom(nextPx, centerX) {
  if (pinchRaf) cancelAnimationFrame(pinchRaf);
  pinchRaf = requestAnimationFrame(() => {
    zoomTimelineAroundPoint(nextPx, centerX);
    pinchRaf = null;
  });
}

function attachPinchHandlers() {
  const wrapper = document.querySelector('.gantt-wrapper');
  if (!wrapper || wrapper.dataset.pinchBound === 'true') return;
  wrapper.dataset.pinchBound = 'true';

  wrapper.addEventListener('touchstart', (event) => {
    if (currentView === 'list' || event.touches.length < 2) return;
    const rect = wrapper.getBoundingClientRect();
    pinchState = {
      distance: getPinchDistance(event.touches),
      basePx: currentView === 'weekend' ? currentWeekendHourPx : currentHourPx,
      centerX: getPinchCenterX(event.touches, rect),
    };
  }, { passive: false });

  wrapper.addEventListener('touchmove', (event) => {
    if (!pinchState || currentView === 'list' || event.touches.length < 2) return;
    event.preventDefault();
    const rect = wrapper.getBoundingClientRect();
    const nextDistance = getPinchDistance(event.touches);
    if (!nextDistance || !pinchState.distance) return;
    const scale = nextDistance / pinchState.distance;
    const centerX = getPinchCenterX(event.touches, rect);
    queuePinchZoom(pinchState.basePx * scale, centerX || pinchState.centerX);
  }, { passive: false });

  const clearPinch = () => {
    pinchState = null;
    if (pinchRaf) {
      cancelAnimationFrame(pinchRaf);
      pinchRaf = null;
    }
  };

  wrapper.addEventListener('touchend', clearPinch, { passive: true });
  wrapper.addEventListener('touchcancel', clearPinch, { passive: true });
}

// ===== DAY TABS =====
function buildDayTabs() {
  const container = document.getElementById('dayTabs');
  container.innerHTML = '';
  DAYS.forEach(day => {
    const count = eventsForDay(day.key).length;
    if (count === 0) return;
    const el = document.createElement('div');
    el.className = 'day-tab' + (day.key === currentDay ? ' active' : '');
    el.innerHTML = day.label + (count ? '<span class="day-tab-count">·' + count + '</span>' : '');
    el.onclick = () => setDay(day.key);
    container.appendChild(el);
  });
}

function setDay(key) {
  currentDay = key;
  buildDayTabs();
  render();
}

function setView(v) {
  currentView = v;
  const isGanttLike = v === 'gantt' || v === 'weekend';
  document.getElementById('ganttView').classList.toggle('hidden', !isGanttLike);
  document.getElementById('listView').classList.toggle('hidden', v !== 'list');
  document.getElementById('ganttBtn').classList.toggle('active', v === 'gantt');
  document.getElementById('weekendBtn').classList.toggle('active', v === 'weekend');
  document.getElementById('listBtn').classList.toggle('active', v === 'list');
  render();
}

// ===== GANTT =====
function buildGantt(events) {
  const inner = document.getElementById('ganttInner');
  inner.innerHTML = '';
  const dayWindow = getDayWindowMs(currentDay);

  // Group by venue
  const venueIds = [...new Set(events.map(e => e.venueId))];

  // Time header
  const header = document.createElement('div');
  header.className = 'gantt-time-header';
  const hdrSpacer = document.createElement('div');
  hdrSpacer.className = 'gantt-header-spacer';
  header.appendChild(hdrSpacer);
  for (let h = 0; h < GANTT_HOURS; h++) {
    const absH = (GANTT_START + h) % 24;
    const label = absH === 0 ? 'MID' : (absH < 12 ? absH + 'AM' : absH === 12 ? '12PM' : (absH - 12) + 'PM');
    const cell = document.createElement('div');
    cell.className = 'gantt-hour' + (absH === 0 ? ' midnight' : '');
    cell.textContent = label;
    header.appendChild(cell);
  }
  inner.appendChild(header);

  // Venue rows
  venueIds.forEach(vid => {
    const venue = VENUE_MAP[vid];
    const venueEvents = events.filter(e => e.venueId === vid);
    const row = document.createElement('div');
    row.className = 'gantt-row';

    const label = document.createElement('div');
    label.className = 'gantt-venue-label';
    label.title = venue ? venue.name : vid;
    label.textContent = venue ? venue.name.replace(/\\s+/g, ' ') : vid;
    label.onclick = () => { window.ReactNativeWebView.postMessage('venue:' + vid); };
    row.appendChild(label);

    const track = document.createElement('div');
    track.className = 'gantt-track';

    // Grid lines
    const grid = document.createElement('div');
    grid.className = 'gantt-grid-lines';
    for (let h = 0; h < GANTT_HOURS; h++) {
      const cell = document.createElement('div');
      cell.className = 'gantt-grid-cell' + (((GANTT_START + h) % 24) === 0 ? ' midnight' : '');
      grid.appendChild(cell);
    }
    track.appendChild(grid);

    // Event bars
    venueEvents.forEach(ev => {
      const startMs = new Date(ev.startTime).getTime();
      let endMs = new Date(ev.endTime).getTime();
      if (endMs <= startMs) endMs += 24 * 3600000;

      const clippedStartMs = Math.max(startMs, dayWindow.startMs);
      const clippedEndMs = Math.min(endMs, dayWindow.endMs);

      if (clippedEndMs <= clippedStartMs) return;

      const x = ((clippedStartMs - dayWindow.startMs) / 3600000) * currentHourPx;
      const w = Math.max(((clippedEndMs - clippedStartMs) / 3600000) * currentHourPx, 24);

      const bar = document.createElement('div');
      bar.className = 'gantt-event ' + (CAT_CLASS[ev.category] || 'default');
      bar.style.left = x + 'px';
      bar.style.width = Math.max(w, 24) + 'px';

      const name = document.createElement('span');
      name.className = 'gantt-event-name';
      name.textContent = ev.title.toUpperCase();
      bar.appendChild(name);

      if (rsvps[ev.id] === 'going') {
        const star = document.createElement('span');
        star.className = 'rsvp-star';
        star.textContent = '★';
        bar.appendChild(star);
        bar.style.outline = '1px solid rgba(255,255,255,0.3)';
        bar.style.outlineOffset = '-1px';
      }

      bar.onclick = () => selectEvent(ev.id);
      track.appendChild(bar);
    });

    row.appendChild(track);
    inner.appendChild(row);
  });
}

// ===== LIST =====
function buildList(events) {
  const scroller = document.getElementById('listScroller');
  scroller.innerHTML = '';

  if (events.length === 0) {
    scroller.innerHTML = '<div class="empty-state">NO EVENTS THIS DAY</div>';
    return;
  }

  const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const dayLabel = getDayLabel(currentDay);

  const hdr = document.createElement('div');
  hdr.className = 'list-day-header';
  hdr.innerHTML = dayLabel + '<span class="list-day-count">' + sorted.length + ' EVENTS</span>';
  scroller.appendChild(hdr);

  sorted.forEach(ev => {
    const venue = VENUE_MAP[ev.venueId];
    const catClass = CAT_CLASS[ev.category] || 'Festival';
    const color = CAT_COLORS[ev.category] || '#00FF41';

    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML =
      '<div class="list-color-bar" style="background:' + color + ';box-shadow:0 0 6px ' + color + '"></div>' +
      '<div class="list-time"><span>' + fmtTime(ev.startTime) + '</span><span class="list-time-end">' + fmtTime(ev.endTime) + '</span></div>' +
      '<div class="list-body"><div class="list-artist" style="color:' + color + '">' + ev.title.toUpperCase() + '</div>' +
      '<div class="list-venue">' + (venue ? venue.name.toUpperCase() : '') + '</div></div>' +
      '<div class="list-meta"><span class="list-price">' + ev.price + '</span><span class="list-badge ' + catClass + '">' + ev.category.toUpperCase() + '</span></div>';

    item.onclick = () => selectEvent(ev.id);
    scroller.appendChild(item);
  });
}

// ===== WEEKEND GANTT =====
function buildWeekendGantt(events) {
  const inner = document.getElementById('ganttInner');
  inner.innerHTML = '';

  const hPx = currentWeekendHourPx;
  const totalW = WEEKEND_TOTAL_HOURS * hPx;

  function toX(iso) {
    return (new Date(iso).getTime() - WEEKEND_ORIGIN_MS) / 3600000 * hPx;
  }

  // Header with day labels
  const header = document.createElement('div');
  header.className = 'gantt-time-header';
  const hdrSpacer = document.createElement('div');
  hdrSpacer.className = 'gantt-header-spacer';
  hdrSpacer.style.fontSize = '7px';
  hdrSpacer.style.color = 'rgba(204,255,0,0.3)';
  hdrSpacer.style.display = 'flex';
  hdrSpacer.style.alignItems = 'center';
  hdrSpacer.style.justifyContent = 'center';
  hdrSpacer.style.letterSpacing = '1px';
  hdrSpacer.textContent = 'ALL';
  header.appendChild(hdrSpacer);

  const wkndDays = [
    { label: 'THU 21', start: '2026-05-21T12:00:00', end: '2026-05-22T12:00:00' },
    { label: 'FRI 22', start: '2026-05-22T12:00:00', end: '2026-05-23T12:00:00' },
    { label: 'SAT 23', start: '2026-05-23T12:00:00', end: '2026-05-24T12:00:00' },
    { label: 'SUN 24', start: '2026-05-24T12:00:00', end: '2026-05-25T12:00:00' },
    { label: 'MON 25', start: '2026-05-25T12:00:00', end: '2026-05-26T14:00:00' },
  ];
  wkndDays.forEach(day => {
    const w = (new Date(day.end).getTime() - new Date(day.start).getTime()) / 3600000 * hPx;
    const cell = document.createElement('div');
    cell.style.cssText = 'width:' + w + 'px;flex-shrink:0;font-family:\\'Bebas Neue\\',sans-serif;font-size:10px;' +
      'color:rgba(204,255,0,0.55);padding:4px 6px;border-left:1px solid rgba(204,255,0,0.2);letter-spacing:2px;';
    cell.textContent = day.label;
    header.appendChild(cell);
  });
  inner.appendChild(header);

  // All venues with at least one event
  const venueIds = [...new Set(events.map(e => e.venueId))];
  venueIds.forEach(vid => {
    const venue = VENUE_MAP[vid];
    const venueEvents = events.filter(e => e.venueId === vid);
    const row = document.createElement('div');
    row.className = 'gantt-row';

    const lbl = document.createElement('div');
    lbl.className = 'gantt-venue-label';
    lbl.title = venue ? venue.name : vid;
    lbl.textContent = venue ? venue.name.replace(/\\s+/g, ' ') : vid;
    lbl.onclick = () => { window.ReactNativeWebView.postMessage('venue:' + vid); };
    row.appendChild(lbl);

    const track = document.createElement('div');
    track.className = 'gantt-track';
    track.style.minWidth = totalW + 'px';

    venueEvents.forEach(ev => {
      const x = toX(ev.startTime);
      if (x < 0 || x > totalW) return;
      const endMs = new Date(ev.endTime).getTime();
      const startMs = new Date(ev.startTime).getTime();
      const w = Math.max((endMs - startMs) / 3600000 * hPx, 3);

      const bar = document.createElement('div');
      bar.className = 'gantt-event ' + (CAT_CLASS[ev.category] || 'default');
      bar.style.left = x + 'px';
      bar.style.width = w + 'px';
      bar.style.height = '28px';
      bar.style.top = '8px';
      bar.style.padding = '0 3px';

      if (w > 20) {
        const name = document.createElement('span');
        name.className = 'gantt-event-name';
        name.style.fontSize = '7px';
        name.textContent = ev.title.toUpperCase();
        bar.appendChild(name);
      }

      if (rsvps[ev.id] === 'going') {
        bar.style.outline = '1px solid rgba(255,255,255,0.35)';
        bar.style.outlineOffset = '-1px';
        if (w > 14) {
          const star = document.createElement('span');
          star.className = 'rsvp-star';
          star.style.fontSize = '7px';
          star.textContent = '★';
          bar.appendChild(star);
        }
      }

      bar.onclick = () => selectEvent(ev.id);
      track.appendChild(bar);
    });

    row.appendChild(track);
    inner.appendChild(row);
  });
}

// ===== RENDER =====
function render() {
  syncZoomCssVars();
  if (currentView === 'weekend') {
    document.getElementById('eventTotal').textContent = ALL_EVENTS.length + ' EVENTS · FULL WKND';
    buildWeekendGantt(ALL_EVENTS);
  } else {
    const events = eventsForDay(currentDay);
    document.getElementById('eventTotal').textContent = events.length + ' EVENTS';
    if (currentView === 'gantt') buildGantt(events);
    else buildList(events);
  }
}

// ===== INIT =====
buildDayTabs();

// Find first day with events
const firstDay = DAYS.find(d => eventsForDay(d.key).length > 0);
if (firstDay) currentDay = firstDay.key;

buildDayTabs();
attachPinchHandlers();
syncZoomCssVars();
render();
</script>
</body>
</html>`;
  }, [events, venues]);
}

const WebGantt: React.FC<{
  html: string;
  onEventSelect: (id: string) => void;
  onVenueSelect: (id: string) => void;
}> = ({ html, onEventSelect, onVenueSelect }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onEventSelectRef = useRef(onEventSelect);
  const onVenueSelectRef = useRef(onVenueSelect);
  onEventSelectRef.current = onEventSelect;
  onVenueSelectRef.current = onVenueSelect;

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    (iframe.contentWindow as any).ReactNativeWebView = {
      postMessage: (id: string) => {
        if (typeof id === 'string' && id.startsWith('venue:')) {
          onVenueSelectRef.current(id.slice(6));
        } else {
          onEventSelectRef.current(id);
        }
      },
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      onLoad={handleLoad}
      style={{ flex: 1, border: 'none', backgroundColor: '#000' }}
      title="Schedule"
    />
  );
};

const GanttView: React.FC<GanttViewProps> = ({ onEventSelect, onVenueSelect }) => {
  const htmlContent = useHtmlContent();

  const handleMessage = (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;
    if (!data) return;
    if (typeof data === 'string' && data.startsWith('venue:')) {
      onVenueSelect(data.slice(6));
    } else {
      onEventSelect(data);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <WebGantt html={htmlContent} onEventSelect={onEventSelect} onVenueSelect={onVenueSelect} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        scrollEnabled={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.acid} />
          </View>
        )}
        startInLoadingState={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GanttView;
