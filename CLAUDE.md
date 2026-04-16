# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

A personal trip-planning suite for the **Movement 2026** festival weekend in Detroit (Thu May 21 – Mon May 25, 2026). No build tools or dependencies — everything is static files.

## Files

| File | Purpose |
|------|---------|
| `detroit_gantt_20260409.html` | Self-contained interactive Gantt chart app (~1100 lines of HTML/CSS/JS) |
| `ra_detroit_events_20260409.csv` | Source event data (Event Name, Date, Time, Venue, Address, Lineup) |
| `ra_detroit_events_20260409.xlsx` | Same data as Excel |
| `ra_detroit_checklist_20260409.md` | Markdown checkbox list grouped by day |

To view the Gantt chart, open `detroit_gantt_20260409.html` directly in a browser — no server needed.

## Gantt Chart Architecture

The HTML file is entirely self-contained. Key sections (by line number):

- **Lines 1–515**: CSS styles. Day colors: Thu=dark purple, Fri=purple, Sat=blue, Sun=green, Mon=orange.
- **Lines 516–544**: `let events = [...]` — the embedded event data array. **This is the only place to add/edit/remove events.**
- **Lines 546–553**: Chart geometry constants (`DAY_OFFSET`, `PX_PER_HOUR = 40`, `CHART_WIDTH`).
- **Lines 554+**: JavaScript — rendering, tooltip, selection, edit-DB, and export logic.

### Event Object Schema

```js
{
  id: 'fri-1',          // unique, format: {day}-{n}
  name: "Event Name",
  day: "fri",           // thu | fri | sat | sun | mon
  date: "Fri, May 22",
  start: "20:00",       // 24h clock; times past midnight use >24 (e.g. "26:00" = 2 AM next day)
  end: "26:00",         // same convention
  venue: "Venue Name",
  addr: "Full address",
  lineup: "Artist 1, Artist 2, ..."
}
```

**Important:** Times that cross midnight are encoded as hours > 24 (e.g. an event ending at 6 AM the next morning is `end: "30:00"`). The `DAY_OFFSET` map (`{ thu: 0, fri: 24, sat: 48, sun: 72, mon: 96 }`) converts days + hours into a single horizontal position.

### Tabs / Views

1. **Gantt** (default) — horizontal timeline across all days; click a bar to select/star it
2. **Selected** — cards for all starred events, sorted chronologically; shows address + lineup
3. **Edit Database** — sortable/filterable table; supports inline edit, add, delete, and CSV export

### Updating Event Data

- Edit the `events` array in the HTML directly (lines 518–544), **or**
- Update the CSV and regenerate the array — the CSV columns map directly to the object fields (Time → start/end, split on ` - `).
- The checklist (`ra_detroit_checklist_20260409.md`) is maintained separately and must be updated manually to stay in sync.
