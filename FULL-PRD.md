# PRD: Match Day ATL — FIFA Fan Transit Navigator

---

## Problem

70,000+ fans will attend FIFA World Cup 2026 matches at Mercedes-Benz Stadium in Atlanta.
Most are from out of town. They don't know the city. They don't know MARTA.
Their one question on match day: **"How do I get to the game?"**

Existing transit apps are too generic. They give route numbers and transfer counts.
Fans need a local friend — someone who knows which line to skip when there's a delay,
and can answer in two sentences before the rideshare surge hits.

---

## What We're Building

A single-page web app that:
1. Shows the fan where transit vehicles are right now (live animated map)
2. Lets them say where they're starting from
3. Connects that context to Claude, which answers as a local Atlanta friend

That's it. One question. One answer. Deployed before the first match.

---

## Context

- **Event:** FIFA World Cup 2026, Atlanta host city
- **Venue:** Mercedes-Benz Stadium (Vine City/English Avenue neighborhood)
- **Matches:** 8 matches at MBS (June–July 2026)
- **Primary transit:** MARTA Gold Line and Blue Line serve the stadium directly; College Park bus for airport travelers
- **App name:** Match Day ATL
- **Stack target:** Next.js App Router, Tailwind 4, Claude AI via Vercel AI SDK, deployed on Vercel

---

## The Map

The map is the primary UI. It fills the full screen (or full left pane on desktop).

**Requirements:**
- Google Maps centered on Mercedes-Benz Stadium
- Stadium marker visible at all times (visual anchor)
- User's current location shown (with permission — fail gracefully if denied)
- Live MARTA vehicle positions: buses and trains as distinct markers with route labels
- Vehicle markers animate smoothly as positions update (no teleporting)
- Traffic layer optional — togglable by user
- Map stays interactive at all times; nothing blocks it

**MARTA data source:** Two live feeds
- Buses: GTFS-RT protobuf feed from MARTA (vehicle positions)
- Trains: MARTA REST JSON API (positions + line info)
- Both feeds normalized to the same `{ id, type, route, lat, lng }` shape
- Polled server-side via `/api/marta`, cached briefly to avoid hammering the feeds
- Client polls `/api/marta` every 10 seconds via SWR

**Graceful degradation:** If both feeds fail, return a small set of hardcoded mock vehicles so the map always has transit markers.

---

## The Sidebar

Desktop: fixed 320px right pane. Contains everything non-map.

**Sections top to bottom:**

### 1. App header
- App name ("Match Day ATL") + event subtitle ("FIFA World Cup 2026 · Atlanta")

### 2. Match Selector
- Shows all 8 scheduled Atlanta matches
- Each row: team names (or "TBD" for knockout stage), group/stage, date + kickoff time in Eastern time
- Single selection — tapping a match highlights it
- Required before the CTA is enabled

### 3. Starting Zone Picker
- Three options: **Downtown** (Five Points / Centennial Park), **Midtown** (Arts Center / Peachtree), **Airport** (College Park / MARTA spine)
- Single selection radio-style
- Required before the CTA is enabled

### 4. CTA button
- "How do I get there?" — disabled until both match and zone are selected
- Triggers the Claude recommendation call
- Shows "Routing…" while waiting

### 5. Recommendation area
- Shows Claude's streaming response
- Loading state: skeleton pulse until first token arrives
- Streaming state: text appears token by token with blinking cursor
- Error state: friendly message + "Try again" button
- "Try again" button also appears when response is complete

---

## The AI Recommendation

**What Claude knows in each request:**
- Which zone the user is starting from
- Which match they're attending (teams + kickoff time)
- How many minutes until kickoff (derived at request time)
- Current MARTA status (normal or delay — see Demo Mode below)

**Voice and constraints:**
- "Local Atlanta friend who knows MARTA well"
- Text a friend, not a transit app
- Never say "Route A", "minutes saved", "optimal path", "utilize"
- If MARTA is bad, say so and give the real alternative
- Max 3 sentences

**Streaming:** Response streams token-by-token via Vercel AI SDK `streamText`. Client reads the stream and appends to UI in real time.

**Timeout and fallback:**
- 8-second abort timeout on the Claude call
- If timeout or API error: return a pre-written fallback response matching zone + delay state
- Status 200 either way — user cannot tell it's a fallback (intentional)

---

## Demo Mode (Delay Injection)

For live presentations, the app must be able to show a "Gold Line delay" scenario reliably without needing real delays on MARTA.

**Mechanism:** URL query parameter `?inject_delay=gold_line`

**When active:**
- Visible banner at top of page: "⚠ Gold Line delay active"
- Claude receives a modified status string: "Gold Line: Moderate congestion — 20+ min delays at Vine City"
- Claude generates delay-aware alternative routing advice

**Why query param (not toggle):** Keeps the demo URL bookmarkable. No client state to manage. Works from a fresh load.

---

## Data

### Match schedule
- Static JSON file (`public/matches.json`) — 8 Atlanta matches
- Schema validated with Zod at server render time
- Fail the build/render if match data is malformed

### Match fields
- `match_id`, `team_a`, `team_b`, `kickoff_utc` (ISO 8601), `stage`, `group` (nullable for knockout)

### Fallback responses
- Pre-written for each zone × delay-state combination
- Used when Claude times out or errors
- Should sound authentic, not canned

---

## Non-Requirements

- No user accounts
- No match prediction, ticketing, or results
- No per-vehicle tracking or arrival times (that's a full transit app)
- No multilingual UI for v1 (infrastructure can stub it)
- No push notifications
- No offline mode

---

## Acceptance Criteria

1. App loads on mobile in under 3 seconds on 4G
2. Map shows animated transit markers within 10 seconds of load
3. User can select a match, select a zone, and receive a recommendation in one uninterrupted flow
4. If Claude times out, a fallback appears — no spinner stuck forever, no crash
5. If MARTA API is down, map still shows (with fallback vehicles)
6. Delay injection via URL param produces visible banner + delay-aware recommendation
7. TypeScript strict — no `any`
8. Vercel deployment: `git push` → live in under 60 seconds

---

## Kill Switches (for demos and CI)

| Flag | Effect |
|------|--------|
| `USE_MOCK_CLAUDE=true` | Skip Claude API, return fallback immediately |
| `USE_MOCK_MARTA_DATA=true` | Skip MARTA feeds, return hardcoded vehicles |

Both should be settable via environment variable, no code change needed.

---

## Environment Variables

| Var | Visibility | Purpose |
|-----|-----------|---------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public | Google Maps JS |
| `NEXT_PUBLIC_STADIUM_LAT` | Public | Map center latitude |
| `NEXT_PUBLIC_STADIUM_LNG` | Public | Map center longitude |
| `NEXT_PUBLIC_STADIUM_NAME` | Public | Display name |
| `MARTA_TRAIN_API_KEY` | Server only | MARTA REST train API |
| `ANTHROPIC_API_KEY` | Server only | Claude API |
| `USE_MOCK_CLAUDE` | Server only | Kill switch |
| `USE_MOCK_MARTA_DATA` | Server only | Kill switch |
