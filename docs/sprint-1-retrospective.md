# Sprint 1 retrospective

**Sprint:** October 27 – November 4, 2026  
**Written:** November 16, 2026 (America/New_York)  
**Project:** Tripster (solo)

## What shipped

- Account register / login / logout with hashed passwords and sessions (later JWT on Postgres).
- Create trips with name, destination, and date range; creator becomes organizer.
- Add trip members by email; trip-scoped access checks.
- Categorized suggestions (lodging, activity, place to visit, restaurant).
- Yes / Maybe / No voting that never Adds to the itinerary.
- Explicit **Add** from a suggestion into the itinerary.

GitHub milestone **Sprint 1** closed issues #1–#6.

## What got in the way

- Early accounts used an in-memory store, so persistence and “real” auth had to be revisited in later work.
- Product rules (vote ≠ Add, membership on the server) needed careful tests so UI shortcuts could not bypass them.
- Solo delivery meant no partner review buffer; quality relied on CI, self-review against acceptance criteria, and issue checklists.

## What to change next time

- Prefer persistence and the final auth approach earlier when the course stack allows it.
- Keep acceptance criteria and tests ahead of UI polish so regressions stay visible.
- Capture standup notes in-repo during the sprint instead of reconstructing them afterward.

## Related

- Post-hoc relative estimates for #1–#6: [`sprint-estimates.md`](sprint-estimates.md)
- Sprint 2 retrospective: [`sprint-2-retrospective.md`](sprint-2-retrospective.md)
