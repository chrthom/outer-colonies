#!/bin/bash
# Branch management utilities

# Ensure on latest main
sync_main() {
  git checkout main
  git pull origin main
}

# Create feature/bugfix branch
# Usage: create_branch <prefix> <issue_number> <description>
# Example: create_branch feature 123 add_login_button
create_branch() {
  local prefix=$1  # feature or bugfix
  local issue_number=$2
  local description=$3
  local branch_name="${prefix}/${issue_number}_${description}"
  
  # Check if branch already exists
  if git branch -a | grep -q "$branch_name"; then
    git checkout "$branch_name"
    git pull origin "$branch_name"
  else
    git checkout -b "$branch_name"
  fi
}
