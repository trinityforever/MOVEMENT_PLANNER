# SESSIONS.md — Movement Planning (FLINTASTIC)
<!-- Append newest session summary at the top. Do not create new HANDOFF files — update this instead. -->

## 2026-05-21 — Artist popup + map drawer + Gantt mobile fixes

**Done:**
- Added artist cross-party popup in EventBottomSheet on web and native: tapping an artist now shows other events for that artist in the local database
- Added direct RA DJ-page spot-check links in the artist popup using a best-effort slug helper (`ra.co/dj/...`) plus exhaustive tests around the slug generation
- Confirmed `getEventsByArtist()` is exact against the current local dataset with exhaustive coverage for every artist in `events.json`
- Fixed web ownership of the new drawer layout: the right-side slide-out now belongs to the map venue popup, while schedule event detail is back to a centered modal
- Fixed mobile web map venue popup formatting so it becomes a readable full-width bottom sheet on narrow screens instead of a crushed desktop drawer
- Removed the duplicate inline Gantt popup so event taps now open only the shared event detail modal
- Fixed daily Gantt rendering for overnight events by clipping bar widths against the real noon→next-day window instead of hour-only heuristics
- Added two-finger pinch zoom to the custom Gantt timeline on touch devices while preserving native single-finger scrolling
- Pushed these changes through GitHub and Netlify production

**Still to do / caveats:**
- RA DJ-page links are best-effort derived from the artist string, not canonical verified RA IDs
- Pinch zoom currently exists only in the custom Gantt web timeline path; native WebView behavior should be spot-checked on actual devices
- RSVP state is still not reflected in the native EventBottomSheet buttons the same way it is on web
- No conflict detection for overlapping events in itinerary
- `removeCustomLocation` exists in dataService but there is still no UI to remove pins from the map

**Build:** Clean. Pushed to `origin/main` at `ca53198`. Netlify production updated at `movement-planning.netlify.app`.

## 2026-05-21 — V1.0 ship + codebase cleanup

**Done:**
- Removed social tab from nav (`href: null`), archived SocialScreen
- Fixed 5 V1.0 gaps: RSVP buttons in EventBottomSheet (web+native), Gantt going-indicators (★ + outline), editable budget (TextInput, `budget_v1` localStorage), `★ GOING` replacing `✓ CONF` in tickets, TUE May 26 removed from day selector
- Added WKND view in Gantt (all 79 events, 10px/hr compressed timeline across all 5 days)
- Sticky venue labels in Gantt (position: sticky left:0 + header spacer)
- Removed duplicate Gantt/List toggle from ScheduleScreen — GanttView owns all views; renamed GANTT → TIMELINE
- Restored SoundCloud search + added RA search links in artist popup (both .tsx and .web.tsx)
- Archived 14 dead files (Badge, Button, TicketsScreen, persistence stub, social route, stale docs, empty dirs) to `_ARCHIVE/Movement Planning/`
- Moved stale `free-claude-code/` copy out (real project already at `Projects/free-claude-code/`)
- VenueBottomSheet.web.tsx: responsive bottom sheet on mobile, side drawer on desktop (Codex change, merged in)

**Still to do:**
- RSVP state not reflected in native EventBottomSheet (native version has artist popup but no going/want buttons wired to localStorage yet)
- No conflict detection for overlapping events in itinerary
- `removeCustomLocation` exists in dataService but no UI to remove pins from map

**Build:** Clean. Pushed to `origin/main` at `88f775d`.
