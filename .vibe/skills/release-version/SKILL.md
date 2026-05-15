---
name: release-version
description: Create a release by creating release branch, tag, GitHub release, and incrementing version
user-invocable: true
---

Create a release by following this workflow:

## Phase 1: Read-Only Operations (Information Gathering)

All operations in this phase only read data and do not modify anything.

### Step 1: Load GitHub Skill and Validate
Load `github` skill for shared utilities and API functions, then validate token:
```bash
# Load github skill scripts
source "$SKILL_DIR/../github/scripts/config.sh"
source "$SKILL_DIR/../github/scripts/api.sh"
source "$SKILL_DIR/../github/scripts/branch.sh"

# Validate token
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
# Get version from any subproject package.json (all are in sync)
CURRENT_VERSION=$(grep '"version"' client/package.json | head -1 | sed -E 's/.*"version": "([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')

# Get version name from version_indicator.ts
CURRENT_NAME=$(grep -oP '[A-Z][a-z]+' client/src/app/components/indicators/version_indicator.ts | head -1)

# Extract major, minor, patch
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

### Step 5: Get Milestone Information
Source the get_milestone script to fetch milestone data and build release body:
```bash
# Source the get_milestone script to populate MILESTONE_NUMBER, MILESTONE_DESCRIPTION, RELEASE_BODY
source "$SKILL_DIR/scripts/get_milestone.sh"

# Update TAG_DESCRIPTION from milestone if available and not patch
if [ "$IS_PATCH" = false ] && [ -n "$MILESTONE_DESCRIPTION" ]; then
  TAG_DESCRIPTION="$MILESTONE_DESCRIPTION"
fi
```

### Step 6: Find Next Milestone
Source the find_next_milestone script to determine the next version:
```bash
source "$SKILL_DIR/scripts/find_next_milestone.sh"

echo "Next version: ${NEXT_VERSION} (${NEXT_NAME})"
```

### Step 7: Build Changelog
Construct the full changelog for the release:
```bash
# For non-patch releases, build changelog from milestone issues
if [ "$IS_PATCH" = false ] && [ -n "$MILESTONE_NUMBER" ]; then
  ISSUES_JSON=$(github_api GET "/milestones/${MILESTONE_NUMBER}/issues?state=closed")
  
  CHANGELOG_FILE=$(mktemp)
  echo "## What's New in ${CURRENT_VERSION} ${CURRENT_NAME}" > "$CHANGELOG_FILE"
  echo "" >> "$CHANGELOG_FILE"
  
  if [ -n "$MILESTONE_DESCRIPTION" ]; then
    echo "${MILESTONE_DESCRIPTION}" >> "$CHANGELOG_FILE"
    echo "" >> "$CHANGELOG_FILE"
  fi
  
  echo "### Features & Improvements" >> "$CHANGELOG_FILE"
  ISSUES_COUNT=$(echo "$ISSUES_JSON" | jq -r '.[] | select(.pull_request == null) | .title' | wc -l)
  if [ "$ISSUES_COUNT" -gt 0 ]; then
    echo "$ISSUES_JSON" | jq -r '.[] | select(.pull_request == null) | "- " + (.title // "Untitled") + " (#" + (.number | tostring) + ")"' >> "$CHANGELOG_FILE"
  else
    echo "  No issues found" >> "$CHANGELOG_FILE"
  fi
  echo "" >> "$CHANGELOG_FILE"
  
  echo "### Pull Requests" >> "$CHANGELOG_FILE"
  PR_COUNT=$(echo "$ISSUES_JSON" | jq -r '.[] | select(.pull_request != null) | .title' | wc -l)
  if [ "$PR_COUNT" -gt 0 ]; then
    echo "$ISSUES_JSON" | jq -r '.[] | select(.pull_request != null) | "- " + (.title // "Untitled") + " (#" + (.number | tostring) + ")"' >> "$CHANGELOG_FILE"
  else
    echo "  No pull requests found" >> "$CHANGELOG_FILE"
  fi
  
  RELEASE_BODY=$(cat "$CHANGELOG_FILE")
  rm "$CHANGELOG_FILE"
fi

# For patch releases, build a simpler changelog from recent closed issues
if [ "$IS_PATCH" = true ]; then
  SEVEN_DAYS_AGO=$(date -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)
  ALL_ISSUES_JSON=$(github_api GET "/issues?state=closed&since=${SEVEN_DAYS_AGO}")
  
  CHANGELOG_FILE=$(mktemp)
  echo "## Hotfix ${HOTFIX_NUM} for ${CURRENT_VERSION} ${CURRENT_NAME}" > "$CHANGELOG_FILE"
  echo "" >> "$CHANGELOG_FILE"
  echo "### Bug Fixes" >> "$CHANGELOG_FILE"
  
  ISSUES_COUNT=$(echo "$ALL_ISSUES_JSON" | jq -r '.[] | select(.pull_request == null) | .title' | wc -l)
  if [ "$ISSUES_COUNT" -gt 0 ]; then
    echo "$ALL_ISSUES_JSON" | jq -r '.[] | select(.pull_request == null) | "- " + (.title // "Untitled") + " (#" + (.number | tostring) + ")"' >> "$CHANGELOG_FILE"
  else
    echo "  No bug fixes found" >> "$CHANGELOG_FILE"
  fi
  
  RELEASE_BODY=$(cat "$CHANGELOG_FILE")
  rm "$CHANGELOG_FILE"
fi

echo "Release body preview:"
echo "---"
echo "$RELEASE_BODY"
echo "---"
```

## Phase 2: User Approval

Present the release plan to the user for approval:

```bash
cat << EOF

=== RELEASE PLAN SUMMARY ===

