# FLINTASTIC — Session Handoff
*Last updated: 2026-05-21 (artist cross-party popup + map drawer ownership fix)*

This document is for the next agent picking up this project. Read it fully before touching any code.

---

## V1.7: Shipped (May 21)

Two UI behaviors were added/fixed on top of the existing acid-rave MVP:

1. **Artist cross-party popup** — tapping an artist in an event detail now opens an in-app popup listing the other events in the local database for that same artist. Selecting one jumps directly to that related event.

2. **Map drawer ownership fix** — the new right-side slide-out belongs to the **web map venue popup**, not the schedule event popup. The schedule web event detail is back to a centered modal; the map web venue detail now uses the right-side drawer.

### Files touched in V1.7

`dataService.ts` (`getEventsByArtist` helper), `dataService.test.ts` (artist lookup coverage), `ScheduleScreen.tsx` + `map.tsx` (pass `onEventSelect` through), `EventBottomSheet.tsx` (native artist popup), `EventBottomSheet.web.tsx` (web centered event modal + artist popup), `VenueBottomSheet.web.tsx` (web right-side venue drawer)

### Important implementation note

This repo still does **not** use SQLite yet. The new "other parties for this artist" behavior is powered by the existing in-memory/local JSON data layer via `dataService.getEventsByArtist(...)`. If the app migrates to SQLite later, keep the UI contract and swap only the query implementation.

### Current expected web behavior

- **Schedule / Gantt / List**: event tap → centered event modal
- **Map**: venue pin tap → right-side venue drawer
- **Any event modal**: artist tap → "other parties in database" popup

---

## V1.6: Shipped (May 6)

Seven polish items requested for the Movement weekend app:

1. **Venue name taps → map** — clicking venue names anywhere (Gantt labels, ListView, EventBottomSheet) navigates to `/map?venueId=<id>`. `map.tsx` reads `useLocalSearchParams` and opens the venue sheet.

2. **+ Spkrbox venue** — 200 Grand River Ave, (42.33381, -83.04987). No Movement-weekend events found on RA.co.

3. **Rename "Art Park at Motor City Wine" → "Lincoln Street Art Park"** — relocated to 5926 Lincoln St, (42.3630, -83.0815), the park next to Lincoln Factory.

4. **+ Lincoln Factory venue** — 1331 Holden St, (42.3626, -83.0820). No Movement-weekend events found on RA.co.

5. **Fix mobile Gantt venue label width** — venue names truncated to 13 chars in JS (`short.substring(0, 12) + '…'`), full name preserved as `title` attribute. CSS media query constrains left panel with `!important`.

6. **Fix landscape scrolling** — see "Battle test: Gantt landscape + pinch" below.

7. **Address hot links** — all venue addresses tappable, open native maps (`maps://` iOS, `geo:` Android, Google Maps URL web).

### Files touched in V1.6

`venues.json` (+Spkrbox, +Lincoln Factory, rename/move Art Park), `GanttView.tsx` (heavy — venue label click, landscape scroll, pinch zoom), `ScheduleScreen.tsx` (router + handleVenueSelect), `ListView.tsx` (venue name onPress → router), `EventBottomSheet.tsx` (venue name → router), `map.tsx` (useLocalSearchParams), `VenueBottomSheet.tsx` + `.web.tsx` (address hot links)

### Battle test: Gantt landscape scrolling + pinch zoom

`GanttView.tsx` is the most complex file in the app. It generates an HTML document string and renders it via WebView (native) or iframe (web). The HTML embeds vis-timeline loaded from CDN.

**The fundamental tension**: on mobile, vis-timeline needs to receive touch events for horizontal time navigation and pinch-to-zoom. But the WebView's native UIScrollView wants to consume those same gestures for scrolling/zooming the page. We need vertical scrolling (to see all venue rows in landscape) without stealing horizontal pan and pinch from vis-timeline.

**Current approach** (3-layer fix):

1. **CSS `overflow-y: auto` on body** + dynamic `#visualization` height (not absolute positioned). `updateHeight()` in JS calculates `groups.length * rowH + 60` and sets it on the container. Combined with `scrollEnabled={true}` on the WebView, this means the WebView's native scroller handles vertical scroll because the body content is taller than the viewport.

