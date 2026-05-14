---
name: github-work-on-issue
description: Work on GitHub issues systematically using a structured workflow
user-invocable: true
---

# GitHub Work On Issue Skill

## Workflow

### 1. Load Generic GitHub Skill
Load `github` skill for shared utilities and API functions.

### 2. Extract Issue Context
- Extract `{issue_number}` from user input or context
- Use `github` skill functions to set `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BASE_URL`

### 3. Fetch Issue Details
```bash
ISSUE_DATA=$(fetch_issue "$issue_number")
if [ -z "$ISSUE_DATA" ]; then
  echo "ERROR: Issue #${issue_number} not found"
  exit 1
fi

ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
ISSUE_BODY=$(echo "$ISSUE_DATA" | jq -r '.body')
ISSUE_LABELS=$(echo "$ISSUE_DATA" | jq -r '[.labels[].name] | join(", ")')
```

### 4. Determine Issue Type and Branch Prefix
```bash
if echo "$ISSUE_LABELS" | grep -q "bug"; then
  BRANCH_PREFIX="bugfix"
elif echo "$ISSUE_LABELS" | grep -qE "(enhancement|feature)"; then
  BRANCH_PREFIX="feature"
else
  BRANCH_PREFIX="feature"
fi
```

### 5. Create Short Description for Branch
```bash
# Extract first 10 words from title, lowercase, replace spaces with underscores
BRANCH_DESC=$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | head -c 30)
BRANCH_NAME="${BRANCH_PREFIX}/${issue_number}_${BRANCH_DESC}"
```

### 6. Start from Main Branch
```bash
sync_main
```

### 7. Create or Checkout Branch
```bash
create_branch "$BRANCH_PREFIX" "$issue_number" "$BRANCH_DESC"
```

### 8. Break Issue into Subtasks
Parse issue body for checkboxes and create todos:
```bash
# Extract checkboxes from issue body
if echo "$ISSUE_BODY" | grep -q '^- \[ \]'; then
  # Create todo for each checkbox
  echo "$ISSUE_BODY" | grep '^- \[ \]' | while read -r line; do
    TASK=$(echo "$line" | sed 's/^- \[ \] //')
    todo write {
      "todos": [
        {
          "id": "issue_${issue_number}_$(echo "$TASK" | head -c 10 | tr ' ' '_')",
          "content": "${TASK}",
          "status": "pending",
          "priority": "high"
        }
      ]
    }
  done
fi
```

### 9. Implement Changes
For each todo:
1. Mark as `in_progress` via todo tool
2. Implement the required change
3. Run quality checks using `check_all_affected` from github skill
4. Commit with conventional commit format:
   ```bash
   git add --all
   git commit -m "$(determine_commit_type): #${issue_number} <description>"
   ```
5. Mark as `completed` via todo tool

### 10. Update Issue Progress
After completing each subtask:
```bash
# Mark checkbox as completed
UPDATED_BODY=$(echo "$ISSUE_BODY" | sed "s/^- \[ \] ${TASK}/- [x] ${TASK}/")
update_issue "$issue_number" "{\"body\": \"${UPDATED_BODY}\"}"
```

### 11. Create Pull Request (When All Done)
```bash
PR_TITLE="#${issue_number}: ${ISSUE_TITLE}"
PR_BODY="Closes #${issue_number}\n\n${ISSUE_BODY}"
create_pr "$PR_TITLE" "$PR_BODY" "$(git branch --show-current)" "main"
```

## Rules
- **CRITICAL**: Never work directly on the main branch
- Always pull latest changes before starting
- Always break work into subtasks/todos
- Always update issue progress as you work
- Validate all quality checks pass before committing
- Use conventional commit messages
- PR title should reference issue number
- PR description should include "Closes #<issue_number>"
