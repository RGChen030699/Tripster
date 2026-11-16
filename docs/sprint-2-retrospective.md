# Sprint 2 retrospective

**Sprint:** November 5 – November 12, 2026  
**Written:** November 16, 2026 (America/New_York)  
**Project:** Tripster (solo)

## What shipped

- Edit / remove suggestions (extra approved story).
- Schedule itinerary items by day and optional time; clear unscheduled grouping.
- Record expenses with payer and participants; equal splits that total exactly in cents.
- Per-member paid / share / net balances.
- README, OpenAPI document, architecture and database diagrams, CI multi-stage pipeline, Playwright journey, production deploy on Vercel.

GitHub milestone **Sprint 2** closed issues #7–#11 (plus follow-on hardening on `main`).

## What got in the way

- Expense and itinerary edge cases (cents rounding, membership gates, UI action menus) surfaced late in polish passes.
- Production incidents (missing migration, client errors after deploy) required ops fixes outside the original issue list.
- Documentation and diagrams landed after core features; graders need them earlier for review.

## What to change next time

- Ship OpenAPI / architecture / schema docs in parallel with the first API stories.
- Run migrations and a short production smoke path before calling a feature done.
- Keep UI actions (menus/buttons) consistent as soon as the first trip-detail screen lands.

## Related

- Post-hoc relative estimates for #7–#10: [`sprint-estimates.md`](sprint-estimates.md)
- Sprint 1 retrospective: [`sprint-1-retrospective.md`](sprint-1-retrospective.md)
