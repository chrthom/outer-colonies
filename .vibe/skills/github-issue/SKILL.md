---
name: github-issue
description: Work on GitHub issues systematically using a structured workflow
user-invocable: false
---

# GitHub Issue Skill

## Workflow

### 1. Extract Issue Context
- Extract `<owner>` and `<repo>` from `git remote -v`
- Extract `<issue_number>` from user context or issue reference (e.g., "#123")

### 2. Fetch Issue Details
```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}
```

### 3. Start from Main Branch
```bash
git checkout main
git pull
```

### 4. Create Feature/Bugfix Branch
- **Branch naming**:
  - Features: `feature/{issue_number}_{description}`
  - Bugfixes: `bugfix/{issue_number}_{description}`
- **Check existing branches first**:
  ```bash
  git branch -a | grep -E "(feature|bugfix)/{issue_number}"
  ```
- **Create and checkout**:
  ```bash
  git checkout -b {branch_name}
  ```

### 5. Implement Changes
- Break issue into subtasks
- Implement and validate each change
- Commit incrementally with conventional commit messages

### 6. Quality Validation
```bash
npm run format && npm run lint && npm run test
```
Fix any issues and repeat until all checks pass.

### 7. Issue Management
- Update GitHub issue via API to mark progress
- Update checkboxes: `- [ ]` → `- [x]` for completed tasks
- Add comments for updates or clarifications

### 8. Create Pull Request
- **Title**: `#{issue_number}: {description}`
- **Description**: Include "Closes #{issue_number}" to auto-link
- **Target branch**: main

## Rules
- **CRITICAL**: Never work directly on the main branch
- Ensure `GITHUB_TOKEN` environment variable is set
- Always pull latest changes before starting
- Validate all quality checks pass before committing