2. **CSS `touch-action: pan-y` on `body, html`** — tells the browser/WebView to only handle *vertical* panning natively. Horizontal pan and pinch pass through to JavaScript → vis-timeline.

3. **CSS `touch-action: none` on `.vis-panel.vis-center`** — on the timeline center panel specifically, no native gesture handling. vis-timeline owns all gestures here (horizontal time nav + pinch zoom).

**Why not just `scrollEnabled={false}` + let vis-timeline scroll everything?** vis-timeline's internal touch scrolling doesn't work reliably on mobile WKWebView — touch events for its internal scrollbars either don't fire or get dropped. Hence the hybrid approach: native vertical scroll, vis-timeline horizontal + zoom.

**CSS in the HTML template is fragile.** The template literal mixes JS template strings (`${COLORS.background}`) with CSS. When editing, match exact indentation (tabs) and be careful with the `${}` interpolation. If the Edit tool rejects, use Python or sed directly.

**Web vs native paths:**
- Native: `<WebView scrollEnabled={true} onMessage={handleMessage} ...>` — `handleMessage` routes `venue:` prefix to `onVenueSelect`.
- Web: `<iframe srcDoc={html} onLoad={handleLoad} ...>` — `handleLoad` injects `window.ReactNativeWebView.postMessage` bridge into the iframe's `contentWindow`. The `WebGantt` component uses refs to keep callbacks current.

