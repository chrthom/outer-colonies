---
name: github-issue
description: Work on GitHub issues systematically using a structured workflow
user-invocable: true
---

# GitHub Issue Skill

## Purpose
Provide a structured workflow for addressing GitHub issues efficiently.

## When to Use
- Assigned a GitHub issue (e.g., referenced as #123).

## Workflow

### 1. Start from Main Branch
- Checkout the main branch if not already on it.
- Pull the latest changes: `git pull`

### 2. Fetch Issue Details
Use the GitHub API to fetch issue details:

```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/<owner>/<repo>/issues/<issue_number>
```

Replace `<owner>`, `<repo>`, and `<issue_number>` with the appropriate values.

### 3. Create a Branch
- **Naming Convention**:
  - Features: `feature/<issue_number>_<description>`
  - Bugfixes: `bugfix/<issue_number>_<description>`
- **Check for Existing Branch**: Avoid duplicates by checking existing branches.
- **Never work directly on the main branch**.

### 4. Implement Changes
- Break down the issue into smaller tasks.
- Implement and validate each task before committing.

### 5. Validation Loop
1. Run quality checks: `npm run format && npm run lint && npm run test`
2. Fix any issues and repeat until all checks pass.

### 7. Issue Management
- Update the GitHub issue via the API.
- Mark completed subtasks by updating `- [ ]` to `- [x]`.
- Comment on the issue for updates or clarifications.

### 8. Create Pull Request
- **Title Format**: `#<issue_id> : <description>`
- **Link to Issue**: Use "Closes #<issue_id>" in the PR description to link it to the issue.

## Gotchas
- **Critical**: Never work directly on the main branch.
- Ensure `GITHUB_TOKEN` is set before making API calls.
- Read the issue description carefully for hidden requirements.
