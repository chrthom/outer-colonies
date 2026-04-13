--- 
name: github-pr
description: Workflow for addressing GitHub pull request review comments
user-invocable: true
---

# GitHub Pull Request Skill

## Purpose
Systematically address PR review comments using a structured workflow.

## When to use
- Work on existing GitHub pull requests
- Address review comments systematically

## Workflow

### 1. Fetch PR Details
```bash
cd /path/to/repo && git remote -v
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number} > pr_details.json
```

### 2. Checkout PR Branch
```bash
git checkout {pr_branch_name}
```

### 3. Collect Unresolved Comments
Use the script in `scripts/collect_comments.js` to gather unresolved comments:

```bash
node scripts/collect_comments.js
```

This will create `unresolved_comments.json` with all unresolved review comments.

### 4. Generate Todos
Use the script in `scripts/generate_todos.js` to create todo items:

```bash
node scripts/generate_todos.js
```

This will create `generated_todos.json` with structured todo items for each comment.

### 5. Load Todos
```bash
todo write --file generated_todos.json
```

### 6. Gotchas
- Always reply in the same thread using `@username` - never edit existing comments
- Use `in_reply_to` field for proper threading in GitHub API
- Check for `GITHUB_TOKEN` environment variable before API calls
- The `/health` endpoint may return 200 even when database is down
- Always validate your changes before responding to comments

### 6. Process Todos

#### 6.1 Todos to "Address comment"

1. Mark todo as in_progress:

```bash
todo write --update '{"id": "impl_${commentId}", "status": "in_progress"}'
```

2. Implement required changes

3. Run quality checks and fix them if necessary:
```bash
npm run format && npm run lint && npm run test
```

4. Commit and push changes

5. Mark response todo as completed:
```bash
todo write --update '{"id": "impl_${commentId}", "status": "completed"}'
```

#### 6.2 Todos to "Reply on GitHub in thread of comment"

1. Mark todo as in_progress:

```bash
todo write --update '{"id": "resp_${commentId}", "status": "in_progress"}'
```

2. Reply to comment:

```bash
# First, find the review ID for the comment
REVIEW_ID=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/{owner}/{repo}/pulls/${pr_number}/comments/${commentId}" | jq -r '.pull_request_review_id')

# Then reply to the comment in the review thread
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"body\": \"@${AUTHOR} [Explain changes made]\", \"in_reply_to\": ${commentId}}" \
  "https://api.github.com/repos/{owner}/{repo}/pulls/${pr_number}/reviews/${REVIEW_ID}/comments"
```

**CRITICAL**: Always reply in same thread using `@username`
**CRITICAL**: Never edit existing comments or create new top-level comments
**CRITICAL**: Use the review ID and in_reply_to field to ensure proper threading

3. Verify reply was posted:
```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/{owner}/{repo}/pulls/comments/${commentId}/replies" | jq '.[] | select(.body | contains("@${AUTHOR}"))'
```
4. Mark response todo as completed:
```bash
todo write --update '{"id": "resp_${commentId}", "status": "completed"}'
```

#### 6.3 Quality Validation Pattern
For all quality-related todos, follow this validation loop:

1. **Run checks**: `npm run format && npm run lint && npm run test`
2. **Check status**: If any check fails, fix issues and repeat
3. **GitHub Actions**: Check status via API, wait up to 3 minutes for completion
4. **Fix failures**: If GitHub Actions fail, fix locally, validate, then push

#### 6.4 Cleanup
Remove temporary files:
- `unresolved_comments.json`
- `generated_todos.json`
- Any temporary script files created during the process
