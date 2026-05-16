---
name: start-issue
description: Work on GitHub issues systematically using a structured workflow
user-invocable: true
parameters:
  - name: issue_number
    type: number
    required: true
    description: The GitHub issue ID to work on (e.g., 310)
---

Work on GitHub issues by following this workflow:

1. Load GitHub Skill
Load the `github` skill to access shared utilities and API functions:
```bash
source "$SKILL_DIR/../github/scripts/config.sh"
source "$SKILL_DIR/../github/scripts/api.sh"
source "$SKILL_DIR/../github/scripts/branch.sh"
source "$SKILL_DIR/../github/scripts/issue.sh"
source "$SKILL_DIR/../github/scripts/pr.sh"
source "$SKILL_DIR/../github/scripts/quality.sh"

validate_github_token
```

2. Extract Issue Context
- Use provided `issue_number` parameter
- Repository context is set by config.sh: `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BASE_URL`

3. Fetch Issue Details
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

4. Determine Issue Type and Branch Prefix
```bash
if echo "$ISSUE_LABELS" | grep -q "bug"; then
  BRANCH_PREFIX="bugfix"
elif echo "$ISSUE_LABELS" | grep -qE "(enhancement|feature)"; then
  BRANCH_PREFIX="feature"
else
  BRANCH_PREFIX="feature"
fi
```

5. Create Short Description for Branch
```bash
BRANCH_DESC=$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | head -c 30)
BRANCH_NAME="${BRANCH_PREFIX}/${issue_number}_${BRANCH_DESC}"
```

6. Start from Main Branch
```bash
sync_main
```

7. Create or Checkout Branch
```bash
create_branch "$BRANCH_PREFIX" "$BRANCH_NAME" "$ISSUE_TITLE"
```

8. Create Implementation Plan
Analyze the issue requirements and create a structured plan:
- Break down the issue into discrete tasks
- Identify files that need to be modified
- Estimate complexity of each task
- Identify any dependencies or blocking issues

9. Implement Solution
Work through the plan systematically:
- Make small, focused changes
- Test each change individually
- Commit frequently with descriptive messages

10. Verify Implementation
```bash
# Run quality checks
run_quality_checks

# Add issue comment if needed
add_issue_comment "$issue_number" "Implementation complete for: $ISSUE_TITLE"
```

11. Create Pull Request
```bash
create_pr "$BRANCH_NAME" "$ISSUE_TITLE" "Closes #${issue_number}"
```

## Rules
- ALWAYS load the github skill before using its functions
- ALWAYS validate issue exists before proceeding
- ALWAYS create a dedicated branch for the issue
- ALWAYS sync main before creating new branches
- ALWAYS use conventional commit messages
- NEVER work directly on main branch
- ALWAYS run quality checks before pushing
- ALWAYS reference the issue number in PR description
