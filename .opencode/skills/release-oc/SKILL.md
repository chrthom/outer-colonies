---
name: release-oc
description: Create a release by creating release branch, tag, GitHub release, and incrementing version
---

Create a major/minor release following `README.md` ("Creating a Release") and `AGENTS.md` ("Milestones, Versions & Releases").

**Phase logic:** Phases 0, 1 and 3 are performed by the agent; Phase 2 is the **manual step of the user** (checkout, build, deployment). The build must happen **before** the version bump so the deployed artifact carries the release version.

**Scope:** Major/minor releases only. Hotfix releases (patch versions on the productive milestone) are handled separately; only the hotfix naming under "Formats for tag and GitHub release" applies to them.

## Phase 0 - Preparation (read-only)

1. Verify the working tree is clean and `main` is in sync with `origin/main`.
2. Determine the upcoming release from the current state:
   - Version from `client/package.json`, `server/package.json`, `website/package.json` (must be identical).
   - Version and release name from `version` and `releaseName` in `server/src/shared/config/version.ts`.
   - Confirm this version does **not** yet have a tag/GitHub release (`git ls-remote --tags origin`, `gh release list`).
3. Milestone check: all issues of the milestone `<major.minor> <moon name>` must be closed except the release issue ("Create release <x.x> and perform deployment"). Read the **milestone description** (used as the tag annotation):
   ```bash
   gh issue list --repo chrthom/outer-colonies --milestone "<x.x> <Name>" --state all
   gh api repos/chrthom/outer-colonies/milestones --jq '.[] | {title, description}'
   ```
4. **Next milestone check**: verify that a milestone for `<major>.<minor+1>` (with the next sequential Saturn moon name per `AGENTS.md`) already exists - its name is used for the version bump in Phase 3. If it does not exist yet, ask the user whether to create it before starting the release.
5. Check open PRs (`gh pr list --repo chrthom/outer-colonies --state open`): draft PRs on other topics do not block; ask the user about open ones belonging to the milestone.
6. Run quality gates from the repo root: `npm run check`.

## Phase 1 - Create the release (write operations, after user approval)

Present the concrete plan to the user for approval before executing write operations.

1. **Release branch** (major/minor only, no `v`, no patch number):
   ```bash
   git checkout main
   git checkout -b release/<x.x>
   git push --set-upstream origin release/<x.x>
   ```
2. **Tag** on the release branch (annotation: milestone description):
   ```bash
   git tag -a v<x.x.x> -m "<milestone description>"
   git push origin v<x.x.x>
   ```
3. **GitHub release** referring to the tag, with release notes generated from the closed issues of the milestone (see formats below). If `gh release create` is unavailable or blocked, use the REST API:
   ```bash
   gh api repos/<owner>/<repo>/releases -f tag_name=v<x.x.x> -f name="<x.x.x> <moon name>" -F body="$(cat <notes file>)"
   ```
4. Provide the **Phase 2 checkout and build commands** to the user and wait for deployment confirmation.

## Phase 2 - Build & deployment (manual step by the user)

Provide these commands to the user and wait for confirmation:

1. **Checkout the tagged release state and build** (strictly from `v<x.x.x>` or `release/<x.x>`, not `main`):
   ```bash
   git checkout v<x.x.x>   # or: git checkout release/<x.x>
   npm run build:prod      # produces server.zip, client.zip, website.zip
   ```
2. **Upload** the zip archives to the hosting (`server`, `client`, `website`) and **unzip** them there.
3. **Restart** the `outercolonies_server` container.

## Phase 3 - Completion (only after user confirms deployment)

1. Close the **release issue** ("Create release <x.x> and perform deployment"). Keep the newly released milestone open (now the productive milestone) and close the previously productive milestone. If `gh api -X PATCH` is blocked, use a JSON input file:
   ```bash
   echo '{"state":"closed"}' > /tmp/opencode/milestone-state.json
   gh api repos/<owner>/<repo>/milestones/<number> --input /tmp/opencode/milestone-state.json
   ```
2. **Increment the version** to the next development version using the next milestone verified in Phase 0 (create the milestone first after user approval if needed):
   ```bash
   gh api repos/chrthom/outer-colonies/milestones -f title="<x.x> <moon name>" -f description="<one-sentence summary>"
   misc/release/version.sh <x.x.0> <moon name>
   ```
3. Open a PR for the version bump (e.g. branch `fix/version-bump-<x.x>`, commit `chore: bump version to v<x.x.x> - <Name>`).
4. Optional: verify that the productive website/client displays the new version.

## Formats for tag and GitHub release

- **Tag annotation** (`git tag -a ... -m ...`): the milestone description (one-sentence summary), or `<moon name> - Hotfix <n>` for hotfixes.
- **Release title**: `<x.x.x> <moon name>`, or `<x.x.x> <moon name> (Hotfix <n>)` for hotfixes.
- **Release body**:
  ```markdown
  # Outer Colonies v<x.x.x> - <moon name>

  <milestone description>

  ## Closed Issues

  ### Features
  - #<N> - <issue title>

  ### Tasks
  - #<N> - <issue title>

  ### Bugs
  - #<N> - <issue title>

  ---

  *Generated automatically from milestone <x.x> <moon name>*
  ```
  Only list non-empty issue type categories (`Feature`, `Task`, `Bug`), and exclude the release issue itself ("Create release <x.x> and perform deployment").
