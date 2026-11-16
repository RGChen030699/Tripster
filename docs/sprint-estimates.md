# Sprint story estimates

**Added:** November 16, 2026 (America/New_York)  
**Status:** These points were **not** recorded during original Sprint 1 / Sprint 2 planning. They are a post-hoc relative sizing for course agile evidence, written after the stories shipped.

Sizing uses Fibonacci-style story points (1 / 2 / 3 / 5 / 8). Points compare complexity and risk inside this project only; they are not hours.

| Issue | Title | Sprint | Points | Sizing basis |
| --- | --- | ---: | ---: | --- |
| [#1](https://github.com/RGChen030699/Tripster/issues/1) | Create and authenticate user accounts | 1 | 5 | Auth foundation: register/login/logout, password hashing, session/JWT boundaries, unauthenticated failure paths |
| [#2](https://github.com/RGChen030699/Tripster/issues/2) | Create a trip with destination and dates | 1 | 3 | Create-trip form, date-order validation, creator becomes organizer/member |
| [#3](https://github.com/RGChen030699/Tripster/issues/3) | Add members to a trip | 1 | 5 | Invite by email, duplicate prevention, server-side membership gates |
| [#4](https://github.com/RGChen030699/Tripster/issues/4) | Add a categorized place suggestion | 1 | 5 | Four categories, optional details, trip-scoped listing |
| [#5](https://github.com/RGChen030699/Tripster/issues/5) | Vote on a suggestion | 1 | 5 | Yes/Maybe/No with changeable single vote; voting never Adds |
| [#6](https://github.com/RGChen030699/Tripster/issues/6) | Add a suggestion to the itinerary | 1 | 3 | Explicit Add creates a linked itinerary item without changing votes |
| [#7](https://github.com/RGChen030699/Tripster/issues/7) | Edit or remove a trip suggestion | 2 | 3 | Author edit/remove with confirmation; keep list/itinerary consistent |
| [#8](https://github.com/RGChen030699/Tripster/issues/8) | Schedule itinerary items by day and time | 2 | 5 | Day/time inside trip range, unscheduled grouping, schedule edits |
| [#9](https://github.com/RGChen030699/Tripster/issues/9) | Record a trip expense and participants | 2 | 5 | Amount/payer/participants with membership and positive-amount checks |
| [#10](https://github.com/RGChen030699/Tripster/issues/10) | Calculate and display expense shares and balances | 2 | 5 | Equal-split cents that total exactly; paid / share / net per member |

**Sprint 1 total:** 26 points (#1–#6)  
**Sprint 2 total:** 18 points (#7–#10)

Issue #11 (docs / OpenAPI / diagrams) was intentionally left out of this sizing table; it was a documentation/meta story rather than a core user story.

## Pasting onto GitHub issues

This agent’s GitHub token could not edit issue bodies or post comments (`Resource not accessible by integration`). To mirror each row onto the matching issue, append:

```markdown
## Estimate note (added 2026-11-16, America/New_York)

This estimate was **not** recorded during original Sprint planning. It was added afterward for course evidence of relative sizing.

- **Story points:** <points from table>
- **Sizing basis:** <sizing basis from table>
```
