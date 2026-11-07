---
name: release-oc
description: Create a release by creating release branch, tag, GitHub release, and incrementing version
user-invocable: true
---

Create a release by following this workflow. The canonical source of truth is `README.md` (section "Creating a Release") and `AGENTS.md` ("Repository Working Rules"); this skill mirrors them.

**Phase logic:** Phases 0, 1 and 3 are performed by the agent; Phase 2 is the **manual step of the user** (checkout, build, deployment). The build must happen **before** the version bump, otherwise the deployed artifact carries the next development version. The version bump always happens only **after** successful deployment.

## Phase 0 - Preparation (read-only)

1. The working tree must be clean and `main` in sync with `origin/main`.
2. Determine the upcoming release from the current state:
   - Version from all three `client/server/website/package.json` (must be identical).
   - Release name from `client/src/app/components/indicators/version_indicator.ts` or `website/src/app/app.component.html` (format `<Name> (v<x.x.x>)`).
   - The upcoming release is the version already present in the package.json files that does **not** yet have a tag/GitHub release (latest tags: `git ls-remote --tags origin`, releases: `gh release list`).
3. Milestone check: all issues of the corresponding milestone (name = `<major.minor> <moon name>`) are closed except the release issue ("Create release <x.x> and perform deployment"). Also read the **milestone description** - it is the tag description.
   ```bash
   gh issue list --repo chrthom/outer-colonies --milestone "<x.x> <Name>" --state all
   gh api repos/chrthom/outer-colonies/milestones --jq '.[] | {title, description}'
   ```
4. **Next milestone check**: verify that a milestone for the **next** version (`<major>.<minor+1>` with the next Saturn moon name, strictly sequential) already exists - its name is the release name for the version bump in Phase 3. If it does not exist yet, ask the user whether to create it before starting the release.
5. Check open PRs: `gh pr list --repo chrthom/outer-colonies --state open` - DRAFT PRs on other topics do not block; ask the user about open ones belonging to the milestone.
6. Run quality gates: `npm run check` (format + lint + test for server, client, website) from the repo root. Angular website tests require Chromium (in containers: `apt update && apt install -y chromium`).

## Phase 1 - Create the release (write operations, after user approval)

Present the concrete plan to the user for approval before every write operation.

1. **Release branch** (major/minor only, no `v`, no patch number):
   ```bash
   git checkout main
   git checkout -b release/<x.x>
   git push --set-upstream origin release/<x.x>
   ```
2. **Tag** on the release branch (annotation: milestone description, see formats below):
   ```bash
   git tag -a v<x.x.x> -m "<milestone description>"
   git push origin v<x.x.x>
   ```
3. **GitHub release** referring to the existing tag; title and body see formats below. Generate the release notes from the closed issues of the milestone.
4. Hand the **checkout and build commands for Phase 2** to the user (see below) and wait for the deployment confirmation.

## Phase 2 - Build & deployment (manually by the user)

The agent does **not** execute these steps; it provides the user with these commands:

1. **Checkout of the tagged release state and build** - strictly from the tag `v<x.x.x>` (or branch `release/<x.x>`), **not** from `main` if it already contains newer commits:
   ```bash
   git checkout v<x.x.x>   # or: git checkout release/<x.x>
   npm run build:prod      # calls misc/release.sh -p; for staging: npm run build:staging
   ```
   Produces `server.zip`, `client.zip`, `website.zip` (in the directory where `npm run` was started).
2. **Upload** the zips to the hosting (target directories `server`, `client`, `website`) and **unzip** them there.
3. **Container restart**: restart the `outercolonies_server` container.
4. The user confirms the completed deployment to the agent.

Prod deployment happens **only** after tag and GitHub release exist (staging on demand at any time).

## Phase 3 - Completion (only after the user confirmed the deployment)

1. Close the **release issue** ("Create release <x.x> and perform deployment") and, if applicable, the milestone. The milestone of the *next* version stays open; new features go there.
2. **Increment the version** to the next development version; version and name come from the next milestone verified in Phase 0 (e.g. after 3.1 Pandora -> 3.2 Pan). If that milestone does not exist yet, create it first after user approval:
   ```bash
   gh api repos/chrthom/outer-colonies/milestones -f title="<x.x> <moon name>" -f description="<one-sentence summary>"
   npm run version   # interactively asks for version (x.x.x) and name
   ```
   `misc/version.sh <V> <N>` sets the version in all three `package.json` files and the display name in `client/src/app/components/indicators/version_indicator.ts` and `website/src/app/app.component.html`.
3. Direct pushes to `main` are forbidden by branch protection (squash merges only): bring the version bump to `main` via a PR (branch type `fix/` or `feature/`, e.g. `fix/version-bump-<x.x>`), conventional commit message ("chore: bump version to v<x.x.x> (<Name>)"). The maintainer merges it.
4. Optional: after deployment, verify that the productive website/client shows the new version (website footer, client version indicator).

## Formats for tag and GitHub release

Oriented at the existing style (reference: release v3.0.0 Prometheus).

**Tag annotation** (`git tag -a ... -m ...`): the milestone description, a one-sentence summary of the release content.
- Example v2.4.0: "Enable advanced tactic cards that need additional options to be chosen from when played or can perform attacks."
- Example 3.1 Pandora (milestone description): "Introduce cards of 5th edition and redesign card appearance"
- Hotfixes: `<moon name> - Hotfix <n>` (see v2.3.1-v2.3.3).

**Release title**: `<x.x.x> <moon name>`, for hotfixes `<x.x.x> <moon name> (Hotfix <n>)`.
- Examples: "3.0.0 Prometheus", "2.4.0 Atlas", "2.3.3 Calypso (Hotfix 3)"

**Release body** (template, oriented at v3.0.0):

```
# Outer Colonies v<x.x.x> - <moon name>

<milestone description>

## Closed Issues

### Features
- #<N> - <issue title> (size - L|M|S)

### Enhancements
- #<N> - <issue title> (size - L|M|S)

### Cards
- #<N> - <issue title> (size - L|M|S)

### Internal
- #<N> - <issue title> (size - L|M|S)

### Bugs
- #<N> - <issue title> (bug)

---

*Generated automatically from milestone <x.x> <moon name>*
```

- Categories according to the issue type labels (`feature`, `enhancement`, `cards`, `internal`, `bug`); only list non-empty categories.
- Append the size label in parentheses (bugs have no size label, use "(bug)").
- Do **not** include the release issue itself ("Create release <x.x> and perform deployment") in the notes.

## Rules

- Semantic versioning: milestones/releases major/minor only; hotfix patches (v<x.x.<n+1>>) belong to the milestone of the productive version.
- Milestone names are Saturn moons, ascending by the "Nr." column of the German Wikipedia list of Saturn's moons; strictly sequential - after Pan (XVIII) comes Ymir (XIX).
- Repository language is English: commits, PRs, release notes, descriptions.
- Present the concrete plan to the user for approval before every write operation (branch/tag/release).
- Never push directly to `main`; everything via PRs, the maintainer merges.
- Checkout, build and deployment are manual steps of the user (Phase 2); the agent only provides the commands and waits for confirmation.
- Version bump only after confirmed deployment.
- Always verify the git state is clean before starting.
