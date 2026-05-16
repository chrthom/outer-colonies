---
name: check-pr
description: Check and address GitHub pull request review comments systematically
user-invocable: true
parameters:
  - name: pr_number
    type: number
    required: true
    description: The GitHub pull request ID to check (e.g., 417)
---

Check and address GitHub pull request review comments by following this workflow:

1. Load GitHub Skill
Load the `github` skill to access shared utilities and API functions:
```bash
source "$SKILL_DIR/../github/scripts/config.sh"
source "$SKILL_DIR/../github/scripts/api.sh"
source "$SKILL_DIR/../github/scripts/branch.sh"
source "$SKILL_DIR/../github/scripts/pr.sh"
source "$SKILL_DIR/../github/scripts/quality.sh"

validate_github_token
```

2. Extract PR Context
- Use provided `pr_number` parameter
- Repository context is set by config.sh: `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BASE_URL`

3. Validate PR Exists
```bash
PR_DATA=$(fetch_pr "$pr_number")
if [ -z "$PR_DATA" ]; then
  echo "ERROR: Pull request #${pr_number} not found"
  exit 1
fi
```

4. Extract PR Branch
```bash
PR_BRANCH=$(echo "$PR_DATA" | jq -r '.head.ref')
PR_TITLE=$(echo "$PR_DATA" | jq -r '.title')
```

5. Checkout PR Branch
```bash
sync_main
git checkout "$PR_BRANCH"
git pull origin "$PR_BRANCH"
```

6. Fetch Unresolved Comments
```bash
UNRESOLVED_COMMENTS=$(fetch_unresolved_comments "$pr_number")
UNRESOLVED_COUNT=$(echo "$UNRESOLVED_COMMENTS" | jq 'length')

echo "Found ${UNRESOLVED_COUNT} unresolved comments to address"
```

7. Create Structured Todos
For each unresolved comment in `$UNRESOLVED_COMMENTS`:
```bash
COMMENT_ID=$(echo "$comment" | jq -r '.id')
COMMENT_BODY=$(echo "$comment" | jq -r '.body')
COMMENT_AUTHOR=$(echo "$comment" | jq -r '.user.login')
COMMENT_PATH=$(echo "$comment" | jq -r '.path')
COMMENT_LINE=$(echo "$comment" | jq -r '.line // "0"')

COMMENT_SUMMARY=$(echo "$COMMENT_BODY" | head -c 50 | sed 's/[\n\r]//g')
TODO_TEXT="PR Comment [${COMMENT_LINE}]: ${COMMENT_SUMMARY} @${COMMENT_PATH}:${COMMENT_LINE}"
```

8. Address Each Comment
- Navigate to the file and line indicated
- Read the comment context
- Make necessary code changes
- Reply using `reply_to_comment "$COMMENT_ID" "<response>"`

9. Verify All Comments Addressed
```bash
REMAINING_COMMENTS=$(fetch_unresolved_comments "$pr_number")
REMAINING_COUNT=$(echo "$REMAINING_COMMENTS" | jq 'length')

if [ "$REMAINING_COUNT" -eq 0 ]; then
  echo "All comments addressed!"
else
  echo "WARNING: ${REMAINING_COUNT} comments still unresolved"
fi
```

10. Run Quality Checks and Push
```bash
run_quality_checks

git add --all
git commit -m "Address PR #${pr_number} review comments"
git push origin "$PR_BRANCH"
```

## Rules
- ALWAYS load the github skill before using its functions
- ALWAYS validate PR exists before proceeding
- ALWAYS checkout the PR branch before addressing comments
- ALWAYS reply to comments after addressing them
- NEVER force push to PR branches
- ALWAYS run quality checks before pushing
