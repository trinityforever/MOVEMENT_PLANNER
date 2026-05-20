# Movement Planning App Instructions

This repository is for a mobile MVP built around Movement Festival afterparty planning in Detroit. The app should be designed for React Native or a similar cross-platform mobile stack.

## What to build
- Gantt-style schedule view for afterparties and events
- Venue directory with addresses, opening times, contact links, and map integration
- Ticket/ticket-app flow so users can lock in attendance for parties
- Social friend finder for location sharing and event presence

## Suggested structure
- `src/app` or `src/navigation`: navigation and app shell
- `src/features/schedule`: schedule / Gantt view logic
- `src/features/venues`: venue directory and details
- `src/features/tickets`: booking state and ticket integration
- `src/features/social`: friends, location sharing, presence
- `src/components`: reusable UI components
- `src/models` or `src/types`: shared data models
- `src/services`: persistence, API, ticket backends, location
- `src/stores` or `src/state`: Zustand/React Context state logic

## State management
- Prefer `Zustand` for app-wide state that is easy to compose
- Use `React Context` only for theming and app-level services
- Reserve Redux for complex cross-feature coordination only

## Data models
Use typed domain models for key entities.

### Core entities
- `User`: id, name, avatarUrl, handle, currentLocation, friendIds, ticketIds
- `Venue`: id, name, address, coordinates, hours, contact, links
- `Event`: id, title, venueId, startTime, endTime, description, category, capacity, ticketType
- `Ticket`: id, eventId, userId, status, price, source, expiresAt
- `Friendship`: userId, friendId, status, mutual, lastSeenAt
- `LocationShare`: userId, latitude, longitude, timestamp, visibility

## Persistence
Store cached app state in JSON-friendly form:
- `memory/user.json`
- `memory/events.json`
- `memory/venues.json`
- `memory/tickets.json`
- `memory/social.json`

Keep objects normalized by `id` and use arrays or maps for relationships.

## Milestones
Week 1: core scheduling, data models, navigation scaffold
Week 2: venue directory, ticket booking, data persistence
Week 3: friend finder, location sharing, event presence
Week 4: polish Gantt interactions, deep links, offline handling

## Agent behavior
- Preserve modular feature boundaries
- Keep state minimal and domain-driven
- Prefer data-driven screen design over ad hoc props
- Focus on architecture guidance when source files are missing
- If source files are missing, scaffold `src/` feature folders and starter Expo app structure first
