#!/bin/bash
# Branch management utilities

# Ensure on latest main
# Syncs the local main branch with the remote origin/main
# @returns 0 on success, 1 on error
sync_main() {
  git checkout main || { echo "ERROR: Failed to checkout main" >&2; return 1; }
  git pull origin main || { echo "ERROR: Failed to pull main" >&2; return 1; }
}

# Create feature/bugfix branch
# Usage: create_branch <prefix> <issue_number> <description>
# Example: create_branch feature 123 add_login_button
# @param prefix - Branch prefix (feature or bugfix)
# @param issue_number - The issue number for tracking
# @param description - Short description for the branch name
# @returns 0 on success, 1 on error
create_branch() {
  local prefix=$1
  local issue_number=$2
  local description=$3
  local branch_name="${prefix}/${issue_number}_${description}"

  # Check if branch already exists locally or remotely
  if git branch -a | grep -qx "$branch_name"; then
    git checkout "$branch_name" || { echo "ERROR: Failed to checkout existing branch $branch_name" >&2; return 1; }
    git pull origin "$branch_name" || { echo "ERROR: Failed to pull branch $branch_name" >&2; return 1; }
  else
    git checkout -b "$branch_name" || { echo "ERROR: Failed to create branch $branch_name" >&2; return 1; }
  fi
}
