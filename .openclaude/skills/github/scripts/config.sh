#!/bin/bash
# Shared GitHub configuration
# Sets GITHUB_REPO_OWNER, GITHUB_REPO_NAME, and GITHUB_BASE_URL environment variables
# by extracting repository context from git remotes.
# Exits with error if repository context cannot be determined.

# Get the first remote with github.com in URL
GITHUB_REMOTE=$(git remote -v | grep -i github.com | head -1)
if [ -z "$GITHUB_REMOTE" ]; then
  echo "ERROR: No GitHub remote found" >&2
  exit 1
fi

GITHUB_REPO_OWNER=$(echo "$GITHUB_REMOTE" | sed -E 's/.*github\.com[:/]([^/]*)\/.*/\1/')
GITHUB_REPO_NAME=$(echo "$GITHUB_REMOTE" | sed -E 's/.*github\.com[:/]([^/]*)\/([^.]*).*/\2/')

if [ -z "$GITHUB_REPO_OWNER" ] || [ -z "$GITHUB_REPO_NAME" ]; then
  echo "ERROR: Could not extract repository context from git remote" >&2
  exit 1
fi

GITHUB_BASE_URL="https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}"
