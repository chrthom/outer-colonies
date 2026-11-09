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

### Issue Labels
- Every issue has exactly one type label:
  - `bug` – Something isn't working
  - `cards` – Game cards to be added or adjusted and game card features to be implemented
  - `internal` – Database, testing, deployment, refactorings and hosting
  - `enhancement` – Feature improvements, design enhancements or website content additions
  - `feature` – A new game or website feature
- All types except `bug` additionally require exactly one size label: `size - S`, `size - M` or `size - L`
- `dev-loop` is the default label if the task can be fully implemented by the AI dev loop; use `needs-human` instead if human work is required (especially adjusting card graphics)

### Milestones, Versions & Releases
- Each milestone matches exactly one major/minor tag and release and contains all issues for developing that release; hotfix patch tags and releases are additionally assigned to the productive milestone
- Tags and releases are semantically versioned
- Milestones only cover major/minor versions; patches (hotfixes) belong to the milestone of the currently productive version
- The currently productive milestone stays open so productive bugs can be assigned to it; new features and enhancements go to the next milestone
- Milestone planning: at most one `size - L` issue, few `size - M` issues and any number of `size - S` issues
- Milestone names are solar system bodies: Saturn moons in ascending order of the "Nr." column of the German Wikipedia list of Saturn's moons (https://de.wikipedia.org/wiki/Liste_der_Saturnmonde); strictly sequential from now on, next after Pan (XVIII) is Ymir (XIX)

### Deployment
- Staging is deployed on demand
- Prod is only deployed when a release is complete (tag and GitHub release created)

## Documentation Requirements
- Update README.md for significant changes
- Add JSDoc comments for new public or protected functions
- Update TypeScript declarations when server interfaces change

## Decision Making Guidelines

### Priority System
1. **Bug Fixes**: Immediate attention for critical issues
2. **Feature Implementation**: Follow issue priorities
3. **Refactoring**: Only when improving maintainability

### Code Style Preferences
- **Naming**: camelCase for variables, PascalCase for classes
- **Formatting**: Prettier configuration in each subproject
- **Error Handling**: Comprehensive try-catch blocks
