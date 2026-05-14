---
name: release-version
description: Create a release by creating release branch, tag, GitHub release, and incrementing version
user-invocable: true
---

# Release Version Skill

## Workflow

### 1. Load Generic GitHub Skill
Load `github` skill for shared utilities and API functions.

### 2. Validate and Sync Main Branch
Check if the working directory is dirty, abort if so, then sync main:
```bash
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: Git state is dirty. Please commit or stash your changes first."
  exit 1
fi
sync_main
```

### 3. Extract Current Version and Name
Get version from package.json and name from version indicator files:
```bash
# Get version from any subproject package.json (all are in sync)
CURRENT_VERSION=$(grep '"version"' client/package.json | head -1 | sed -E 's/.*"version": "([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')

# Get version name from version_indicator.ts
CURRENT_NAME=$(grep '\`.*v[0-9]' client/src/app/components/indicators/version_indicator.ts | grep -oP '[A-Z][a-z]+' | head -1)

# Extract major, minor, patch
MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3)

echo "Current version: v${CURRENT_VERSION} (${CURRENT_NAME})"
```

### 4. Determine Release Type
If patch version > 0, it's a patch release; otherwise it's a major/minor release:
```bash
if [ "$PATCH" -gt 0 ]; then
  IS_PATCH=true
  HOTFIX_NUM=$PATCH
  TAG_DESCRIPTION="${CURRENT_NAME} - Hotfix ${HOTFIX_NUM}"
  RELEASE_NAME="${CURRENT_VERSION} ${CURRENT_NAME} (Hotfix ${HOTFIX_NUM})"
else
  IS_PATCH=false
  TAG_DESCRIPTION="${CURRENT_NAME}"
  RELEASE_NAME="${CURRENT_VERSION} ${CURRENT_NAME}"
fi

echo "Release type: $( [ "$IS_PATCH" = true ] && echo "Patch (Hotfix ${HOTFIX_NUM})" || echo "Major/Minor")"
```

### 5. Get Milestone and Build Release Body
Get milestone info for tag description and build comprehensive release description:
```bash
source .vibe/skills/release-version/scripts/get_milestone.sh
```

### 6. Create Release Branch
```bash
# Extract major.minor for branch name
BRANCH_VERSION=$(echo "$CURRENT_VERSION" | sed -E 's/\.[0-9]+$//')
RELEASE_BRANCH="release/${BRANCH_VERSION}"

if git branch -a | grep -q "$RELEASE_BRANCH"; then
  git checkout "$RELEASE_BRANCH"
  git pull origin "$RELEASE_BRANCH"
else
  git checkout -b "$RELEASE_BRANCH"
  git push --set-upstream origin "$RELEASE_BRANCH"
fi
```

### 7. Create Annotated Tag
```bash
git tag -a "v${CURRENT_VERSION}" -m "${TAG_DESCRIPTION}"
git push origin "v${CURRENT_VERSION}"
```

### 8. Checkout Main Branch
```bash
git checkout main
```

### 9. Create GitHub Release
Replace newlines in release body for JSON compatibility, then create GitHub release:
```bash
# Replace newlines with \n for JSON
RELEASE_BODY_JSON=$(echo "$RELEASE_BODY" | sed ':a;N;$!ba;s/\n/\\n/g')

RELEASE_DATA=$(github_api POST "/releases" "{\"tag_name\": \"v${CURRENT_VERSION}\", \"name\": \"${RELEASE_NAME}\", \"body\": \"${RELEASE_BODY_JSON}\"}")

RELEASE_ID=$(echo "$RELEASE_DATA" | jq -r '.id')
echo "Created GitHub Release: $RELEASE_ID"
```

### 10. Find Next Milestone
Get the next milestone for version increment:
```bash
source .vibe/skills/release-version/scripts/find_next_milestone.sh
```

### 11. Increment Version in All Subprojects
Use the existing version.sh script to update all version files:
```bash
./misc/version.sh "${NEXT_VERSION}" "${NEXT_NAME}"
```

### 12. Commit Version Changes
```bash
git add --all
git commit -m "chore: bump version to v${NEXT_VERSION} - ${NEXT_NAME}"
git push origin main
```

### 13. Verify
```bash
git status
echo "Release v${CURRENT_VERSION} (${CURRENT_NAME}) created successfully"
echo "Release type: $( [ "$IS_PATCH" = true ] && echo "Patch (Hotfix ${HOTFIX_NUM})" || echo "Major/Minor")"
echo "Release Branch: $RELEASE_BRANCH"
echo "Tag: v${CURRENT_VERSION}"
echo "Tag description: $TAG_DESCRIPTION"
echo "GitHub Release ID: $RELEASE_ID"
echo "Version bumped to: v${NEXT_VERSION} (${NEXT_NAME}) on main"
```

## Rules
- ALWAYS pull latest changes from main
- ALWAYS create tag with descriptive message
- ALWAYS create GitHub release referring to the tag
- ALWAYS update version in all subprojects (client, server, website)
- ALWAYS commit version changes to main branch
- NEVER create release from dirty working directory
- NEVER skip tag creation or GitHub release creation
- Release branch name uses major.minor format (e.g., release/3.0 for version 3.0.x)
- Patch release detected when patch version > 0
- Tag description for patch releases follows format "<Name> - Hotfix <N>"
- Tag description for major/minor releases uses milestone description
- GitHub Release body for major/minor includes all closed issues from milestone
- GitHub Release name for patch releases includes "(Hotfix N)" suffix
- Next version and name are extracted from the next open milestone
