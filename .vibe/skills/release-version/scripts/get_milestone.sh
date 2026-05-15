#!/bin/bash
# Get milestone for current version and build release body
# Input: CURRENT_VERSION, CURRENT_NAME, IS_PATCH
# Output: MILESTONE_NUMBER, MILESTONE_DESCRIPTION, RELEASE_BODY

# Find milestone with title containing current version (e.g., "3.0 Prometheus")
MILESTONE_DATA=$(github_api GET "/milestones" | jq -r --arg version "$CURRENT_VERSION" --arg name "$CURRENT_NAME" 
  '.[] | select(.title | contains($version) or .title | contains($name))')

if [ -z "$MILESTONE_DATA" ]; then
  echo "WARNING: No milestone found for version ${CURRENT_VERSION} ${CURRENT_NAME}"
  MILESTONE_DESCRIPTION=""
  MILESTONE_NUMBER=""
  if [ "$IS_PATCH" = false ]; then
    RELEASE_BODY="Release ${CURRENT_VERSION} ${CURRENT_NAME}\n\nNo milestone found for this release."
  else
    RELEASE_BODY="Patch release ${CURRENT_VERSION} ${CURRENT_NAME}\n\nBug fixes and improvements:"
  fi
else
  MILESTONE_DESCRIPTION=$(echo "$MILESTONE_DATA" | jq -r '.description // ""')
  MILESTONE_NUMBER=$(echo "$MILESTONE_DATA" | jq -r '.number')
  MILESTONE_TITLE=$(echo "$MILESTONE_DATA" | jq -r '.title')
  echo "Found milestone #${MILESTONE_NUMBER}: ${MILESTONE_TITLE}"
  
  if [ "$IS_PATCH" = false ]; then
    # For non-patch releases, use milestone description as tag description (fallback to CURRENT_NAME if empty)
    if [ -n "$MILESTONE_DESCRIPTION" ]; then
      TAG_DESCRIPTION="$MILESTONE_DESCRIPTION"
    fi
    
    # Build changelog from closed issues
    if [ -n "$MILESTONE_NUMBER" ]; then
      ISSUES_JSON=$(github_api GET "/milestones/${MILESTONE_NUMBER}/issues?state=closed")
      
      RELEASE_BODY_FILE=$(mktemp)
      echo "Important features, improvements and changes:" > "$RELEASE_BODY_FILE"
      echo "$ISSUES_JSON" | jq -r '.[] | "- " + (.title // "Untitled")' >> "$RELEASE_BODY_FILE"
      echo "" >> "$RELEASE_BODY_FILE"
      echo "Click [here](https://github.com/chrthom/outer-colonies/milestone/${MILESTONE_NUMBER}?closed=1) for full changelog." >> "$RELEASE_BODY_FILE"
      RELEASE_BODY=$(cat "$RELEASE_BODY_FILE")
      rm -f "$RELEASE_BODY_FILE"
    else
      RELEASE_BODY="Release ${CURRENT_VERSION} ${CURRENT_NAME}\n\nNo milestone found for this release."
    fi
  else
    RELEASE_BODY="Patch release ${CURRENT_VERSION} ${CURRENT_NAME}\n\nBug fixes and improvements:"
  fi
fi
