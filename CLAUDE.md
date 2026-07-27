# CLAUDE.md — Movement Planning (FLINTASTIC)

Festival planning app for Movement Detroit. Gantt schedule, venue map, RSVPs, friend
coordination. Shipped May 2026 for the 2026 edition.

## Status: paused

Resume trigger: prepare the 2027 Movement Detroit edition (`workspace.yaml` owns this —
folder placement and prose here do not). Do not start speculative work; the dataset is
2026-specific (28 events, 12 venues, May 22–25).

## The remote is public

`origin` is public and intentionally so. Two consequences that override normal habits:

- **A Google Maps API key is reachable in commit `9340075` on `origin/main`.** Rotation is
  pending (`workspace.yaml` → `pending_credential_rotation`). Assume it is compromised.
- `app.json` holds the working key, is gitignored, and is untracked. Keep it that way.
  Never `git add -f` it, never paste its contents into a commit message, issue, or log.

Anything committed here is world-readable immediately.

## AGENTS.md is not a map

`AGENTS.md` is a 117-line pre-build spec written before the app existed — "UI scaffolding
expected to exist or be added", plus a *recommended* `features/schedule/` layout. The
shipped app does not match it. Read `README.md`, `HANDOFF.md`, and `src/` for actual
structure. Do not follow AGENTS.md's file tree.

## Stack and layout

Expo 49 + expo-router + TypeScript. Web build goes through `@expo/webpack-config` and
deploys to `movement-planning.netlify.app`.

```
src/app/          expo-router routes
src/features/     schedule (Gantt), map, itinerary
src/components/   shared UI
src/services/     data access — dataService owns events.json
src/models/       TS interfaces
src/constants/
stubs/            react-native-web shims (24 files) wired in webpack.config.js
patches/          expo-router+2.0.15.patch — applied by patch-package on postinstall
proposals/        five unbuilt design directions; not wired to anything
```

## Commands

```bash
npm install          # runs patch-package via postinstall — required, not optional
npx expo start       # dev; --web / --ios / --android
npm test             # jest
npm run typecheck    # tsc --noEmit
```

## Gotchas

- **`npm install` must run the postinstall.** expo-router 2.0.15 is patched; skipping
  patch-package produces routing failures that look like app bugs.
- **`stubs/` is load-bearing on web.** Those are hand-written RN-internals shims resolved
  by `webpack.config.js`. A dependency bump can silently need a new one.
- Gantt bar widths clip against a real noon→next-day window — overnight events broke when
  this was hour-only heuristics. Do not simplify back.
- Pinch zoom exists only in the custom web Gantt path; native WebView behavior is unverified.
- RA DJ-page links are best-effort slugs (`ra.co/dj/...`), not canonical RA IDs.

## Known open (from HANDOFF.md, 2026-05-21)

RSVP state not reflected in the native EventBottomSheet · no conflict detection for
overlapping itinerary events · `removeCustomLocation` exists in dataService with no UI.
