# Tripster — AI Development Instructions

These instructions apply to the whole repository. Read this file together with the issue being implemented and the relevant product/design references.

## Product context

Tripster gives a group one shared place to plan a trip. Members create trips, invite travelers, suggest lodging/activities/places to visit/restaurants, vote Yes/Maybe/No, explicitly add selected suggestions to an itinerary, schedule itinerary items, and record and split shared expenses.

### Problem and target users

Trip planning often gets scattered across group chats, maps, notes, and spreadsheets. Suggestions can be lost, group preferences are hard to compare, itinerary details are difficult to coordinate, and one person may end up tracking shared expenses. Tripster brings these activities into one shared trip workspace. It is for friends, families, classmates, and other groups planning a trip together.

### Product source of truth

- **PRD reference:** Richard Chen's **Project 2 Proposal — Tripster**, supplied in the course project materials and summarized in this file. Its scope is the problem and target users above and the eight user stories below. No separate PRD file or shareable URL has been added to the repository.
- **Design reference:** No separate visual mockup/prototype link is available in the repository. The UI description below translates the Project 2 Proposal into the screens and interactions the app needs; it does not claim pixel-level fidelity to an existing mockup. If a prototype is created later, add its link and update the screen descriptions to match it.
- **Issues and sprint board:** [Tripster GitHub Issues](https://github.com/RGChen030699/Tripster/issues) and [Tripster Agile Board](https://github.com/users/RGChen030699/projects/1/views/1).
- If the PRD, mockup, issue, and these instructions conflict, pause the affected behavior and raise the conflict in the issue/PR. Do not silently choose a new product rule.

### User stories

1. Create a trip with a name, destination, and travel dates.
2. Add people to a trip so they can contribute and see plans.
3. Suggest lodging, activities, places to visit, or restaurants.
4. Vote Yes, Maybe, or No on suggestions.
5. Explicitly select **Add** to put a suggestion on the itinerary.
6. Organize itinerary items by day and time.
7. Record an expense and select who shares its cost.
8. See expense splits and what each person owes.

The Scrum board also contains an approved extra feature to edit or remove a suggestion. Keep it separate from the original PRD stories.

### Non-negotiable behavior

- Votes record preferences only. A Yes vote must never add an item to the itinerary.
- Adding a suggestion to the itinerary requires an explicit **Add** action and should preserve its link to the source suggestion.
- Suggestions have one of the agreed categories: lodging, activity, place to visit, or restaurant.
- Trip-scoped information and mutations must be restricted to authenticated trip members on the server.
- Expense shares use the split rule documented in the issue/PRD. If equal splitting is the agreed first version, handle cents so participant shares total exactly to the expense amount.

## Stack and architecture

The repository currently contains only a README, so there is no implemented stack or established architecture to preserve yet. The following is the **proposed planning baseline from the HW3 context document**, not a claim about installed dependencies. As the solo developer, choose/adopt the stack before scaffolding or adding packages; then update this section to match the committed lockfile and code.

- Frontend: Next.js 15.x, React 19.x, TypeScript 5.x, Tailwind CSS 4.x.
- Backend: Next.js App Router and Route Handlers with JSON APIs.
- Database: PostgreSQL 16.x with Prisma 6.x and checked-in migrations.
- Authentication: Auth.js (NextAuth.js) with a database-backed session, after selecting a stable release and adapter. Use one documented auth approach throughout.
- Validation: one schema validation library at API boundaries (Zod is the proposed choice).
- Unit/component tests: Vitest and React Testing Library.
- End-to-end tests: Playwright for critical user flows.
- API documentation: OpenAPI 3.x; expose generated documentation in development if API routes are used.
- CI: GitHub Actions for formatting/lint, type checking, and relevant automated tests.

Use exact package versions from the package manifest and lockfile; do not upgrade frameworks or introduce a second library for the same job without an issue explaining why. Never invent a version in documentation when it cannot be verified from the repository.

### Architecture and folders

Until the app scaffold exists, use this as a suggested organization, adapting it to the framework's generated conventions rather than moving files just to match this list:

- `app/` — route segments, layouts, and pages.
- `app/api/` — Route Handlers, request parsing, and response mapping.
- `components/` — shared presentation components without domain/data-access logic.
- `features/trips/`, `features/suggestions/`, `features/itinerary/`, `features/expenses/` — feature-specific UI and domain operations.
- `lib/` — shared auth, database client, validation, and utilities.
- `prisma/` — schema and migrations.
- `tests/` — unit/integration helpers and fixtures; keep colocated tests if the established project convention prefers that.
- `e2e/` — Playwright user journeys.

Keep business rules in feature/domain services, not page components. Check authorization and validate input at the server/API boundary. Keep database access behind the project's established data-access pattern. Prefer small changes that follow the actual codebase once it exists.

## Design references and expected interaction

Use the PRD-derived UI description below as the functional design reference. It describes required screens and behavior, not colors, typography, or exact layout. Make visual choices consistent and accessible, and revise this section if you later create a mockup.

### UI description

- **Trip list/home:** Show the trips the signed-in user belongs to, with each trip's name, destination, and dates. Provide a clear action to create a trip and useful empty/loading/error states.
- **Create trip:** A focused form collects trip name, destination, start date, and end date. Validate required fields and prevent an end date earlier than the start date. The creator becomes the organizer/member.
- **Trip workspace:** Present the trip summary and its members, and provide clear navigation between suggestions, itinerary, and expenses. Members should be able to understand which trip they are viewing.
- **Members:** Let the organizer add travelers using the invitation method selected for the project. Show current members and prevent duplicate membership.
- **Suggestions:** Let a member create a suggestion with its name, one of four categories (lodging, activity, place to visit, restaurant), and optional details. List suggestions in the trip workspace with their voting controls and current Yes/Maybe/No totals.
- **Voting and Add:** Make Yes, Maybe, and No distinct choices and show the member's current vote. Keep **Add** as a separate, explicit action. Voting never adds an item. After Add is selected, show the linked item in the itinerary.
- **Itinerary:** Group or order itinerary items by trip day and time. Make unscheduled items clear and let members assign a date and optional time within the trip range.
- **Expenses and balances:** Let a member enter an expense and select the payer and participating trip members. Show each expense's split and a per-member summary of paid amount, share, and net balance.
- **Shared interaction states:** Forms and lists should communicate loading, empty, validation, success, and error states. Destructive actions need clear confirmation.

Expected components and behavior from the PRD:

- Trip creation form with name, destination, start date, and end date; validate required values and date order.
- Trip list/detail with trip dates and member list.
- Member invitation/add flow using the method approved by the team.
- Suggestion form and list with category, name, and optional details; suggestion cards show author and current votes where supported by the design.
- Yes/Maybe/No vote controls that show the current member's choice and group totals; a member can change their vote.
- A visibly distinct **Add** control that moves a suggestion into the itinerary only when explicitly selected.
- Itinerary organized by trip day and time, with clear handling for unscheduled items.
- Expense form identifying amount, description, payer, and participants; expense summary shows each person's share and net balance.
- Clear loading, empty, validation, success, and error states for each flow.

### Core user flows

1. A visitor creates an account or signs in.
2. An authenticated user creates a trip and becomes its organizer/member.
3. The organizer adds travelers; trip members open the trip workspace.
4. A member adds a categorized suggestion; trip members can view it and cast or change a vote.
5. A member explicitly selects **Add**; the item appears in the itinerary. Voting alone leaves it in suggestions.
6. A member assigns an itinerary item to a trip date and optional time; members see the ordered schedule.
7. A member records an expense, identifies the payer, and selects participants; members can review shares and balances.

## Naming and coding standards

- Follow the repository's formatter, linter, import ordering, and existing patterns once established. Do not add a competing formatter or linter.
- Use strict TypeScript; avoid `any`. Prefer explicit domain and API types and narrow unknown values at boundaries.
- Use PascalCase for React components and type names; camelCase for variables/functions; UPPER_SNAKE_CASE only for true module-level constants.
- Use descriptive domain names such as `Trip`, `TripMember`, `Suggestion`, `ItineraryItem`, `Expense`, and `ExpenseParticipant`.
- Keep components focused and accessible. Separate rendering from data access, authorization, and calculations.
- Use clear, consistent API response and error shapes; do not expose stack traces or secrets to clients.
- Make schema changes through migrations. Do not rewrite or delete migrations already applied to shared environments.

## Testing strategy

Use the framework already committed to the repository. If none exists, use the proposed Vitest/React Testing Library and Playwright baseline above after the team confirms the stack.

- Unit-test business rules: date validation, vote creation/change, explicit Add behavior, membership checks, and expense allocation/rounding.
- Integration-test server/API behavior, including unauthenticated requests and requests from non-members.
- E2E-test the main journey from creating a trip through suggestions, voting, explicit Add, scheduling, expense entry, and balance review as the features become available.
- Add a regression test for each fixed bug and cover both expected success and important failure paths.
- Use isolated test data and a test database; tests must not depend on production services, real accounts, or committed secrets.
- Aim for at least 80% coverage of domain/business logic once coverage reporting is configured. Prioritize authorization and money calculations over a global percentage.
- Before opening a PR, run the repository's available formatter/lint, type-check, and relevant test commands. Report commands that could not be run; never claim tests passed without output.

## Scrum and GitHub workflow

- Board columns: **Backlog**, **Sprint Todo**, **In Progress**, **In Review**, **Done**. Move the issue card as work changes state.
- Milestones: **Sprint 1** (Oct 27–Nov 4, 2026) and **Sprint 2** (Nov 5–Nov 12, 2026). The full project is due Nov 12, 2026. Revisit these dates only if the course timeline changes.
- Branch names: `feature/<issue-number>-<short-description>`, `bugfix/<issue-number>-<short-description>`, `docs/<issue-number>-<short-description>`, or `chore/<issue-number>-<short-description>`.
- Commit messages use Conventional Commits: `<type>(<scope>): <imperative summary> (#<issue-number>)`; examples: `feat(voting): allow members to change votes (#5)`, `fix(expenses): preserve cents in equal splits (#10)`, `docs(setup): explain local configuration (#11)`.
- Keep a change focused on its issue. Reference the issue in branch and commit names; in the pull request body include `Closes #<number>` when the PR completes that issue.
- Open a pull request against the repository's default branch. Include the issue link, summary, acceptance criteria addressed, test commands/results, and screenshots or a short recording for UI changes.
- Because this is an approved solo project, review your own pull request diff against its issue and acceptance criteria before merging; confirm automated checks pass. Do not describe this as an independent peer review. Follow any course-specific submission/review requirements.
- Do not commit directly to the default branch for feature work unless the team explicitly documents an exception.
- Keep issue titles action-oriented and use their acceptance criteria as the definition of done. Maintain your own progress on the board and record standup/retrospective notes if required by the course.

## Security, privacy, and accessibility

- Enforce authentication and trip membership in server-side code on every trip-scoped read and write. Hiding a control in the UI is not authorization.
- Hash passwords with a maintained, purpose-built password hashing implementation if password authentication is selected; never store plaintext passwords.
- Keep credentials in environment variables or the deployment provider's secret manager. Commit only an `.env.example` containing placeholder values; never commit real tokens, passwords, or database URLs.
- Use the ORM's parameterized query mechanisms. Avoid unsafe raw SQL; where it is necessary, parameterize all user input.
- Do not log passwords, session tokens, invitation secrets, or unnecessary personal data. Return safe, useful errors.
- Use semantic HTML, labels connected to form controls, keyboard-operable interactions, visible focus, accessible names for icon-only buttons, and sufficient contrast. Do not communicate status by color alone.
- Confirm destructive actions and provide understandable loading, empty, success, and error feedback.

## Do

- Read the relevant issue, acceptance checklist, and PRD section before coding; consult a mockup if one becomes available.
- Ask for clarification in the issue when a requirement is ambiguous or references conflict.
- Reuse established libraries, components, validation, styling, and data-access patterns.
- Add tests for behavior and edge cases, especially access control and expense calculations.
- Keep changes scoped, reviewable, and connected to a GitHub issue.

## Don't

- Do not treat a Yes vote as approval to add a suggestion to the itinerary.
- Do not trust client-provided trip membership or expose another trip's data.
- Do not put authorization, database access, or expense math in UI components.
- Do not add a dependency when the approved stack already provides the needed capability.
- Do not silently change product behavior, expand issue scope, or modify unrelated files.
- Do not hard-code credentials, expose secrets in logs, or claim unverified stack versions, tests, reviews, deployments, or design comparisons.
