#!/bin/bash
# Quality check utilities

# Run quality checks for a single subproject
# Usage: run_quality_checks <subproject>
# Example: run_quality_checks client
run_quality_checks() {
  local subproject=$1
  if [ -f "$subproject/package.json" ]; then
    cd "$subproject"
    npm run format && npm run lint
    # Run tests only if logic files changed
    if git diff --name-only HEAD~1 | grep -E '\.(ts|js|py|java)$' | grep -v -E '\.(spec|test|d\.ts)$'; then
      npm run test
    fi
    cd ..
  fi
}

# Run quality checks for all affected subprojects
check_all_affected() {
  for subproject in client server website; do
    if git diff --name-only | grep -q "^${subproject}/"; then
      run_quality_checks "$subproject"
    fi
  done
}
