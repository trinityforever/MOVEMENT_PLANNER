# Movement Planning App AI Instructions

## Project Overview
This repository is for a mobile MVP focused on planning afterparties and social meetups for Movement Festival in Detroit.

Core features:
- Gantt-style schedule view for afterparties and events
- Venue directory with address, hours, and links
- Ticket/ticket app integration for users to lock in attendance
- Social friend finder with shared location and event presence

This is a React Native or similar mobile app, with UI scaffolding expected to exist or be added.

## Recommended Structure
Use a modular mobile app architecture with clear separation between UI, state, navigation, and data.

Suggested top-level folders:
- `src/` - app source code
  - `app/` or `navigation/` - navigation setup and route definitions
  - `features/` - feature modules (schedule, venues, tickets, social)
  - `components/` - reusable presentational components
  - `services/` - API, ticket integration, location, persistence
  - `stores/` or `state/` - global/local state management logic
  - `models/` - TypeScript interfaces or schema definitions
  - `utils/` - helpers, date formatting, location helpers
  - `assets/` - icons, images, fonts
- `tests/` - unit and integration tests
- `docs/` - project and architecture documentation

Prefer small feature folders like `features/schedule/`, `features/venues/`, `features/tickets/`, `features/social/`.

## State Management Guidance
The mobile app should use a lightweight, predictable state layer for event attendance, friends, venue details, and location.

Recommended approach:
- Use `Zustand` for local/global client state and ease of composition
- Use `React Context` only for theme or app-level services if needed
- Add `Redux Toolkit` only if the app grows toward complex cross-feature workflows
- Keep real-time friend location and event check-in state in a dedicated store
- Keep offline/local persistence for locked tickets and saved favorites

Example state domains:
- Schedule state: selected day, Gantt filters, active event
- Venue state: loaded venue list, selected venue details
- Ticket state: booked events, ticket status, integration auth
- Social state: friends list, shared location consent, event presence
- App state: user session, loading/error state, offline cache

## Data Model Guidance
Use explicit models for the app’s main entities. Keep them normalized and easy to map to UI components.

Suggested models:
- `User` / `Profile`:
  - `id`, `name`, `avatarUrl`, `handle`, `currentLocation`, `friends`, `ticketIds`
- `Venue`:
  - `id`, `name`, `address`, `city`, `coordinates`, `hours`, `contact`, `links`
- `Event`:
  - `id`, `title`, `venueId`, `startTime`, `endTime`, `description`, `category`, `capacity`, `ticketType`
- `Ticket`:
  - `id`, `eventId`, `userId`, `status`, `seatInfo`, `purchaseSource`, `expiresAt`
- `Friendship`:
  - `userId`, `friendId`, `status`, `mutual`, `lastSeenAt`
- `LocationShare`:
  - `userId`, `latitude`, `longitude`, `timestamp`, `accuracy`, `visibility`

Keep data model definitions in `src/models/` or `src/types/` and use them consistently across features.

## Memory / Persistence Format
Store app state in a JSON-friendly format that can be persisted locally.

Example memory schema ideas:
- `memory/user.json`:
  - current user profile, consent flags, last active timestamp
- `memory/events.json`:
  - cached event list, schedule positions, venue relationships
- `memory/venues.json`:
  - venue directory data with lookup by `id`
- `memory/tickets.json`:
  - locked ticket records and integration tokens
- `memory/social.json`:
  - friend presence snapshots, last shared location

A normalized JSON schema should keep objects keyed by `id` and separate arrays for relationships.

## Weekly Milestones
Use a short, focused milestone plan for the MVP. The app should be built in incremental weekly sprints.

Week 1: Core scheduling + data shape
- define models and state stores
- implement basic event and venue data loading
- scaffold main navigation and schedule view layout

Week 2: Venue directory + tickets
- build venue list and venue detail screens
- add ticket-attendance flow and local booking state
- connect ticket data model to schedule items

Week 3: Social friend finder
- add friends list and location sharing opt-in
- implement event presence indicators
- enable friend filtering on the schedule and venue views

Week 4: Polish and integration
- finalize Gantt-style schedule interactions
- add deep links / external venue links
- test offline persistence and ticket state
- prepare app for QA or MVP release

## Agent Behavior
When editing or expanding this repo, focus on:
- preserving modular feature boundaries
- keeping state simple and local where possible
- using typed models for all event, venue, ticket, and social data
- avoiding overly broad global state if `Zustand` can handle the domain
- making every screen driven by data models, not ad hoc props

If asked for implementation, return only the architecture, folder layout, and model guidance unless the workspace already contains code to adapt.
