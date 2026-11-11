# Tripster

## Product

Tripster is a shared place for a group to plan a trip. Members create an account with an email address, and that email is the username. A member can create a trip, add travelers who already have accounts, suggest lodging, activities, places to visit, and restaurants, and vote Yes, Maybe, or No. A vote records a preference only. Putting a suggestion on the itinerary takes a separate Add action. Members can schedule an itinerary item on a date inside the trip, with an optional time. They can record a shared expense, choose who shares it, and see an equal split. Shares are integer cents and total the expense exactly. Each member can see what they paid, their share, and their net balance.

Accounts, trips, suggestions, itinerary items, and expenses are stored in memory. Restarting the app drops them. There is no database in this version.

## Local setup

This checkout was tested with Node.js 22.15.0. Application versions are declared in `package.json`.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. If that port is already in use, the dev server prints the port it chose. Create an account, then create a trip. Data from one process is not visible after a restart.

## Environment variables

No environment variables are required. `.env.example` records that accounts and sessions stay in process memory and that real secrets must not be committed.

`NODE_ENV=production` marks the session cookie Secure and stops serving the API document. The session cookie name is `tripster_session`.

## Tests

```sh
npm test
npm run typecheck
```

`npm test` runs Vitest. `npm run typecheck` runs `tsc --noEmit`.

The API document is `openapi/tripster.openapi.json`. Outside production, `GET /api/openapi` returns that document. It includes example requests and responses for the main flows.

## Deployment

```sh
npm run build
npm start
```

The running app keeps its data in memory, so a new process starts empty. Do not commit real tokens, passwords, or database URLs. This version does not use a database.
