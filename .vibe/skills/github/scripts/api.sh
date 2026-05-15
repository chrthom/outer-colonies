#!/bin/bash
# GitHub API utilities
# Dependencies: config.sh (sets GITHUB_BASE_URL)

# Token Validation
validate_github_token() {
  if [ -z "$GITHUB_TOKEN" ]; then
    echo "ERROR: GITHUB_TOKEN environment variable is not set"
    exit 1
  fi
}

# API Request Helper
# Usage: github_api <method> <endpoint> [<data>]
# Example: github_api GET "/issues/123"
# Example: github_api POST "/pulls" '{"title":"foo","body":"bar","head":"branch","base":"main"}'
github_api() {
  local method=${1:-GET}
  local endpoint="${GITHUB_BASE_URL}${2}"
  local data=${3:-''}
  
  if [ "$method" = "GET" ]; then
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "$endpoint"
  else
    curl -s -X "$method" -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$endpoint"
  fi
}
