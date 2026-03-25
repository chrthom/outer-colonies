#!/bin/bash

# Script to properly start GitHub workflow for an issue
# Usage: .vibe/scripts/start_github_workflow.sh <issue_number> <description>

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <issue_number> <description>"
    echo "Example: $0 568 surrender_menu"
    exit 1
fi

ISSUE_NUMBER=$1
DESCRIPTION=$2
BRANCH_NAME="feature/${ISSUE_NUMBER}_${DESCRIPTION}"

# Check if we're on main branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Error: You must be on the main branch to start a new GitHub workflow"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check if branch already exists
git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"
if [ $? -eq 0 ]; then
    echo "Error: Branch '$BRANCH_NAME' already exists"
    exit 1
fi

echo "Starting GitHub workflow for issue #$ISSUE_NUMBER: $DESCRIPTION"
echo "Creating branch: $BRANCH_NAME"

git checkout -b "$BRANCH_NAME"

if [ $? -eq 0 ]; then
    echo "✓ Successfully created branch: $BRANCH_NAME"
    echo "✓ You are now on branch: $BRANCH_NAME"
    echo ""
    echo "Next steps:"
    echo "  1. Implement your changes"
    echo "  2. Commit with: git commit -m 'feat: implement issue #$ISSUE_NUMBER'"
    echo "  3. Push with: git push origin $BRANCH_NAME"
    echo "  4. Create Pull Request on GitHub"
    echo "  5. Return to main with: git checkout main"
else
    echo "Error: Failed to create branch"
    exit 1
fi