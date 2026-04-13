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

### 5. Create ToDos
Create the todos in this order:
- Create todos for each unresolved comment thread:
  - Create a todo to work on the comment (analyse or fix it)
  - Always create one todo per comment to respond to the comment
  - Include comment ID in todo for later reference.
- Create a todo to run format, lint and test and fix it if necessary
- Create one todo to check the GitHub checks succeeded

### 6. Work on todos
Work on the created todos one by one.

#### 6.1 For todos that include implementation
- Run format, lint and test before git commit and git push.
- If lint or format do fail, fix them and run them again until they pass.

#### 6.2 For todos that include responding to a comment
Post responses to review comments using the GitHub API:
```bash
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -d '{"body":"@<reviewer> I have addressed your comment by <describe changes>. Please review."}'
```

- It is also allowed to not solve the issue but respond with a question to the comment.
- Always respond directly to the comment instead of creating a new comment.
- Create one respond at a time (one GitHub API call per respond).
- In any case you should **always respond** to **every unresolved comment**.

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

## Error Handling
- **Rate Limits**: Check `X-RateLimit-Remaining` header and wait if needed.
- **Retry Logic**: Implement exponential backoff for API errors.
