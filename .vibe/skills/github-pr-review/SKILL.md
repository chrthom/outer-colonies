---
name: github-pr-review
description: Address GitHub pull request review comments systematically
user-invocable: false
---

# GitHub Pull Request Review Skill

## Workflow

### 1. Extract PR Context
- Extract `{owner}`, `{repo}`, `{pr_number}` from GitHub API or user context
- Extract `{pr_branch_name}` from PR details

### 2. Fetch PR Details
```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number} > pr_details.json
```

### 3. Checkout PR Branch
```bash
git checkout {pr_branch_name}
git pull
```

### 4. Collect Unresolved Comments
```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments \
  | jq '[.[] | select(.resolved_at == null)]' > /tmp/unresolved_comments.json
```

### 5. Create Structured Todos
For each unresolved comment in `/tmp/unresolved_comments.json`:
- Create todo items using the `todo` tool with format:
  ```json
  {
    "action": "write",
    "todos": [
      {
        "id": "impl_{commentId}",
        "content": "Address comment {commentId}: {body}",
        "status": "pending",
        "priority": "high"
      },
      {
        "id": "resp_{commentId}",
        "content": "Reply to comment {commentId} author @{author}",
        "status": "pending",
        "priority": "high"
      }
    ]
  }
  ```

### 6. Process Todos

#### For "Address comment" todos:
1. Mark as in_progress via todo tool
2. Implement required changes
3. Run quality checks:
   ```bash
   npm run format && npm run lint && npm run test
   ```
4. Commit and push changes
5. Mark as completed via todo tool

#### For "Reply on GitHub" todos:
1. Mark as in_progress via todo tool
2. Get review ID for the comment:
   ```bash
   REVIEW_ID=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
     "https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments/{commentId}" \
     | jq -r '.pull_request_review_id')
   ```
3. Reply in thread:
   ```bash
   curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"body\": \"@${AUTHOR} {response}\", \"in_reply_to\": ${commentId}}" \
     "https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/reviews/${REVIEW_ID}/comments"
   ```
4. Verify reply was posted
5. Mark as completed via todo tool

## Rules
- **CRITICAL**: Always reply in the same thread using `@username`
- **CRITICAL**: Never edit existing comments or create new top-level comments
- **CRITICAL**: Use `in_reply_to` field and review ID for proper threading
- Ensure `GITHUB_TOKEN` is set before making API calls
- Always validate changes before responding to comments
- Check GitHub Actions status after pushing changes
