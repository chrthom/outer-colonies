---
name: github-check-pr
description: Check and address GitHub pull request review comments systematically
user-invocable: true
---

# GitHub Check PR Skill

## Workflow

### 1. Load Generic GitHub Skill
Load `github` skill for shared utilities and API functions.

### 2. Extract PR Context
- Extract `{pr_number}` from user input or context
- Use `github` skill functions to set `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BASE_URL`

### 3. Validate PR Exists
```bash
PR_DATA=$(github_api GET "/pulls/${pr_number}")
if [ -z "$PR_DATA" ]; then
  echo "ERROR: Pull request #${pr_number} not found"
  exit 1
fi
```

### 4. Extract PR Branch
```bash
PR_BRANCH=$(echo "$PR_DATA" | jq -r '.head.ref')
PR_TITLE=$(echo "$PR_DATA" | jq -r '.title')
```

### 5. Checkout PR Branch
```bash
sync_main
git checkout "$PR_BRANCH"
git pull origin "$PR_BRANCH"
```

### 6. Fetch Unresolved Comments
```bash
UNRESOLVED_COMMENTS=$(fetch_unresolved_comments "$pr_number")
UNRESOLVED_COUNT=$(echo "$UNRESOLVED_COMMENTS" | jq 'length')

echo "Found ${UNRESOLVED_COUNT} unresolved comments to address"
```

### 7. Create Structured Todos
For each unresolved comment in `$UNRESOLVED_COMMENTS`:
```bash
# Parse comment JSON
COMMENT_ID=$(echo "$comment" | jq -r '.id')
COMMENT_BODY=$(echo "$comment" | jq -r '.body')
COMMENT_AUTHOR=$(echo "$comment" | jq -r '.user.login')
COMMENT_PATH=$(echo "$comment" | jq -r '.path')
COMMENT_LINE=$(echo "$comment" | jq -r '.line // "0"')

# Create todo for addressing the comment
todo write {
  "todos": [
    {
      "id": "impl_${COMMENT_ID}",
      "content": "Address comment ${COMMENT_ID} at ${COMMENT_PATH}:${COMMENT_LINE}: ${COMMENT_BODY}",
      "status": "pending",
      "priority": "high"
    },
    {
      "id": "resp_${COMMENT_ID}",
      "content": "Reply to @${COMMENT_AUTHOR} on comment ${COMMENT_ID}",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

### 8. Process Todos

#### For "Address comment" todos (impl_*):
1. Mark as `in_progress` via todo tool
2. Implement required changes in the specified file
3. Run quality checks using `check_all_affected` from github skill
4. Commit changes with conventional commit format
5. Push to PR branch
6. Mark as `completed` via todo tool

#### For "Reply on GitHub" todos (resp_*):
1. Mark as `in_progress` via todo tool
2. Get review ID: `REVIEW_ID=$(get_review_id "$pr_number" "$COMMENT_ID")`
3. Reply using `reply_to_comment "$pr_number" "$COMMENT_ID" "$REVIEW_ID" "@${COMMENT_AUTHOR} <response>"`
4. Verify reply was posted
5. Mark as `completed` via todo tool

### 9. Verify All Comments Addressed
```bash
FINAL_UNRESOLVED=$(fetch_unresolved_comments "$pr_number")
FINAL_COUNT=$(echo "$FINAL_UNRESOLVED" | jq 'length')

if [ "$FINAL_COUNT" -eq 0 ]; then
  echo "All comments addressed successfully!"
else
  echo "WARNING: ${FINAL_COUNT} comments remain unresolved"
fi
```

## Rules
- **CRITICAL**: Always reply in the same thread using `@username`
- **CRITICAL**: Never edit existing comments or create new top-level comments
- **CRITICAL**: Use `in_reply_to` field and review ID for proper threading
- Always validate PR exists before proceeding
- Always sync with main before checkout
- Always run quality checks before pushing changes
- Always verify replies were posted successfully
