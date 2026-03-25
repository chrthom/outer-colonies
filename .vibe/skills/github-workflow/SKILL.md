--- 
name: github-workflow
description: Instruction to follow, when instructed to work on GitHub issue
user-invocable: true
---

# GitHub Workflow Skill

## Overview
This skill provides instructions for working on GitHub issues in a structured manner, ensuring consistency and traceability.

## Steps to Follow

### 1. Branch Creation
- **Format**: 
  - For features: `feature/<issue_number>_<description>`
  - For bugfixes: `bugfix/<issue_number>_<description>`
- **Check for Existing Branch**: If a branch with the same name exists, create a new one with a slightly different name.
- **Current Branch Check**: If already on a feature or bugfix branch, continue working on the current branch.

### 2. Development
- **Conventional Commits**: Use conventional commit messages (e.g., `feat: add new feature`, `fix: resolve bug`).
- **Stable State**: Push changes when a stable state is achieved.

### 3. Pull Request (PR) Creation
- **First Push**: After the first push, create a Pull Request.
- **Title Format**: `#<issue_id> : <description>`
- **Link to Issue**: Ensure the PR is linked to the issue.

### 4. Issue Management
- **Subtask Management**: Use `[ ]` and `[x]` markers to manage subtasks.
- **Commenting**: Comment on the issue if necessary to provide updates or clarifications.

### 5. Completion
- **Switch Back to Main**: Once everything is done, switch back to the main branch.

## Environment
- **GITHUB_TOKEN**: Provided as an environment variable to access the GitHub API.

## Notes
- Ensure all changes are reviewed and tested before merging.
- Keep the issue updated with progress and any blockers encountered.
