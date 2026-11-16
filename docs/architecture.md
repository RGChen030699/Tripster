# Tripster architecture

This document describes how the Tripster full-stack app is layered, how a request moves through the system, and which domains own which rules. It matches the code on `main` (Next.js App Router, Prisma, PostgreSQL/Neon, JWT sessions).

## High-level deployment

```mermaid
flowchart LR
  Browser["Browser<br/>React UI"]
  Vercel["Vercel<br/>Next.js 15"]
  Neon["Neon PostgreSQL"]

  Browser -->|"HTTPS pages + JSON APIs"| Vercel
  Vercel -->|"Prisma + pg"| Neon
```

- **Frontend and backend** run in one Next.js deployment on Vercel.
- **Pages** under `app/` render the UI; **Route Handlers** under `app/api/` expose JSON.
- **Persistence** is PostgreSQL (local or Neon). Schema and migrations live in `prisma/`.
- **CI** (GitHub Actions) typechecks, runs Vitest against Postgres, runs Playwright, security-scans, and builds before the deploy gate. Vercel handles PR previews and production deploys.

## Application layers

```mermaid
flowchart TB
  subgraph client ["Client"]
    Pages["app/*/page.tsx"]
    Components["components/*"]
  end

  subgraph api ["API boundary"]
    Routes["app/api/**/route.ts"]
    Zod["Zod validation"]
    AuthGate["JWT cookie + membership checks"]
  end

  subgraph domain ["Domain services lib/"]
    AuthSvc["auth"]
    TripSvc["trips"]
    SugSvc["suggestions + votes"]
    ItinSvc["itinerary"]
    ExpSvc["expenses"]
  end

  subgraph data ["Data access"]
    Stores["*Store interfaces"]
    Prisma["Prisma client lib/db.ts"]
  end

  DB[("PostgreSQL")]

  Pages --> Components
  Components -->|"fetch /api/..."| Routes
  Pages -->|"server reads"| Routes
  Routes --> Zod
  Routes --> AuthGate
  AuthGate --> AuthSvc
  AuthGate --> TripSvc
  AuthGate --> SugSvc
  AuthGate --> ItinSvc
  AuthGate --> ExpSvc
  AuthSvc --> Stores
  TripSvc --> Stores
  SugSvc --> Stores
  ItinSvc --> Stores
  ExpSvc --> Stores
  Stores --> Prisma
  Prisma --> DB
```

| Layer | Responsibility | Location |
| --- | --- | --- |
| UI | Forms, lists, trip workspace navigation | `app/`, `components/` |
| API | Parse JSON, map HTTP status, never trust client membership | `app/api/` |
| Validation | Request shapes at the boundary | Zod schemas in `lib/*/validation.ts` |
| Auth | Register/login/logout, HS256 JWT in httpOnly cookie, `jti` revocation | `lib/auth/` |
| Domain | Trip membership, votes ≠ Add, scheduling, cent-exact splits | `lib/trips`, `lib/suggestions`, `lib/itinerary`, `lib/expenses` |
| Stores | Persist behind interfaces (Prisma implementations) | `lib/*/*-store.ts` |
| Database | Users, sessions, trips, memberships, suggestions, votes, itinerary, expenses | `prisma/schema.prisma` |

Business rules stay in `lib/` services, not in React components. Trip-scoped reads and writes require an authenticated **trip member** on the server.

## Auth and session flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant API as /api/auth/*
  participant S as AuthService
  participant DB as PostgreSQL

  B->>API: POST /register or /login
  API->>S: validate + hash/compare password
  S->>DB: User / Session (jti)
  S-->>API: access token claims
  API-->>B: Set-Cookie tripster_session (httpOnly)

  B->>API: later /api/trips/... with cookie
  API->>S: verify JWT + jti not revoked
  S->>DB: membership for tripId + userId
  API-->>B: 200 JSON or 401/403
```

- Password hashing uses a purpose-built scrypt-based hasher in `lib/auth/password.ts`.
- Production cookies are `Secure`. Logout clears the cookie and revokes the token `jti`.
- OpenAPI is served at `GET /api/openapi` outside production (`openapi/tripster.openapi.json`).

## Domain modules and product invariants

```mermaid
flowchart LR
  Trip["Trip"]
  Mem["Membership<br/>organizer / member"]
  Sug["Suggestion<br/>category + details"]
  Vote["Vote<br/>Yes / Maybe / No"]
  Item["ItineraryItem"]
  Exp["Expense + shares"]

  Trip --> Mem
  Trip --> Sug
  Sug --> Vote
  Sug -->|"explicit Add only"| Item
  Trip --> Item
  Trip --> Exp
  Mem --> Exp
```

Non-negotiable rules enforced in services:

1. A **Yes vote never** creates an itinerary item.
2. **Add** is a separate action and keeps a link to the source suggestion.
3. Suggestion categories: lodging, activity, place to visit, restaurant.
4. Expense shares (even or manual) use **integer cents** that sum exactly to the amount.
5. Organizer-only actions (edit/delete trip, invite, role changes, remove members) are checked server-side; the last organizer cannot be removed.

## Live updates without a realtime vendor

Suggestion cards **poll** vote totals about every four seconds while the tab is visible (`GET .../votes`). There is no WebSocket or paid realtime service. Shared trip state (membership, suggestions, itinerary, expenses) remains authoritative on the server.

## Testing and delivery

```mermaid
flowchart LR
  Dev["Local / PR"]
  Vitest["Vitest<br/>unit + API"]
  PW["Playwright<br/>e2e journey"]
  CI["GitHub Actions<br/>multi-stage"]
  Preview["Vercel preview"]
  Prod["Vercel production"]

  Dev --> Vitest
  Dev --> PW
  Dev --> CI
  CI --> Preview
  CI -->|"merge to main"| Prod
```

- Isolated test database via `DATABASE_URL_TEST`.
- E2E covers the main trip-planning journey once Chromium is available.
- CI stages: typecheck → unit/integration → e2e → security (npm audit + Trivy) → build → deploy gate.

## Related docs

- Product rules and stack versions: [`AGENTS.md`](../AGENTS.md)
- Setup and deployment: [`README.md`](../README.md)
- Public API document: [`openapi/tripster.openapi.json`](../openapi/tripster.openapi.json)
- Database schema diagram: [`docs/database-schema.md`](./database-schema.md)
- Database models: [`prisma/schema.prisma`](../prisma/schema.prisma)
