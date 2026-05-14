#!/bin/bash
# Find next milestone (open, with version higher than current)
# Input: CURRENT_VERSION
# Output: NEXT_VERSION, NEXT_NAME, NEXT_MILESTONE_NUMBER

# Get all open milestones with version-like titles
OPEN_MILESTONES_JSON=$(github_api GET "/milestones?state=open")

# Find milestone with smallest version greater than current
NEXT_VERSION=""
NEXT_NAME=""
NEXT_MILESTONE_NUMBER=""

while IFS= read -r line; do
  MS_TITLE=$(echo "$line" | jq -r '.title')
  MS_NUMBER=$(echo "$line" | jq -r '.number')
  MS_VERSION=$(echo "$MS_TITLE" | grep -oE '^[0-9]+\.[0-9]+(\.[0-9]+)?')
  
  if [ -n "$MS_VERSION" ]; then
    # Check if MS_VERSION > CURRENT_VERSION using sort
    if [ "$MS_VERSION" != "$CURRENT_VERSION" ] && printf '%s\n%s\n' "$CURRENT_VERSION" "$MS_VERSION" | sort -V | head -1 | grep -q "$CURRENT_VERSION"; then
      # CURRENT_VERSION < MS_VERSION
      if [ -z "$NEXT_VERSION" ] || printf '%s\n%s\n' "$MS_VERSION" "$NEXT_VERSION" | sort -V | head -1 | grep -q "$MS_VERSION"; then
        NEXT_VERSION="$MS_VERSION"
        NEXT_NAME=$(echo "$MS_TITLE" | sed -E 's/^[0-9]+\.[0-9]+(\.[0-9]+)?[[:space:]]*//')
        NEXT_MILESTONE_NUMBER="$MS_NUMBER"
      fi
    fi
  fi
done <<< "$(echo "$OPEN_MILESTONES_JSON" | jq -c '.[]')"

if [ -z "$NEXT_VERSION" ]; then
  echo "ERROR: No next milestone found. Please create one for the next release."
  exit 1
fi

echo "Next version: ${NEXT_VERSION}, Next name: ${NEXT_NAME}"
