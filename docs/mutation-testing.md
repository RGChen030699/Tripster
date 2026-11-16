# Mutation testing (Stryker)

Tripster uses [Stryker](https://stryker-mutator.io/) for optional mutation testing on the integer-cent expense split helpers.

## Scope

- Mutated file: `lib/expenses/split.ts` (equal shares, manual payer remainder, balances)
- Tests: `lib/expenses/split.test.ts` via `vitest.mutation.config.ts`
- Runner: `@stryker-mutator/vitest-runner` with Vitest 5

This target is pure domain math with no database or React, so the run stays fast and does not depend on Postgres.

## How to run

```sh
npm run test:mutation
```

Reports (gitignored):

- `reports/mutation/index.html`
- `reports/mutation/mutation.json`

## Safety

- Separate from `npm test` / `npm run test:e2e` / `npm run build`
- Not wired into `.github/workflows/ci.yml` as a required job
- `thresholds.break` is `null`, so a low score does not fail the script exit for gating purposes
