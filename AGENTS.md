# Core Prompt for Outer Colonies

## System Role
You are an AI coding agent for the Outer Colonies project.

## Project Context
This repo is split into three subprojects:
- **website**: Angular 21 frontend for user management and deck configuration
- **client**: Phaser 3 frontend for the actual card game
- **server**: Express + Socket.IO backend with TypeScript
- **misc**: Utility scripts, tools and documentation for development (see `misc/README.md`)
Scan `README.md` to get further information on project background and structure.
Maintain consistency across the three subprojects

## Working with Git
- Use conventional commits (see `commit` skill for details)
- Skills available: `commit`, `github`, `check-pr`, `start-issue`, `release-oc`

## Repository Working Rules

### Repository Language
- Everything in the repository is English: commits, issues, PRs and documentation
- Only the game and the cards themselves are German for now (bilingual support is planned)

### Branches & Merges
- Only these branch types exist: `main`, `release/<x.x>`, `feature/<name>` and `fix/<name>` (the dev-loop automation additionally generates `vibe/issue-<N>-*` branches for its PRs, see `misc/dev-loop.md`)
- Squash merges only; no direct pushes to `main` (both enforced via GitHub branch protection)
- PRs are always reviewed and merged by the maintainer

### Issue Types & Labels
- Every issue has exactly one GitHub issue type (the `type` field, not a label):
  - `Feature` – New game or website features, feature improvements, design enhancements, website content additions, and game cards to be added or adjusted
  - `Task` – Database, testing, deployment, refactorings and hosting
  - `Bug` – Something isn't working
- When creating an issue, label it as follows: add `needs-human` whenever the issue cannot be completely implemented by the AI agent in this environment; additionally add `dev-loop` only if any part of it can be automatically implemented by the AI agent there (a fully automatable issue carries only `dev-loop`)
- The `clean` label on a PR marks that its current head passed a dev-loop review with verdict CLEAN; it is managed by the dev loop (added on a CLEAN verdict, removed on the next non-CLEAN verdict)

### Milestones, Versions & Releases
- Each milestone matches exactly one major/minor tag and release and contains all issues for developing that release; hotfix patch tags and releases are additionally assigned to the productive milestone
- Tags and releases are semantically versioned
- Milestones only cover major/minor versions; patches (hotfixes) belong to the milestone of the currently productive version
- The currently productive milestone stays open so productive bugs can be assigned to it; new features and enhancements go to the next milestone
- Milestone planning: keep milestones small and focused
- Milestone names are solar system bodies: Saturn moons in ascending order of the "Nr." column of the German Wikipedia list of Saturn's moons (https://de.wikipedia.org/wiki/Liste_der_Saturnmonde); strictly sequential from now on, next after Pan (XVIII) is Ymir (XIX)

### Deployment
- Staging is deployed on demand
- Prod is only deployed when a release is complete (tag and GitHub release created)

## Documentation Requirements
- Update README.md for significant changes
- Add JSDoc comments for new public or protected functions
- Changes in `server/src/shared/` are picked up by the client and website automatically via the `@shared/*` path alias - no declaration update is required

## Decision Making Guidelines

### Priority System
1. **Bug Fixes**: Immediate attention for critical issues
2. **Feature Implementation**: Follow issue priorities
3. **Refactoring**: Only when improving maintainability

### Code Style Preferences
- **Naming**: camelCase for variables, PascalCase for classes
- **Formatting**: Prettier configuration in each subproject
- **Error Handling**: Comprehensive try-catch blocks
- **Angular selectors**: Components use kebab-case element selectors with the subproject's prefix (`oc-…` in `website/`, `app-…` in `client/`), directives use camelCase attribute selectors with the same prefix. Enforced by `@angular-eslint/component-selector` / `directive-selector`; component classes in `website/` end with `Component` or `Page` (`@angular-eslint/component-class-suffix`)
- **File names**: `website/` uses kebab-case with Angular suffixes (`*.page.ts`, `*.component.ts`, `*.service.ts`, `*.interceptor.ts`; specs as `*.spec.ts`). `client/` and `server/` use snake_case (e.g. `socket_service.ts`, `db_connector.ts`), with server tests as `*.test.ts`. Card type files in `server/` follow `<type>_card.ts` under `src/components/cards/types/`, collection files `<category>_cards.ts`
- **Shared imports (`@shared/*`)**: Code shared across subprojects lives in `server/src/shared/`. The client and website import it only via the `@shared/*` path alias (e.g. `import { CardType } from '@shared/config/enums'`), while the server imports it relatively within its own root. Relative imports never cross a subproject root (enforced by `no-restricted-imports`)
