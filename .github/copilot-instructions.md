# Copilot Instructions: Match Day ATL

## Build, Test, and Lint Commands

```bash
# Development
bun dev                    # Start Next.js dev server on localhost:3000

# Build
bun run build              # Production build (includes match validation)

# Testing
bun test                   # Run all tests once (Vitest + React Testing Library)
bun test:watch             # Run tests in watch mode
bun test -- <filename>     # Run a single test file

# Linting
bun run lint               # ESLint check

# Data validation
bun run validate-matches   # Validate public/matches.json against schema
```

## Architecture Overview

**Match Day ATL** is a FIFA World Cup 2026 transit companion for Atlanta fans. It combines AI-generated routing recommendations (Claude via streaming), real-time MARTA vehicle positions (GTFS-RT + proprietary API), and Google Maps visualization.

### Rendering Strategy

| Component | Type | Purpose |
|-----------|------|---------|
| `app/page.tsx` | Server Component | SSR shell — loads & validates `public/matches.json` at request time |
| `app/HomeClient.tsx` | Client Component | Orchestrates all interactive state (match/zone selection, recommendation fetching) |
| `/api/recommend` | Route Handler (streaming) | Streams AI tokens from Claude Sonnet 4.6 via Vercel AI SDK |
| `/api/marta` | Route Handler (JSON) | Fetches + normalizes MARTA bus/train data; hides API keys from client |

**Key principle:** API keys (`ANTHROPIC_API_KEY`, `MARTA_TRAIN_API_KEY`) are **only** accessed in route handlers, never in client components. Only `NEXT_PUBLIC_*` vars reach the browser.

### Data Flow

```
User selects match + zone
  → HomeClient.tsx calls POST /api/recommend (streaming)
  → Tokens append to recommendation state as they arrive
  → useMartaData hook (SWR) polls GET /api/marta every 10s
  → TransitMarkers renders live vehicle positions on map
```

## Conventions

### Next.js Version Warning

This project uses **Next.js 16** with breaking changes from earlier versions. Before modifying routing, metadata, or App Router patterns, check `node_modules/next/dist/docs/` for canonical guidance.

### Data Validation

All external data (match schedule, API request bodies) is validated with **Zod** before use:
- `public/matches.json` validated at SSR time in `page.tsx` using `MatchArraySchema`
- `/api/recommend` request body validated with `RecommendRequestSchema`
- Build fails if `validate-matches.ts` detects invalid match data

Zod schemas are the source of truth for TypeScript types. Use `z.infer<typeof Schema>` — never manually sync types.

### Error Handling: Graceful Degradation

The app follows a **"degrade gracefully, never block"** model. External API failures never show error UI to the user:

| Failure | User Experience |
|---------|----------------|
| Claude API down or timeout (> 8s) | Receive fallback response from `lib/fallbacks.ts` |
| MARTA bus feed down | Map shows trains only (or mock data) |
| MARTA train feed down | Map shows buses only (or mock data) |
| Both MARTA feeds down | Map shows mock vehicle positions |
| Google Maps key invalid | Map area blank; rest of app functional |

Implementation: Each external call is wrapped in `try/catch` with a pre-defined fallback. No user-visible error states exist for API failures.

### Environment Variables

