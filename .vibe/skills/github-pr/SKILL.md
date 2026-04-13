--- 
name: github-pr
description: Instruction to follow, when instructed to create or work on an existing GitHub pull request
user-invocable: true
---

# GitHub Pull Request Skill

This skill provides instructions for working on GitHub pull requests in a structured manner.

## When to use

- Should work on an GitHub pull request (references e.g. PR #567)
- Check for a failing GitHub Actions checks
- Create pull requests
- Check review comments in a pull request

## Systematic Workflow

### 1. Fetch GitHub pull request
Use the GitHub API to fetch PR details:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}
```

**Note**: First determine the correct repository owner and name by checking the git remote:
```bash
cd /path/to/repo && git remote -v
```

### 2. Checkout PR branch
Locally checkout the branch that the PR is using

### 3. Check all unresolved comments
Fetch **all** review comments:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments
```

Also fetch all reviews to find additional comments:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/reviews
```

- For each review with state "COMMENTED", fetch the specific review comments:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/reviews/{review_id}/comments
```

### 4. Filter comments
- Only work with comments where `resolved_at` is null, ignore all others.
- **Exclude responses**: Filter out comments that start with "@<username>" as these are responses, not original review comments.

### 4.1 Comment Filtering Example

Use this jq command to filter unresolved comments:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments | \
  jq '.[] | select(.resolved_at == null) | {id, body, path, resolved_at}'
```

### 4.2 Response Comment Identification

Filter out response comments (those starting with "@username"):
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments | \
  jq '.[] | select(.resolved_at == null and (.body | startswith("@") | not)) | {id, body, path}'
```

### 5. Create ToDos Systematically

For EACH unresolved comment (where `resolved_at` is null):

1. **Implementation Todo**: Create a todo to address the comment
   - Format: "Address comment {id}: {brief_description}"
   - Include the comment ID for reference
   - Example: "Address comment 3069803107: Remove dailyEarnings from rules.ts"

2. **Response Todo**: Create a todo to respond to the comment
   - Format: "Respond to comment {id}"
   - Include the comment ID for the API call
   - Example: "Respond to comment 3069803107"

3. **Verification Todo**: Create a todo to verify the fix
   - Format: "Verify fix for comment {id}"
   - Example: "Verify fix for comment 3069803107"

### 5.1 Todo Creation Checklist

- [ ] All unresolved comments have implementation todos
- [ ] All unresolved comments have response todos  
- [ ] All unresolved comments have verification todos
- [ ] Quality assurance todos (format, lint, test)
- [ ] GitHub Actions check todo

### 5.2 Comment Processing Flow

```
START
  │
  ├─ Fetch all PR comments
  │    │
  │    ├─ Filter: resolved_at == null
  │    │    │
  │    │    ├─ Filter: body does NOT start with "@"
  │    │    │    │
  │    │    │    ├─ For EACH comment:
  │    │    │    │    ├─ Create implementation todo
  │    │    │    │    ├─ Create response todo
  │    │    │    │    └─ Create verification todo
  │    │    │    │
  │    │    │    └─ END FOR
  │    │    │
  │    │    └─ END FILTER
  │    │
  │    └─ END FILTER
  │
  ├─ Fetch all reviews with state == "COMMENTED"
  │    │
  │    ├─ For EACH review:
  │    │    ├─ Fetch review comments
  │    │    │    │
  │    │    │    ├─ Filter: resolved_at == null
  │    │    │    │    │
  │    │    │    │    ├─ Filter: body does NOT start with "@"
  │    │    │    │    │    │
  │    │    │    │    │    ├─ For EACH comment:
  │    │    │    │    │    │    ├─ Create implementation todo
  │    │    │    │    │    │    ├─ Create response todo
  │    │    │    │    │    │    └─ Create verification todo
  │    │    │    │    │    │
  │    │    │    │    │    └─ END FOR
  │    │    │    │    │
  │    │    │    │    └─ END FILTER
  │    │    │    │
  │    │    │    └─ END FILTER
  │    │    │
  │    │    └─ END FOR
  │    │
  │    └─ END FOR
  │
  ├─ Add quality assurance todos
  ├─ Add GitHub Actions check todo
  │
  └─ END
```

### 6. Work on todos
Work on the created todos one by one.

#### 6.1 For todos that include implementation
- Run format, lint and test before git commit and git push.
- If lint or format do fail, fix them and run them again until they pass.

#### 6.2 For todos that include responding to a comment

Use the GitHub API to post responses:

```bash
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -d '{"body":"@<reviewer> I have addressed your comment by <describe changes>. Please review."}'
```

**Response Requirements:**
- Always mention the reviewer using @username
- Be specific about what was changed
- Keep responses professional and concise
- One response per comment (one API call per comment)
- Respond to EVERY unresolved comment, even if just to ask for clarification

**Response Verification:**
- Check that the response appears in GitHub UI
- Verify the comment thread shows as resolved

#### 6.3 For todos to check GitHub Actions checks
Check all GitHub actions:

Fetch check runs:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/commits/{commit_sha}/check-runs
```

- If checks are still running, wait and fetch again after 15 seconds (wait up to 3 minutes in total for them to complete).
- For failing checks:
  - Fetch detailed logs
  - Parse error messages
  - Create specific todos for each failure
- **IMPORTANT**: Redo this step until all checks are passing. You are not done before all checks pass.

## Pre-Work Verification

Before starting any implementation work:

1. **Todo Completeness Check:**
   ```bash
   # Count unresolved comments
   unresolved_count=$(curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments | \
     jq '[.[] | select(.resolved_at == null and (.body | startswith("@") | not))] | length')

   # Count implementation todos
   impl_todos=$(todo read | grep -c "Address comment")

   # Count response todos
   resp_todos=$(todo read | grep -c "Respond to comment")

   if [ $unresolved_count -ne $impl_todos ] || [ $unresolved_count -ne $resp_todos ]; then
     echo "ERROR: Todo count mismatch!"
     echo "Unresolved comments: $unresolved_count"
     echo "Implementation todos: $impl_todos"
     echo "Response todos: $resp_todos"
     exit 1
   fi
   ```

2. **Branch Verification:**
   ```bash
   current_branch=$(git rev-parse --abbrev-ref HEAD)
   if [ "$current_branch" != "{pr_branch_name}" ]; then
     echo "ERROR: Not on correct branch. Expected {pr_branch_name}, got $current_branch"
     exit 1
   fi
   ```

3. **Clean Working Directory:**
   ```bash
   if ! git diff --quiet; then
     echo "ERROR: Working directory has uncommitted changes"
     exit 1
   fi
   ```

## Error Handling
- **Rate Limits**: Check `X-RateLimit-Remaining` header and wait if needed.
- **Retry Logic**: Implement exponential backoff for API errors.
