# PRD: Match Day ATL — FIFA World Cup 2026 Transit Companion

**Document type:** Product Requirements Document  
**Status:** Final — v2.0  
**Author:** Drew Schillinger (DoctorEw)  
**Stakeholders:** Atlanta Tech Community Network (ATCN), FIFA 2026 Host City Operations  
**Last updated:** 2026-04-11

---

## 1. Background & Problem Statement

Atlanta is hosting eight FIFA World Cup 2026 matches at Mercedes-Benz Stadium, drawing an estimated 70,000+ attendees per match from around the world. Many of these attendees will be unfamiliar with Atlanta's MARTA transit system — the primary recommended method for reaching the stadium — and will need real-time, plain-English guidance.

Existing MARTA apps and Google Maps provide routing, but none are:
- Aware of FIFA match-day context (surge crowds, schedule-linked timing)
- Conversational and approachable for international visitors
- Integrated with real-time MARTA delay data in a fan-friendly format

**Match Day ATL** (v2) fills this gap: a focused, event-aware transit companion that answers the single question fans have on match day — *"How do I get to the stadium right now?"*

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Give any fan — regardless of transit experience — a clear, actionable path to Mercedes-Benz Stadium using MARTA |
| G2 | Surface real-time MARTA delay information in a human-readable, low-panic format |
| G3 | Provide a graceful, still-useful experience even when external APIs are unavailable |
| G4 | Load fast on mobile (LCP < 2.5s) given that users will be on cellular data in the city |

## 3. Non-Goals

- Turn-by-turn walking navigation (defer to Google Maps)
- Multi-stadium routing (Atlanta is the only venue)
- Ticket purchasing or match information beyond basic scheduling
- Ride-share or taxi alternatives
- MARTA fare purchase flows

---

## 4. User Personas

### 4a. The International Visitor — "Camila"
- **Profile:** 34, traveling from São Paulo to see Brazil play. First time in Atlanta. Limited English, unfamiliar with US transit.
- **Needs:** Simple, reassuring guidance. No jargon. Easy-to-scan layout.
- **Pain point:** Google Maps gives her 4 routing options with transfer counts she doesn't understand.

### 4b. The Domestic Fan — "Marcus"
- **Profile:** 28, driving from Birmingham to Atlanta, parking downtown. Knows MARTA exists but has never used it.
- **Needs:** Which station he's near, which line goes to the stadium, how long it takes.
- **Pain point:** He's read MARTA's website but can't figure out which zone applies to where he parked.

### 4c. The Seasoned ATL Local — "DeShawn"
- **Profile:** 42, regular MARTA commuter. Buying tickets for the quarterfinal.
- **Needs:** Quick confirmation that his usual route is unaffected, or an alert if there are delays.
- **Pain point:** Wants the delay info without wading through the full MARTA status page.

---

## 5. User Stories

### Core Flow

> **US-01** As a fan, I can select the FIFA match I'm attending so the app knows my timing context.

> **US-02** As a fan, I can tell the app which part of Atlanta I'm starting from (Downtown, Midtown, or Airport) so I get relevant routing advice, not generic instructions.

> **US-03** As a fan, after selecting my match and zone, I receive a plain-English recommendation that tells me: which station to use, which line to take, and roughly how long the trip takes.

> **US-04** As a fan, I can see live bus and train positions on the map so I have confidence transit is actually running.

> **US-05** As a fan, if MARTA has active delays, I see a clear notice and the routing advice accounts for the delay (e.g., alternative route or adjusted timing).

### Edge Cases & Resilience

> **US-06** As a fan, if the AI recommendation service is unavailable, I still receive a pre-written fallback recommendation appropriate to my zone.

> **US-07** As a fan, if MARTA's live data feed is unavailable, the map still loads (without live markers) and recommendations still work.

> **US-08** As a fan on a slow cellular connection, the page is usable within 3 seconds and the recommendation streams in progressively rather than making me wait for a complete response.

---

## 6. Functional Requirements

### 6a. Match Selection
- **FR-01:** Display all FIFA World Cup 2026 matches scheduled at Mercedes-Benz Stadium in chronological order
- **FR-02:** Each match entry must show: teams (or "TBD"), stage/round, and local kickoff date + time (Eastern Time)
- **FR-03:** Matches in knockout rounds may list one or both teams as "TBD"
- **FR-04:** Only one match may be selected at a time; selection persists until the user changes it

### 6b. Zone Selection
- **FR-05:** Present exactly three starting zones: Downtown, Midtown, Airport
- **FR-06:** Zone selection and match selection are both required before a recommendation is generated
- **FR-07:** Changing either selection clears the current recommendation and allows re-generation

