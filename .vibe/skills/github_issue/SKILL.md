---
name: github_issue
description: Instructions for fetching GitHub issues and managing branches
user-invocable: true
---

# GitHub Issue Skill

## Overview
This skill provides instructions for fetching GitHub issues and managing branches for issue resolution.

## Environment
- **GITHUB_TOKEN**: Provided as an environment variable to access the GitHub API. Ensure this token is set before using the skill.

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

### 2. Issue Management
- **Subtask Management**: Use `[ ]` and `[x]` markers to manage subtasks.
- **Commenting**: Comment on the issue if necessary to provide updates or clarifications.

### 3. Completion
- **Switch Back to Main**: Once everything is done, switch back to the main branch.

## Notes
- Ensure all changes are reviewed and tested before merging.
- Keep the issue updated with progress and any blockers encountered.