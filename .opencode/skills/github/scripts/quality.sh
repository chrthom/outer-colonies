#!/bin/bash
# Quality check utilities
# Provides functions for running format, lint, and test checks on subprojects.

# Run quality checks for a single subproject
# Usage: run_quality_checks <subproject>
# Example: run_quality_checks client
# @param subproject - The subproject directory name (client, server, website)
# @returns 0 if all checks pass, non-zero on failure
run_quality_checks() {
  local subproject=$1
  if [ -z "$subproject" ]; then
    check_all_affected
    return $?
  fi
  if [ -f "$subproject/package.json" ]; then
    cd "$subproject"
    npm run format && npm run lint
    # Run tests only if logic files changed
    # Use merge base to handle shallow clones and detached HEAD
    local base_commit=$(git merge-base --octopus HEAD main 2>/dev/null || git rev-parse HEAD~1 2>/dev/null)
    if [ -n "$base_commit" ] && git diff --name-only "$base_commit" | grep -E '\.(ts|js|py|java)$' | grep -v -E '\.(spec|test|d\.ts)$'; then
      npm run test
    fi
    cd ..
  fi
}

# Run quality checks for all affected subprojects
# Checks working tree, staged, and untracked changes and runs quality checks for any affected subproject
# @returns 0 if all checks pass, non-zero on failure
check_all_affected() {
  local changed_files
  changed_files=$(git diff --name-only HEAD; git ls-files --others --exclude-standard)
  for subproject in client server website; do
    if echo "$changed_files" | grep -q "^${subproject}/"; then
      run_quality_checks "$subproject"
    fi
  done
}