Current Version: v${CURRENT_VERSION} (${CURRENT_NAME})
Release Type: $( [ "$IS_PATCH" = true ] && echo "Patch (Hotfix ${HOTFIX_NUM})" || echo "Major/Minor")

--- Next Release ---
Version: ${NEXT_VERSION}
Name: ${NEXT_NAME}

--- Release Details ---
Tag: v${CURRENT_VERSION}
Tag Description: ${TAG_DESCRIPTION}
Release Title: ${RELEASE_NAME}

--- Release Description Preview ---
${RELEASE_BODY}

=== APPROVAL REQUIRED ===
Do you approve this release plan?
- Type "yes", "approve", or "y" to proceed with creating the release
- Type "no" or provide feedback to adjust the plan
- Type "abort" or "cancel" to cancel the release process

EOF

# Read user input
read -p "Your decision: " USER_RESPONSE

# Check user response - case insensitive
USER_RESPONSE_LOWER=$(echo "$USER_RESPONSE" | tr '[:upper:]' '[:lower:]')

case "$USER_RESPONSE_LOWER" in
  yes|approve|y)
    echo "Release approved. Proceeding with write operations..."
    ;;
  no|abort|cancel|n)
    echo "Release cancelled by user."
    exit 0
    ;;
  *)
    if [ -n "$USER_RESPONSE" ]; then
      echo "Feedback received: $USER_RESPONSE"
      echo "Please adjust the release plan manually or re-run the skill with corrections."
    fi
    exit 0
    ;;
esac
```

## Phase 3: Write Operations (After Approval)

All modifications happen in this phase, only after user approval.

### Step 8: Create Release Branch
```bash
RELEASE_BRANCH="release/${CURRENT_VERSION}"

# Check if release branch already exists
if git branch -a | grep -q "$RELEASE_BRANCH"; then
  git checkout "$RELEASE_BRANCH"
  git pull origin "$RELEASE_BRANCH"
else
  git checkout -b "$RELEASE_BRANCH"
fi
```

### Step 9: Create Git Tag
```bash
TAG_NAME="v${CURRENT_VERSION}"

git tag -a "$TAG_NAME" -m "${TAG_DESCRIPTION}"
git push origin "$TAG_NAME"
```

### Step 10: Create GitHub Release
```bash
# Escape newlines in release body for JSON
RELEASE_BODY_JSON=$(echo "$RELEASE_BODY" | jq -Rs .)

# Create the GitHub release
RELEASE_DATA=$(jq -n \
  --arg tag "$TAG_NAME" \
  --arg name "$RELEASE_NAME" \
  --arg body "$RELEASE_BODY_JSON" \
  '{
    "tag_name": $tag,
    "name": $name,
    "body": $body,
    "draft": false,
    "prerelease": false
  }')

RELEASE_RESPONSE=$(github_api POST "/releases" "$RELEASE_DATA")
RELEASE_ID=$(echo "$RELEASE_RESPONSE" | jq -r '.id')

echo "GitHub Release created: $RELEASE_ID"
echo "Release URL: ${GITHUB_BASE_URL}/releases/${TAG_NAME}"
```

### Step 11: Update Version Files
Use the version.sh script to update all version references:
```bash
# Update version in all subprojects
"$SKILL_DIR/../../misc/version.sh" "$NEXT_VERSION" "$NEXT_NAME"
```

### Step 12: Commit Version Updates
```bash
# Stage all version changes
git add client/package.json server/package.json website/package.json \
  client/src/app/components/indicators/version_indicator.ts \
  website/src/app/app.component.html

# Commit the version updates
COMMIT_MESSAGE="chore: update version to ${NEXT_VERSION} (${NEXT_NAME})"
git commit -m "$COMMIT_MESSAGE"
```

### Step 13: Push Release Branch
```bash
git push origin "$RELEASE_BRANCH"
```

### Step 14: Create PR to Main
```bash
# Create a PR from release branch to main
PR_TITLE="chore: release ${CURRENT_VERSION} ${CURRENT_NAME}"
PR_BODY="Automated release commit for ${CURRENT_VERSION} ${CURRENT_NAME}

Version updated to ${NEXT_VERSION} (${NEXT_NAME}) for next development cycle."

PR_RESPONSE=$(github_api POST "/pulls" "{\"title\": \"${PR_TITLE}\", \"body\": \"${PR_BODY}\", \"head\": \"${RELEASE_BRANCH}\", \"base\": \"main\"}")
PR_URL=$(echo "$PR_RESPONSE" | jq -r '.html_url')

echo "Pull Request created: $PR_URL"
```

### Step 15: Close Milestone
```bash
# Close the current milestone
if [ -n "$MILESTONE_NUMBER" ]; then
  github_api PATCH "/milestones/${MILESTONE_NUMBER}" '{"state": "closed"}'
  echo "Milestone #${MILESTONE_NUMBER} closed"
fi
```

### Step 16: Final Summary
```bash
cat << EOF

=== RELEASE COMPLETE ===

Tag: ${TAG_NAME}
GitHub Release: ${GITHUB_BASE_URL}/releases/${TAG_NAME}
Next Version: ${NEXT_VERSION} (${NEXT_NAME})
Release Branch: ${RELEASE_BRANCH}
Pull Request: ${PR_URL:-N/A (not created)}

All write operations completed successfully.

EOF
```

## Rules
- Always validate GITHUB_TOKEN is set before API calls
- Always extract owner/repo from git remote via config.sh
- Always use github_api helper function instead of raw curl commands
- Never perform write operations before user approval
- All read-only operations must complete before showing approval prompt
- After approval, all write operations execute sequentially
- Handle user feedback gracefully - abort on any non-approval response
