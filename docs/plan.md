# Movement Planning App Product Spec & 30-Day Plan

## Product Vision
A mobile-first Expo/React Native planning app for Movement Festival afterparties, built for you and your friends this year.

The app should:
- centralize event and afterparty information for the weekend
- help users plan a personal schedule across venues and days
- provide a simple RSVP/lock-in workflow with notes and photos
- make location sharing and friend presence visible during the festival
- start local-first with the top 20 events and top 10 venues

## Target Users
- Festival attendees wanting a single planning hub for afterparties
- Small friend groups coordinating meetups and shared event choices
- Early adopters who want a mobile-first, offline-friendly planning tool

## Platform
- Expo / React Native mobile app
- First priority: iOS and Android
- Desktop planning is a future companion, not required for MVP

## Core Features
1. Schedule planner
   - day-by-day timeline
   - multi-day overview
   - venue-focused blocks
2. Venue directory
   - top 10 curated venues with address, hours, contact, and links
   - `popular` venue tag for the festival’s most important locations
3. Tickets / RSVP
   - simple lock-in state for parties
   - personal notes and photo attachments per event
4. Social
   - friend list and location sharing consent
   - event presence/status with manual or auto check-in
5. Local-first persistence
   - `memory/` JSON cache for all user data, events, venues, tickets, and social state

## Data Scope for MVP
- Top 20 events preloaded locally
- Top 10 venues preloaded locally
- No external APIs required for initial launch
- Mock or static event and venue data until the festival

## Success Criteria
- Schedule and venue data are fully scaffolded by end of Week 1
- App is shareable and usable by friends for planning by end of Week 2
- Social presence features are functional by end of Week 3
- The app is polished, stable, and documented by end of Week 4

## Monthly Task Board

### Week 1 — Planning shell & core data
- [ ] Create Expo skeleton and navigation
- [ ] Add typed models for `User`, `Venue`, `Event`, `Ticket`, `Friendship`, `LocationShare`
- [ ] Build the schedule screen with day + multi-day + venue views
- [ ] Build venue directory and top venue details
- [ ] Add RSVP / lock-in state
- [ ] Persist event and ticket state to local JSON memory
- [ ] Confirm local top 20 events and top 10 venues are loaded

### Week 2 — Shareable planning release
- [ ] Finalize Expo publish / share configuration
- [ ] Add event search and venue filtering
- [ ] Add "My Plan" or saved schedule view
- [ ] Add onboarding/profile flow for friends
- [ ] Validate app experience on iOS and Android devices
- [ ] Share early build with friends for pre-festival planning

### Week 3 — During-festival social features
- [ ] Add location sharing consent workflow
- [ ] Add friend presence status and event check-in
- [ ] Add friend visibility on schedule or map
- [ ] Support personal notes and photo attachments for locked-in events
- [ ] Enhance RSVP state with manual "at venue" or auto-presence indicators

### Week 4 — Polish and scale readiness
- [ ] Polish UI/UX with festival-friendly visual language
- [ ] Improve offline caching and resilience
- [ ] Add quick access to top venues and schedule highlights
- [ ] Document app architecture and memory formats
- [ ] Define next-cycle sellable architecture (backend sync, broader event ingestion)

## Delivery Plan
- MVP 1: Local planning app with schedule, venues, and RSVP state
- MVP 2: Shareable app preview for friends to use before the festival
- Update 3: Live social features for festival weekend
- Scale plan: move from local-first to backend-powered event and friend sync