**Venue label click in the Gantt**: manual `findLabel()` function walks up DOM from click target looking for `.vis-label` class (avoids `.closest()` which isn't available on older Android WebViews). Then finds the label's index among siblings to look up the group data. Sends `venue:<id>` via `postMessage`.

---

## V1.5: Shipped (May 5–6)

Three polish features on top of M1:
- **Custom map locations** — pink "+" FAB on map → AddLocationModal (name + address) → geocoded via Nominatim → pink pin on both native + web maps. Persisted to localStorage on web.
- **Artist SoundCloud links** — tap any artist name in event sheets → opens `soundcloud.com/search?q=Artist+Name`
- **Compact bottom sheets** — snapPoints 35%/60% (down from 50%/80%), web maxHeight 40% (down from 80%), tighter spacing/smaller fonts throughout

### Bug fix (simplify pass)
`map.tsx` — `setCustomLocations(getCustomLocations())` was a React no-op because the module-level array reference never changes. Fixed with spread: `setCustomLocations([...getCustomLocations()])`.

### Files changed in V1.5
`types.ts` (CustomLocation), `Theme.ts` (customLocation: #EC4899), `dataService.ts` (get/add/remove custom locations + localStorage), `map.tsx` (wires AddLocationModal + state), `MapScreen.tsx` + `.web.tsx` (custom markers, pink FAB), `AddLocationModal.tsx` (new — cross-platform, Nominatim geocode), all 4 bottom sheet variants (SoundCloud links, compact sizing)

## M1: Base (previously shipped)

All four tabs functional. Deployed at movement-planning.netlify.app.

| Tab | Status |
|-----|--------|
| Schedule | Gantt + List toggle. Event tap opens bottom sheet. |
| Map | Venue pins + custom location pins. Tap pin → venue sheet → event sheet. |
| My Plan | Placeholder ("Coming May 13") |
| Who's Going | Placeholder ("Coming May 13") |

## Architecture

Expo SDK 49 + expo-router. Platform-specific files use `.web.tsx` extension (Metro handles resolution, needs `.tsx` fallback).

| Base (.tsx / native) | Web (.web.tsx) |
|----------------------|----------------|
| `MapScreen.tsx` — react-native-maps | `MapScreen.web.tsx` — Leaflet iframe |
| `EventBottomSheet.tsx` — @gorhom/bottom-sheet | `EventBottomSheet.web.tsx` — RN Modal |
| `VenueBottomSheet.tsx` — @gorhom/bottom-sheet | `VenueBottomSheet.web.tsx` — RN Modal |
| `GanttView.tsx` — WebView / Platform.OS check | (single file, branches internally) |

**CRITICAL:** Keep base `.tsx` + web `.web.tsx` pattern. Do NOT rename to `.native.tsx` — breaks `tsc`.

## Domain: Movement Detroit 2026 (May 22–25)

Dark-mode only. 28 events, 12 venues (2 TBA, coordinates null). 20-person friend group.

**Return to the Source** (seriesId: "return-to-source"): 3-party pass by Interdimensional Transmission — Tresor 313 (Sat night), Lot Mass (Mon daytime), The Bunker (Mon night), all at Tangent. One pass covers all three.

**IT also runs** (not part of pass): Fade II Black (Thu), T4T Luv NRG (Fri) — both at Tangent.

**Freaks Come Out at Light**: 04:20–12:00 Sun May 24, Art Park at Motor City Wine. Free.

## Gantt + Map Bridge Pattern

Both GanttView and MapScreen.web.tsx use the same `window.ReactNativeWebView.postMessage(id)` bridge:
- Gantt: vis-timeline `select` event → `postMessage(eventId)`
- Map: Leaflet marker click → `postMessage(venueId)`
- On native WebView: `onMessage` handler captures it
- On web iframe: `onLoad` injects `ReactNativeWebView.postMessage` into `contentWindow`

## Key Fixes This Session

### `@gorhom/bottom-sheet` web crash
`react-native-reanimated` 3.3.0 crashes on web with `worklet.__workletHash undefined`. Web variants use React Native `<Modal>` instead. No reanimated/gesture-handler needed on web.

### `react-native-maps` webpack
`react-native-maps` contains JSX that webpack can't parse. webpack.config.js uses NormalModuleReplacementPlugin to stub it out on web (it's never used there — MapScreen.web.tsx uses Leaflet).

## Files

```
src/
  app/
    _layout.tsx               — root <Tabs> (schedule, map, plan, social)
    index.tsx                  — Schedule tab
    map.tsx                    — Map tab → MapScreen → VenueBottomSheet → EventBottomSheet
    plan.tsx                   — placeholder
    social.tsx                 — placeholder
  models/
    types.ts                   — Event, Venue (coordinates: Coordinates | null)
    events.json                — 28 events
    venues.json                — 12 venues (2 TBA = null coordinates)
  features/
    schedule/
      ScheduleScreen.tsx       — SegmentedControl (Gantt / List)
      GanttView.tsx            — vis-timeline in WebView/iframe ⚠️ FRAGILE
      ListView.tsx             — flat event list
    venues/
      MapScreen.tsx            — react-native-maps (native)
      MapScreen.web.tsx        — Leaflet iframe (web)
  components/
    EventBottomSheet.tsx       — @gorhom/bottom-sheet (native)
    EventBottomSheet.web.tsx   — RN Modal (web)
    VenueBottomSheet.tsx       — @gorhom/bottom-sheet (native)
    VenueBottomSheet.web.tsx   — RN Modal (web)
    ScreenLayout.tsx           — title + container
    SegmentedControl.tsx       — pill toggle
    Badge.tsx                  — colored label badge
  services/
    dataService.ts             — getEvents, getVenues, getEventsByDay, etc.
    persistence.ts             — empty stubs
  constants/
    Theme.ts                   — COLORS, SPACING, BORDER_RADIUS
```

## Deploy

```bash
npx expo export:web
netlify deploy --prod --dir=web-build   # movement-planning.netlify.app
```

Netlify site ID: `e9bc7281-fc28-402e-a5ff-e83d83668474` (in `.netlify/state.json`)

## Google Maps API Key

Key is set in `app.json` (both android + ios). If it stops working, get a new one from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Maps SDK for Android + iOS).

## Tests

```
npm test   # 29 tests, 4 suites, all passing
```

## Milestone 2 (due May 13)

- Supabase: events, users, rsvps, tickets tables
- Magic link auth (email only)
- My Plan: chronological RSVP list, spend total, ticket toggle + paste-URL
- Who's Going: person-centric view, event counts in bottom sheet
- Sleep/custom blocks on Gantt
