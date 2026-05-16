---
name: release-oc
description: Create a release by creating release branch, tag, GitHub release, and incrementing version
user-invocable: true
---

Create a release by following this workflow:

## Phase 1: Read-Only Operations (Information Gathering)

All operations in this phase only read data and do not modify anything.

### Step 1: Load GitHub Skill and Validate
Load `github` skill for shared utilities and API functions, then validate token:
```bash
source "$SKILL_DIR/../github/scripts/config.sh"
source "$SKILL_DIR/../github/scripts/api.sh"
source "$SKILL_DIR/../github/scripts/branch.sh"
source "$SKILL_DIR/../github/scripts/quality.sh"

validate_github_token
```

### Step 2: Validate and Sync Main Branch
Check if the working directory is dirty, abort if so, then sync main:
```bash
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: Git state is dirty. Please commit or stash your changes first."
  exit 1
fi
sync_main
```

### Step 3: Extract Current Version and Name
Get version from package.json and name from version indicator files:
```bash
CURRENT_VERSION=$(grep '"version"' client/package.json | head -1 | sed -E 's/.*"version": "([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')

if [ -z "$CURRENT_VERSION" ]; then
  echo "ERROR: Could not extract version from client/package.json" >&2
  exit 1
fi

CURRENT_NAME=$(grep -oP '[A-Z][a-z]+' client/src/app/components/indicators/version_indicator.ts | head -1)

if [ -z "$CURRENT_NAME" ]; then
  echo "ERROR: Could not extract version name from version_indicator.ts" >&2
  exit 1
fi

MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3)

echo "Current version: v${CURRENT_VERSION} (${CURRENT_NAME})"
```

### Step 4: Determine Release Type
If patch version > 0, it's a patch release; otherwise it's a major/minor release:
```bash
if [ "$PATCH" -gt 0 ]; then
  IS_PATCH=true
  NEW_VERSION="${MAJOR}.${MINOR}.0"
  VERSION_NAME="$(echo "$CURRENT_NAME" | sed 's/.$/&X/')"  # Append X to name
else
  IS_PATCH=false
  NEW_VERSION="${MAJOR}.$((MINOR + 1)).0"
  VERSION_NAME="$(echo "$CURRENT_NAME" | sed 's/.$/&X/')"
fi

echo "Next version: v${NEW_VERSION} (${VERSION_NAME})"
```

### Step 5: Check for Unmerged PRs
```bash
UNMERGED_PR_COUNT=$(github_api GET "/pulls?state=open&base=main" | jq 'length')
if [ "$UNMERGED_PR_COUNT" -gt 0 ]; then
  echo "WARNING: There are ${UNMERGED_PR_COUNT} unmerged PRs targeting main"
  github_api GET "/pulls?state=open&base=main" | jq -r '.[].html_url'
  read -p "Continue with release? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

### Step 6: Check Quality Gates
```bash
check_all_affected
```

## Phase 2: Write Operations (Creating Release)

### Step 7: Create Release Branch
```bash
RELEASE_BRANCH="release/v${NEW_VERSION}"
git checkout -b "$RELEASE_BRANCH"
```

### Step 8: Update Version Files
Update all subproject package.json files and version indicator:
```bash
for SUBPROJECT in client server website; do
  if [ -f "$SUBPROJECT/package.json" ]; then
    sed -i "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/g" "$SUBPROJECT/package.json"
  fi
done

sed -i "s/${CURRENT_NAME}/${VERSION_NAME}/g" client/src/app/components/indicators/version_indicator.ts
```

### Step 9: Commit Version Updates
```bash
git add --all
git commit -m "chore: bump version to v${NEW_VERSION} (${VERSION_NAME})"
```

### Step 10: Create Git Tag
```bash
GIT_TAG="v${NEW_VERSION}"
git tag -a "$GIT_TAG" -m "Release v${NEW_VERSION} (${VERSION_NAME})"
```

### Step 11: Push Release Branch and Tag
```bash
git push origin "$RELEASE_BRANCH"
git push origin "$GIT_TAG"
```

### Step 12: Create GitHub Release
```bash
RELEASE_BODY="$(cat <<EOF
# Outer Colonies v${NEW_VERSION} (${VERSION_NAME})

## Changes

- Full changelog available in commit history

## Assets

- Game client builds
- Server distribution
EOF
)"

create_github_release "$GIT_TAG" "v${NEW_VERSION} (${VERSION_NAME})" "$RELEASE_BODY"
```

### Step 13: Merge Release Branch to Main
```bash
git checkout main
git merge --no-ff "$RELEASE_BRANCH" -m "chore: merge release v${NEW_VERSION}"
git push origin main
```

## Phase 3: Post-Release (Optional - Next Version Setup)

### Step 14: Create Next Development Version
```bash
if [ "$IS_PATCH" = false ]; then
  NEXT_VERSION="${MAJOR}.$((MINOR + 1)).0"
  NEXT_NAME="$(echo "$VERSION_NAME" | sed 's/X$//')"  # Remove trailing X
  
  git checkout -b "dev/v${NEXT_VERSION}"
  
  for SUBPROJECT in client server website; do
    if [ -f "$SUBPROJECT/package.json" ]; then
      sed -i "s/\"version\": \"${NEW_VERSION}\"/\"version\": \"${NEXT_VERSION}-dev\" /g" "$SUBPROJECT/package.json"
    fi
  done
  
  git add --all
git commit -m "chore: start development for v${NEXT_VERSION}"
git push origin "dev/v${NEXT_VERSION}"
fi
```

## Rules
- ALWAYS load the github skill before using its functions
- ALWAYS validate git state is clean before starting
- ALWAYS sync main before creating release branch
- ALWAYS use semantic versioning
- NEVER release from a dirty working directory
- ALWAYS create a GitHub release with proper tag
- ALWAYS verify all PRs are merged before releasing