### 6c. AI Recommendations
- **FR-08:** Recommendations must be generated by Claude (Sonnet 4.6) via streaming
- **FR-09:** The system prompt must instruct the model to respond as a "knowledgeable local friend," in ≤ 3 sentences, without bullet points or transit jargon
- **FR-10:** The prompt context must include: selected zone, match kickoff time (UTC), and current MARTA delay status
- **FR-11:** If the AI call exceeds 8 seconds or fails, the app must fall back to a static pre-written response without showing an error to the user
- **FR-12:** `USE_MOCK_CLAUDE=true` environment variable must bypass the AI call entirely (for CI/testing)

### 6d. Live Transit Map
- **FR-13:** Display an interactive Google Map centered on Mercedes-Benz Stadium
- **FR-14:** Show a stadium pin marker on the map at all times
- **FR-15:** Attempt to show the user's current location via the browser Geolocation API; silently skip if denied
- **FR-16:** Show a real-time traffic layer on the map
- **FR-17:** Overlay live MARTA bus and train positions as animated markers, refreshed every 10 seconds
- **FR-18:** If MARTA live data is unavailable, render the map without transit markers (no error state shown)

### 6e. Delay Awareness
- **FR-19:** The `/api/marta` endpoint must check for active delay conditions and surface them in its response
- **FR-20:** An active delay must be displayed as a persistent banner at the top of the recommendation area
- **FR-21:** The delay context must be injected into the AI recommendation prompt so the advice accounts for it
- **FR-22:** A `?inject_delay=gold_line` URL parameter must trigger a simulated Gold Line delay for demo and classroom purposes

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | LCP < 2.5s on 4G mobile (Lighthouse Mobile score ≥ 85) |
| **Streaming** | First recommendation token must appear within 1.5s of request |
| **Availability** | All critical paths (match list, zone picker, fallback recommendation) must work with zero external API calls |
| **Accessibility** | WCAG 2.1 AA: keyboard navigable, ARIA labels on interactive elements, sufficient color contrast |
| **Internationalization** | i18n infrastructure wired (`next-intl`) even if only English ships for v2; no hardcoded user-facing strings |
| **Mobile** | Fully usable on 375px viewport; map and sidebar stack vertically on small screens |
| **Security** | API keys never exposed to the client bundle; `NEXT_PUBLIC_` prefix only for genuinely public config |

---

## 8. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Recommendation generation rate | > 95% of sessions where user selects match + zone receive a recommendation | Server logs on `/api/recommend` |
| Fallback rate | < 5% of recommendations served from static fallback | Log `fallback=true` on each response |
| AI latency (p95) | < 3s to first streamed token | Server-side timing in `/api/recommend` |
| Map load success | > 99% of sessions show map within 3s | Client-side error event tracking |
| MARTA data freshness | Live vehicle positions no older than 15s | Timestamp diff in `/api/marta` response |

---

## 9. Out of Scope (v2)

- User accounts / authentication
- Push notifications for match-day reminders
- Parking + driving directions
- Historical match data or scores
- Multi-language content (infrastructure ready; content deferred)
- Native iOS/Android apps

---

## 10. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| OQ-1 | Will MARTA provide a dedicated match-day data feed, or do we continue using the public GTFS-RT endpoint? | Transit Integration | Open |
| OQ-2 | Should "Airport" zone include both domestic (ATL) and international terminals? Current impl treats it as one zone. | Product | Open |
| OQ-3 | Do we localize the AI prompt for non-English speakers if `next-intl` locale is set? | Engineering | Open |
| OQ-4 | What is the approved stadium branding name for the app — "Mercedes-Benz Stadium" or the FIFA tournament venue name? | Legal/Comms | Open |

---

## 11. Milestones

| Date | Milestone |
|------|-----------|
| 2026-04-25 | v2 feature freeze; all FRs implemented |
| 2026-05-09 | QA complete; accessibility audit passed |
| 2026-05-16 | Staging deployment + MARTA API key provisioned |
| 2026-05-30 | Production launch (2 weeks before first match) |
| 2026-06-14 | **First match day** — USA vs. Bolivia |
| 2026-07-10 | Final match at Mercedes-Benz Stadium (Quarterfinal) |
| 2026-07-18 | Post-event retrospective + data archival |

---

## Appendix: Match Schedule Reference

| Match ID | Teams | Stage | Date (ET) |
|----------|-------|-------|-----------|
| atl-01 | USA vs. Bolivia | Group C | Jun 14, 2026 |
| atl-02 | Argentina vs. Chile | Group D | Jun 19, 2026 |
| atl-03 | Colombia vs. TBD | Group H | Jun 21, 2026 |
| atl-04 | France vs. TBD | Group E | Jun 25, 2026 |
| atl-05 | Brazil vs. TBD | Group C | Jun 27, 2026 |
| atl-06 | Spain vs. TBD | Group B | Jul 1, 2026 |
| atl-07 | TBD vs. TBD | Round of 16 | Jul 6, 2026 |
| atl-08 | TBD vs. TBD | Quarterfinal | Jul 10, 2026 |
