# Movement Planning

Dark-mode festival planning app for Movement Detroit 2026 (May 22–25). Gantt schedule, venue map, RSVPs, and friend coordination for a ~20-person group across 28 events and 12 venues.

## How to Use (Friends)

### Option 1: Web (easiest)

Open **[movement-planning.netlify.app](https://movement-planning.netlify.app)** on your phone or desktop.

### Option 2: Mobile App via Expo Go (iOS/Android)

1. Install **Expo Go** from the App Store or Google Play
2. Ask Trinity to run `npx expo start` — scan the QR code from their terminal
3. Or clone this repo yourself: `git clone <url> && cd "Movement Planning" && npm install && npx expo start`

> The web version at the link above works on phone browsers too — no install needed.

### What's Live

| Tab | What It Does |
|-----|-------------|
| **Schedule** | Gantt chart + event list of all 28 afterparties, color-coded by category |
| **Map** | 12 venues with violet pins. Tap a pin to see venue details and events |
| **My Plan** | Coming May 13 — RSVPs, ticket tracking, spend total |
| **Who's Going** | Coming May 13 — see which friends are at each event |

## Development

```bash
cd "Movement Planning"
npm install
npm start          # Expo dev server
npm run web        # Web dev server
npm test           # 29 tests, all passing
```

### Project Structure

```
src/
  app/              Expo Router (4 bottom tabs)
  features/schedule/  GanttView (vis-timeline), ListView, ScheduleScreen
  features/venues/    MapScreen (Leaflet on web, react-native-maps on native)
  components/         EventBottomSheet, VenueBottomSheet, ScreenLayout, Badge
  models/             TypeScript types, events.json, venues.json
  services/           dataService.ts, persistence.ts
  constants/          Theme.ts
```

### Platform Files

`.web.tsx` files override `.tsx` on web builds. Key splits:
- `MapScreen.tsx` (react-native-maps) / `MapScreen.web.tsx` (Leaflet)
- `EventBottomSheet.tsx` (@gorhom/bottom-sheet) / `EventBottomSheet.web.tsx` (Modal)
- `VenueBottomSheet.tsx` (@gorhom/bottom-sheet) / `VenueBottomSheet.web.tsx` (Modal)

### Deploy

```bash
npm run web              # or: npx expo export:web
npx netlify-cli deploy --prod --dir=web-build
```
