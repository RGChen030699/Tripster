# Tripster

## Product

Tripster is a shared place for a group to plan a trip. Members create an account with an email address, and that email is the username. A member can create a trip, add travelers who already have accounts, suggest lodging, activities, places to visit, and restaurants, and vote Yes, Maybe, or No. A vote records a preference only. Putting a suggestion on the itinerary takes a separate Add action. Members can schedule an itinerary item on a date inside the trip, with an optional time. They can record a shared expense, choose who shares it, and see an equal split. Shares are integer cents and total the expense exactly. Each member can see what they paid, their share, and their net balance.

Accounts, trips, suggestions, itinerary items, and expenses are stored in PostgreSQL. Restarting the app keeps them. The email address stays the username. A vote still does not add an itinerary item, and equal expense shares still total the amount in cents.

## Shared trip state

Tripster does not use WebSockets or a paid realtime vendor. Live vote totals use **short polling**: suggestion cards call `GET /api/trips/{tripId}/suggestions/{suggestionId}/votes` about every four seconds while the tab is visible, so another member’s Yes / Maybe / No shows up without a full reload. That endpoint stays membership-gated and still never Adds to the itinerary.

The broader trip workspace also keeps **complex shared state** on the server:

- **Membership** — trip-scoped reads and writes require an authenticated member. The client cannot assert membership; the API checks it.
- **Suggestions and votes** — members propose lodging, activities, places, or restaurants. Votes are preferences only.
- **Explicit Add** — a separate Add action creates an itinerary item linked to the source suggestion.
- **Scheduling** — itinerary items move between unscheduled and day/time groups inside the trip date range.
- **Expenses and balances** — equal splits use integer cents that sum exactly; each member sees paid, share, and net balance.

Those invariants live in `lib/` services and stores and are covered by Vitest and the Playwright journey.

Architecture layers, auth flow, and domain boundaries are documented in [`docs/architecture.md`](docs/architecture.md).

## Local setup

This checkout was tested with Node.js 22.15.0 and PostgreSQL 16.16 from Homebrew `postgresql@16`. Application versions are declared in `package.json` and resolved in `package-lock.json`.

PostgreSQL has to be running locally. Docker is not required. With Homebrew:

```sh
brew install postgresql@16
brew services start postgresql@16
createdb tripster
createdb tripster_test
```

Copy `.env.example` to `.env` and replace `USERNAME` with your PostgreSQL role. Homebrew trust authentication does not need a password. Then install dependencies, apply the checked-in migrations, and start the app:

```sh
npm ci
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000. If that port is already in use, the dev server prints the port it chose. Create an account, then create a trip. Records remain after a restart.

## Environment variables

Copy `.env.example` to `.env`. `DATABASE_URL` is the development database. `DATABASE_URL_TEST` is the isolated database Vitest uses. `JWT_SECRET` signs HS256 access tokens. The example file contains placeholders only. Do not commit a real database URL, password, JWT secret, or other secret.

Authentication uses JWT: register and login set an HS256 access token in the httpOnly `tripster_session` cookie. Logout clears the cookie and revokes the token `jti`. `NODE_ENV=production` marks the cookie Secure and stops serving the API document.

## Tests

```sh
npm test
npm run test:e2e
npm run typecheck
```

`npm test` runs Vitest against the isolated test database, not the development database. Create `tripster_test` and apply migrations before running tests. `npm run test:e2e` runs Playwright against a local Next.js server (Chromium). It uses `DATABASE_URL` and `JWT_SECRET` from the environment; set those before the run. `npm run typecheck` runs `tsc --noEmit`.

The API document is `openapi/tripster.openapi.json`. Outside production, `GET /api/openapi` returns that document. It includes example requests and responses for the main flows.

## Continuous integration

Pull requests and pushes to `main` / `feature/12-postgres` run the GitHub Actions workflow in `.github/workflows/ci.yml`. Stages:

1. Typecheck
2. Unit and integration tests (Vitest against a Postgres 16 service)
3. End-to-end tests (Playwright Chromium against the same Postgres service)
4. Security scan (`npm audit` fails on critical findings; Trivy filesystem scan for critical CVEs)
5. Production build (`npm run build`)
6. Deploy gate (all stages must pass)

Jobs run on `ubuntu-24.04` so Playwright 1.51.1 can install Chromium. CI starts its own Postgres containers. It does not need repository secrets for the database. `JWT_SECRET` is set to a CI-only placeholder in the workflow. Vercel deploy previews still run from the Vercel GitHub integration; production deploy is automated by that same integration when the production branch updates.

## Deployment

Production: https://tripster-delta.vercel.app

```sh
npm run build
npm start
```

Set `DATABASE_URL` and `JWT_SECRET` in the host environment before `npm start`. Apply migrations with `npx prisma migrate deploy` before serving a new database. Do not commit real tokens, passwords, JWT secrets, or database URLs. On GitHub, prefer the Actions deploy gate plus Vercel’s Git integration over a manual CLI deploy for routine releases.
