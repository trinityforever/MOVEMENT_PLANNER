# SESSIONS.md — Movement Planning (FLINTASTIC)
<!-- Append newest session summary at the top. Do not create new HANDOFF files — update this instead. -->

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
