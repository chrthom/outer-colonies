#!/bin/bash
# Shared GitHub configuration
# Extract repository context

GITHUB_REPO_OWNER=$(git remote -v | grep origin | head -1 | sed -E 's/.*github\.com[:/]([^/]*)\/.*/\1/')
GITHUB_REPO_NAME=$(git remote -v | grep origin | head -1 | sed -E 's/.*github\.com[:/]([^/]*)\/([^.]*).*/\2/')
GITHUB_BASE_URL="https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}"
