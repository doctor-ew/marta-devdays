# SPEC: Match Day ATL — FIFA World Cup 2026 Fan Transit Navigator

**Issue:** [#1 — Build Match Day ATL — FIFA World Cup 2026 Fan Transit Navigator](https://github.com/doctor-ew/atlaiweek-fifa-v3/issues/1)
**Status:** Draft
**Stack:** Next.js App Router · Tailwind 4 · Vercel AI SDK · Google Maps JS API · MARTA feeds
**MARTA topology (verified):** Stadium served by Blue + Green Lines (Vine City / SEC District stations). Red + Gold Lines serve north Atlanta → Five Points → south to Airport. Dunwoody = Red Line. Decatur = Blue Line.

---

## Engineer Notes

**Intent:** A fullscreen Google Maps view centered on Mercedes-Benz Stadium, showing animated real-time MARTA bus and train positions (refreshing every 1–5 seconds) with live traffic overlay, plus a right sidebar with FIFA match schedule, departure zone picker (airport, downtown, Decatur, Dunwoody, etc.), and a Claude chat that tells fans exactly which MARTA line to take to the game.

**Hidden constraints:** None known.

**Blast radius:** Greenfield — no existing files at risk. All files are new.

---

## Overview

Single-page web app for FIFA World Cup 2026 fans attending matches at Mercedes-Benz Stadium in Atlanta. The app answers one question: "How do I get to the game?"

- **Left/main:** Fullscreen Google Maps — stadium-centered, live animated MARTA vehicles (bus + train icons), Google traffic layer, user location
- **Right:** 320px fixed sidebar — FIFA match schedule, departure zone selector, Claude chat response
- **AI:** Claude streams a 2–3 sentence routing recommendation in the voice of a local Atlanta friend

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Create | Dependencies: next, react, ai, @ai-sdk/anthropic, swr, zod, @googlemaps/js-api-loader, tailwindcss |
| `tsconfig.json` | Create | TypeScript strict mode |
| `next.config.ts` | Create | Next.js App Router config |
| `tailwind.config.ts` | Create | Tailwind 4 config |
| `postcss.config.mjs` | Create | PostCSS for Tailwind |
| `.env.example` | Create | Environment variable template |
| `app/layout.tsx` | Create | Root layout — loads Google Maps script |
| `app/page.tsx` | Create | Root page — map + sidebar composition |
| `app/globals.css` | Create | Tailwind base styles |
| `app/api/marta/route.ts` | Create | Server route — polls MARTA feeds, normalizes to Vehicle shape, caches briefly |
| `app/api/recommend/route.ts` | Create | Server route — streams Claude response via streamText |
| `components/MapView.tsx` | Create | Fullscreen Google Maps with stadium marker, vehicle markers, traffic layer |
| `components/Sidebar.tsx` | Create | Right pane container |
| `components/MatchSelector.tsx` | Create | Single-select list of 8 FIFA matches |
| `components/ZonePicker.tsx` | Create | Radio-style departure zone selector |
| `components/RecommendationArea.tsx` | Create | Streams and displays Claude response |
| `components/DelayBanner.tsx` | Create | Visible banner when inject_delay query param is active |
| `lib/marta.ts` | Create | MARTA fetch + normalize logic (buses + trains → Vehicle[]) |
| `lib/matches.ts` | Create | Match schedule loader + Zod validation |
| `lib/fallbacks.ts` | Create | Pre-written fallback responses (zone × delay-state matrix) |
| `lib/prompt.ts` | Create | Claude system prompt builder |
| `types/index.ts` | Create | Vehicle, Match, Zone, DelayState TypeScript types |
| `public/matches.json` | Create | Static JSON — 8 Atlanta FIFA 2026 matches |

**File count:** 23 new files across 5+ top-level modules (app, components, lib, types, public)

---

## Data Models

### Vehicle
```typescript
type VehicleType = 'bus' | 'train';

interface Vehicle {
  id: string;
  type: VehicleType;
  route: string;       // e.g. "Gold Line", "Blue Line", "Route 110"
  lat: number;
  lng: number;
}
```

### Match
```typescript
interface Match {
  match_id: string;
  team_a: string;       // "USA", "TBD" for knockouts
  team_b: string;
  kickoff_utc: string;  // ISO 8601
  stage: string;        // "Group Stage" | "Round of 16" | "Quarterfinal" | etc.
  group: string | null; // null for knockout rounds
}
```

### Zone
```typescript
type Zone =
  | 'downtown'    // Five Points / Centennial Park
  | 'midtown'     // Arts Center / Peachtree
  | 'airport'     // College Park / MARTA spine
  | 'decatur'     // Decatur MARTA station
  | 'dunwoody';   // Dunwoody MARTA station (Red Line, north terminus area)
```

### DelayState
```typescript
type DelayState = 'normal' | 'blue_line_delay';
```

---

## Match Schedule (`public/matches.json`)

Eight Atlanta matches, June–July 2026. Knockout bracket teams shown as "TBD". Example structure:

```json
[
  {
    "match_id": "ATL-1",
    "team_a": "USA",
    "team_b": "Belgium",
    "kickoff_utc": "2026-06-15T23:00:00Z",
    "stage": "Group Stage",
    "group": "C"
  }
]
```

Zod schema validated at server render time. Build/render fails if malformed.

---

## API Routes

### `GET /api/marta`

**Purpose:** Normalized MARTA vehicle positions for client polling.

**Server behavior:**
1. Check `USE_MOCK_MARTA_DATA` env — if `"true"`, return hardcoded mock vehicles immediately
2. Fetch MARTA bus GTFS-RT protobuf feed (vehicle positions)
3. Fetch MARTA train REST JSON API (`MARTA_TRAIN_API_KEY`)
4. Normalize both to `Vehicle[]`
5. Cache response for 5 seconds (avoid hammering feeds)
6. If both feeds fail, return hardcoded mock vehicles (graceful degradation)

**Response:**
```json
{
  "vehicles": Vehicle[],
  "cached": boolean,
  "source": "live" | "mock"
}
```

**Client polling:** SWR with `refreshInterval: 2000` (2 seconds default, configurable up to 5000ms).

### `POST /api/recommend`

**Purpose:** Streams Claude routing recommendation.

**Request body:**
```json
{
  "zone": Zone,
  "match_id": string,
  "delay_state": DelayState
}
```

**Server behavior:**
1. Check `USE_MOCK_CLAUDE` env — if `"true"`, return fallback response immediately (status 200)
2. Derive `minutes_until_kickoff` from `kickoff_utc` and `Date.now()`
3. Build prompt via `lib/prompt.ts`
4. Call Claude via `streamText` with 8-second abort timeout
5. On timeout or API error: return pre-written fallback for (zone, delay_state) — status 200

**Claude system prompt constraints:**
- Voice: "Local Atlanta friend who knows MARTA well"
- Never say: "Route A", "minutes saved", "optimal path", "utilize"
- Max 3 sentences
- If delay active, acknowledge it and give real alternative

**Response:** `text/event-stream` (streaming)

---

## Component Architecture

```
app/page.tsx
├── DelayBanner          (conditional — inject_delay query param)
├── MapView              (fullscreen, z-0)
│   ├── Stadium marker   (soccer ball icon, always visible)
│   ├── User location    (blue dot, permission-gated)
│   ├── Vehicle markers  (bus/train icons, animated)
│   └── Traffic layer    (toggleable)
└── Sidebar              (fixed 320px right, z-10)
    ├── AppHeader        (inline — "Match Day ATL" + subtitle)
    ├── MatchSelector    (single-select, 8 matches)
    ├── ZonePicker       (radio: Downtown / Midtown / Airport / Decatur / Dunwoody)
    ├── CTA button       (disabled until match + zone selected)
    └── RecommendationArea
        ├── skeleton state  (pulse while waiting for first token)
        ├── streaming state (token-by-token with blinking cursor)
        └── error state     (friendly message + "Try again")
```

---

## Map Behavior

- Centered on Mercedes-Benz Stadium: `lat: 33.7554, lng: -84.4011`
- Zoom level: 13 (shows stadium neighborhood + transit lines)
- Vehicle markers update position smoothly — use CSS transition on marker position, not teleport
- Vehicle icon: bus emoji or SVG for bus, train emoji or SVG for train; route label below
- Stadium marker: soccer ball (⚽) custom marker, always on top
- Traffic layer: Google Maps `TrafficLayer`, toggle button in map controls
- User geolocation: `navigator.geolocation.getCurrentPosition()` — fail silently if denied

---

## Demo Mode (Delay Injection)

URL: `?inject_delay=blue_line`

When active:
- `DelayBanner` renders: "⚠ Blue Line delay active" (yellow banner, top of page)
- `/api/recommend` receives `delay_state: "blue_line_delay"`
- Claude prompt includes: "Blue Line: Moderate congestion — 20+ min delays at Vine City / SEC District"
- Fallback response (if Claude unavailable) uses delay-aware text for the zone

Why URL param: bookmarkable demo URL, no client state, works from fresh load.

---

## Fallback Responses

Pre-written in `lib/fallbacks.ts`. One per zone × delay-state combination (10 combinations for 5 zones × 2 delay states). Must sound authentic, not canned. Example:

```typescript
const fallbacks: Record<Zone, Record<DelayState, string>> = {
  downtown: {
    normal: "Grab the Blue Line at Five Points — one stop straight to Vine City, about 4 minutes. Get there 90 minutes early and you'll beat the crush. MARTA's looking clean right now.",
    blue_line_delay: "Blue Line's backed up today — walk from Five Points, it's about 12 minutes straight down Mitchell St to the stadium. Quicker than waiting on a delayed train.",
  },
  // ...
}
```

---

## Kill Switches

| Env Var | Value | Effect |
|---------|-------|--------|
| `USE_MOCK_CLAUDE` | `"true"` | `/api/recommend` returns fallback immediately, no Claude call |
| `USE_MOCK_MARTA_DATA` | `"true"` | `/api/marta` returns hardcoded vehicles, no MARTA feeds |

---

## Environment Variables

| Var | Visibility | Required | Purpose |
|-----|-----------|----------|---------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public | Yes | Google Maps JS API |
| `NEXT_PUBLIC_STADIUM_LAT` | Public | Yes | Map center (33.7554) |
| `NEXT_PUBLIC_STADIUM_LNG` | Public | Yes | Map center (-84.4011) |
| `NEXT_PUBLIC_STADIUM_NAME` | Public | Yes | "Mercedes-Benz Stadium" |
| `MARTA_TRAIN_API_KEY` | Server | Yes | MARTA REST train API |
| `ANTHROPIC_API_KEY` | Server | Yes | Claude API |
| `USE_MOCK_CLAUDE` | Server | No | Kill switch |
| `USE_MOCK_MARTA_DATA` | Server | No | Kill switch |

---

## Acceptance Criteria

1. App loads on mobile in under 3 seconds on 4G
2. Map shows animated transit markers within 10 seconds of load (vehicle markers moving, not static)
3. User can select a match, select a zone, and receive a Claude recommendation in one uninterrupted flow
4. If Claude times out (8s), a fallback response appears — no stuck spinner, no crash
5. If MARTA API is down, map still shows mock vehicles
6. `?inject_delay=gold_line` produces visible yellow banner + delay-aware recommendation
7. TypeScript strict — no `any`
8. `git push` → Vercel production deployment in under 60 seconds

---

## Non-Requirements (v1)

- No user accounts
- No match prediction, ticketing, or results
- No per-vehicle arrival time tracking
- No multilingual UI
- No push notifications
- No offline mode

---

## Model Router

**Files to Change count:** 23 files across 5 top-level modules (app, components, lib, types, public)

Decision tree:
- ≥ 3 files ✓ (23 files)
- ≥ 2 top-level modules ✓ (5 modules)
- Architecture decision (Google Maps + MARTA feed normalization + Claude streaming integration) ✓
- Shared contract change (Vehicle type, Match type, Zone type used across all modules) ✓

**Decision:** Opus / Enterprise Architect

---

## Sources

- `FULL-PRD.md:1-200` (branch: main, commit: 8a83e14) — primary requirements source; all functional requirements, data models, API shapes, env vars, kill switches, and acceptance criteria derived from this file
- `FULL-PRD.md:39-60` (branch: main, commit: 8a83e14) — map requirements: Google Maps, MARTA data sources, vehicle shape `{ id, type, route, lat, lng }`, polling interval, graceful degradation
- `FULL-PRD.md:66-93` (branch: main, commit: 8a83e14) — sidebar sections: match selector, zone picker (Downtown/Midtown/Airport), CTA, recommendation area states
- `FULL-PRD.md:97-118` (branch: main, commit: 8a83e14) — Claude voice constraints, 3-sentence limit, streaming via Vercel AI SDK, 8-second timeout + fallback pattern
- `FULL-PRD.md:122-132` (branch: main, commit: 8a83e14) — demo mode: `?inject_delay=gold_line`, banner behavior, modified Claude prompt
- `FULL-PRD.md:137-149` (branch: main, commit: 8a83e14) — match data schema: match_id, team_a, team_b, kickoff_utc, stage, group; Zod validation; fallback response structure
- `FULL-PRD.md:175-199` (branch: main, commit: 8a83e14) — environment variables table; kill switches `USE_MOCK_CLAUDE`, `USE_MOCK_MARTA_DATA`
- GitHub Issue #1 (https://github.com/doctor-ew/atlaiweek-fifa-v3/issues/1) — engineer-confirmed scope; departure zones expanded to include Decatur and Dunwoody per engineer grounding answer
