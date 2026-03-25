#!/bin/bash

# GitHub Workflow Helper Script for Outer Colonies
# This script provides common GitHub workflow operations

set -e  # Exit on error

# Function to display usage
show_usage() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  start-issue <issue_number> <description>  - Start workflow for a GitHub issue"
    echo "  create-branch <branch_name>               - Create and checkout a new branch"
    echo "  fix-main-commit <issue_number>            - Fix accidental commit to main branch"
    echo "  rename-branch <old_name> <new_name>      - Rename current branch"
    echo "  help                                   - Show this help message"
}

# Function to start workflow for a GitHub issue
start_issue() {
    local issue_number="$1"
    local description="$2"
    
    if [ -z "$issue_number" ] || [ -z "$description" ]; then
        echo "Error: Both issue_number and description are required"
        show_usage
        exit 1
    fi
    
    # Ensure we're on main branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ]; then
        echo "Error: You must be on the main branch to start a new issue"
        echo "Current branch: $current_branch"
        exit 1
    fi
    
    # Ensure main is up to date
    echo "Updating main branch..."
    git pull origin main
    
    # Create feature branch
    local branch_name="feature/${issue_number}_${description}"
    echo "Creating branch: $branch_name"
    git checkout -b "$branch_name"
    
    echo "Issue workflow started successfully!"
    echo "Branch: $branch_name"
    echo "Next steps:"
    echo "1. Implement your changes"
    echo "2. Commit with: git commit -m 'feat: implement #${issue_number}'"
    echo "3. Push with: git push origin $branch_name"
}

# Function to create and checkout a new branch
create_branch() {
    local branch_name="$1"
    
    if [ -z "$branch_name" ]; then
        echo "Error: branch_name is required"
        show_usage
        exit 1
    fi
    
    git checkout -b "$branch_name"
    echo "Created and checked out branch: $branch_name"
}

# Function to fix accidental commit to main branch
fix_main_commit() {
    local issue_number="$1"
    
    if [ -z "$issue_number" ]; then
        echo "Error: issue_number is required"
        show_usage
        exit 1
    fi
    
    # Get the commit hash
    local commit_hash=$(git rev-parse HEAD)
    
    # Create proper feature branch
    local branch_name="feature/${issue_number}_fix"
    git checkout -b "$branch_name"
    
    # Move the commit to the new branch
    git cherry-pick "$commit_hash"
    
    # Reset main branch
    git checkout main
    git reset --hard origin/main
    
    echo "Fixed accidental commit to main branch"
    echo "Your changes are now on branch: $branch_name"
    echo "Commit hash: $commit_hash"
}

# Function to rename current branch
rename_branch() {
    local old_name="$1"
    local new_name="$2"
    
    if [ -z "$old_name" ] || [ -z "$new_name" ]; then
        echo "Error: Both old_name and new_name are required"
        show_usage
        exit 1
    fi
    
    # Rename branch locally
    git branch -m "$old_name" "$new_name"
    
    # Update remote
    git push origin -u "$new_name"
    git push origin --delete "$old_name"
    
    echo "Branch renamed from $old_name to $new_name"
}

# Main script logic
case "$1" in
    start-issue)
        start_issue "$2" "$3"
        ;;
    create-branch)
        create_branch "$2"
        ;;
    fix-main-commit)
        fix_main_commit "$2"
        ;;
    rename-branch)
        rename_branch "$2" "$3"
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        if [ -z "$1" ]; then
            show_usage
        else
            echo "Error: Unknown command '$1'"
            show_usage
            exit 1
        fi
        ;;
esac