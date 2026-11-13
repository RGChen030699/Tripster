# Tripster

## Product

Tripster is a shared place for a group to plan a trip. Members create an account with an email address, and that email is the username. A member can create a trip, add travelers who already have accounts, suggest lodging, activities, places to visit, and restaurants, and vote Yes, Maybe, or No. A vote records a preference only. Putting a suggestion on the itinerary takes a separate Add action. Members can schedule an itinerary item on a date inside the trip, with an optional time. They can record a shared expense, choose who shares it, and see an equal split. Shares are integer cents and total the expense exactly. Each member can see what they paid, their share, and their net balance.

Accounts, trips, suggestions, itinerary items, and expenses are stored in PostgreSQL. Restarting the app keeps them. The email address stays the username. A vote still does not add an itinerary item, and equal expense shares still total the amount in cents.

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

Copy `.env.example` to `.env`. `DATABASE_URL` is the development database. `DATABASE_URL_TEST` is the isolated database Vitest uses. The example file contains placeholders only. Do not commit a real database URL, password, or other secret.

`NODE_ENV=production` marks the session cookie Secure and stops serving the API document. The session cookie name is `tripster_session`.

## Tests

```sh
npm test
npm run typecheck
```

`npm test` runs Vitest against the isolated test database, not the development database. Create `tripster_test` and apply migrations before running tests. `npm run typecheck` runs `tsc --noEmit`.

The API document is `openapi/tripster.openapi.json`. Outside production, `GET /api/openapi` returns that document. It includes example requests and responses for the main flows.

## Deployment

```sh
npm run build
npm start
```

Set `DATABASE_URL` in the host environment before `npm start`. Apply migrations with `npx prisma migrate deploy` before serving a new database. Do not commit real tokens, passwords, or database URLs.