- **Server-only:** `ANTHROPIC_API_KEY`, `MARTA_TRAIN_API_KEY` — accessed only in `/api/*` routes
- **Client-exposed:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_STADIUM_*` — used in browser
- **Kill switches (dev/testing):**
  - `USE_MOCK_CLAUDE=true` — skip Claude API, return fallback immediately
  - `USE_MOCK_MARTA_DATA=true` — skip MARTA APIs, return mock vehicles

When adding new environment variables, never prefix with `NEXT_PUBLIC_` unless the browser genuinely needs access.

### State Management

No Redux or Zustand. All state lives in `HomeClient.tsx` via React hooks:
- `selectedMatch`, `zone`, `recommendation`, `isLoading` — local useState
- `martaData` — via `useMartaData` hook (SWR-based, 10s polling)

SWR config (see `hooks/useMartaData.ts`):
- `refreshInterval: 10_000` (10s)
- `dedupingInterval: 5_000` (dedup requests within 5s)
- `revalidateOnFocus: false` (prevents burst on tab-switch)

### Styling

Tailwind CSS v4 (PostCSS plugin). Design tokens defined as CSS custom properties in `app/globals.css`:
- `--bg`, `--surface`, `--border`, `--accent`, `--text`, `--delay`, `--error`
- Dark mode: `@media (prefers-color-scheme: dark)` remaps all tokens (no JS)

Layout: Flexbox — left sidebar (match/zone/recommendation) + right full-height map. On mobile (< 768px), sidebar stacks above map.

### Testing

Vitest + React Testing Library + jsdom. All external API calls gated by kill switches in test environment.

**What to test:**
- Zod schema validation (valid/invalid inputs)
- Component state transitions (loading → data → error)
- User interactions (clicks, keyboard nav)
- Route handlers (fallback on timeout, request validation, delay injection)

**What NOT to test:**
- Actual Claude/MARTA network calls (use mocks)
- CSS rendering details
- Internal library behavior (Zod, SWR, React internals)

### AI Recommendations

- **Model:** Claude Sonnet 4.6 via `@ai-sdk/anthropic` and Vercel AI SDK v6
- **Prompt structure:** System prompt defines "local friend" voice; user prompt includes zone, kickoff time, and delay status (if active)
- **Streaming:** Tokens streamed via `streamText().toTextStreamResponse()` — client appends to state as they arrive
- **Timeout:** 8s abort signal; on timeout, fallback response returned with no error to user

The AI never sees user location beyond the selected zone (Downtown/Midtown/Airport). No PII collected.

### MARTA Data Integration

Two independent data sources:
1. **Bus positions:** GTFS-RT protobuf feed from `gtfs-rt.itsmarta.com` (decoded via `gtfs-realtime-bindings`)
2. **Train positions:** JSON feed requiring `MARTA_TRAIN_API_KEY` header

Both fetched in parallel in `/api/marta/route.ts`. Independent try/catch blocks ensure one source failing doesn't break the other. If both fail, mock data returned (6 representative vehicles near stadium).

**Delay detection:** Any train with `LINE === "Gold"` and `WAITING_SECONDS > 300` triggers `hasDelay: true`. For demo/testing, append `?inject_delay=gold_line` to `/api/marta`.

## Path Aliases

TypeScript path alias `@/*` maps to `./src/*`:
```typescript
import { Match } from "@/lib/schemas";
import { useMartaData } from "@/hooks/useMartaData";
```

## File Organization

```
src/
├── app/                    # App Router pages + route handlers
│   ├── page.tsx           # SSR entry (loads matches)
│   ├── HomeClient.tsx     # Interactive state orchestrator
│   └── api/
│       ├── recommend/     # POST — streaming AI recommendations
│       └── marta/         # GET — live transit data + delay status
├── components/            # UI components (all client-side)
├── hooks/                 # Custom React hooks (useMartaData)
├── lib/                   # Shared utilities
│   ├── schemas.ts        # Zod schemas (Match, RecommendRequest)
│   ├── types.ts          # TypeScript interfaces (TransitVehicle)
│   ├── marta.ts          # MARTA API helpers
│   └── fallbacks.ts      # Pre-baked recommendations keyed by Zone
├── i18n/                  # next-intl message files (placeholder)
└── test/
    └── setup.ts           # Vitest + jsdom config

public/
└── matches.json           # Static FIFA match schedule (8 matches)

scripts/
└── validate-matches.ts    # Build-time schema validation
```

## Key Documents

- **`PRD.md`** — Product requirements, user stories, success metrics
- **`SPEC.md`** — Technical specification, API contracts, architecture diagrams
- **`AGENTS.md`** — Contains `@AGENTS.md` (currently just references itself)
- **`CLAUDE.md`** — Next.js version warning (breaking changes notice)

When implementing features, consult `SPEC.md` for data models and API contracts. When clarifying intent or scope, reference `PRD.md`.

## Performance Targets

- LCP (mobile, 4G): < 2.5s
- First AI token: < 1.5s
- MARTA data age: ≤ 15s
- JS bundle (client): < 200KB gzip

Achieved via SSR shell, streaming responses, SWR polling, and lazy-loaded Google Maps (not bundled).

## Deployment

Platform: **Vercel** (Fluid Compute — Node.js 24 runtime)

Build process:
1. `bun run build` → Next.js production build
2. `validate-matches.ts` runs automatically (exits 1 if invalid)
3. Route handlers deployed as Vercel Functions

Recommended function region: `iad1` (US East — lowest latency to MARTA APIs).
