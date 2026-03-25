--- 
name: github-workflow
description: Instruction to follow, when instructed to work on GitHub issue
user-invocable: true
---

# GitHub Workflow Skill

## Overview
This skill provides instructions for working on GitHub issues in a structured manner, ensuring consistency and traceability.

## Environment
- **GITHUB_TOKEN**: Provided as an environment variable to access the GitHub API.

## GitHub API Interaction
To fetch issue details using the GitHub API, use the following `curl` command:

```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/<owner>/<repo>/issues/<issue_number>
```

Replace `<owner>`, `<repo>`, and `<issue_number>` with the appropriate values.

**Note**: First determine the correct repository owner and name by checking the git remote:
```bash
cd /path/to/repo && git remote -v
```

## Steps to Follow

### 1. Branch Creation
- **Format**: 
  - For features: `feature/<issue_number>_<description>`
  - For bugfixes: `bugfix/<issue_number>_<description>`
- **Check for Existing Branch**: If a branch with the same name exists, create a new one with a slightly different name.
- **No main branch**: Never work directly on the main branch.

### 2. Development
- **Conventional Commits**: Use conventional commit messages (e.g., `feat: add new feature`, `fix: resolve bug`).
- **Stable State**: Push changes when a stable state is achieved.

### 3. Pull Request (PR) Creation
- **First Push**: After the first push, create a Pull Request.
- **Title Format**: `#<issue_id> : <description>`
- **Link to Issue**: Ensure the PR is linked to the issue.

### 4. Issue Management
- **Subtask Management**: Update `[ ]` to `[x]` markers in the issue description to manage subtasks.
- **Commenting**: Comment on the issue if necessary to provide updates or clarifications.

## Notes
- Ensure all changes are reviewed and tested before merging.
- Keep the issue updated with progress and any blockers encountered.
