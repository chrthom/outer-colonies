---
name: github
description: Generic GitHub utilities and shared workflows for Outer Colonies project
user-invocable: false
---

# GitHub Skill

## Shared Configuration

```bash
# Extract repository context
GITHUB_REPO_OWNER=$(git remote -v | grep origin | head -1 | sed -E 's/.*github\.com[:/]([^/]*)\/.*/\1/')
GITHUB_REPO_NAME=$(git remote -v | grep origin | head -1 | sed -E 's/.*github\.com[:/]([^/]*)\/([^.]*).*/\2/')
GITHUB_BASE_URL="https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}"
```

## Shared Utilities

### Token Validation
```bash
if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN environment variable is not set"
  exit 1
fi
```

### API Request Helper
```bash
github_api() {
  local method=${1:-GET}
  local endpoint="${GITHUB_BASE_URL}${2}"
  local data=${3:-''}
  
  if [ "$method" = "GET" ]; then
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "$endpoint"
  else
    curl -s -X "$method" -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$endpoint"
  fi
}
```

### Branch Management
```bash
# Ensure on latest main
sync_main() {
  git checkout main
  git pull origin main
}

# Create feature/bugfix branch
create_branch() {
  local prefix=$1  # feature or bugfix
  local issue_number=$2
  local description=$3
  local branch_name="${prefix}/${issue_number}_${description}"
  
  # Check if branch already exists
  if git branch -a | grep -q "$branch_name"; then
    git checkout "$branch_name"
    git pull origin "$branch_name"
  else
    git checkout -b "$branch_name"
  fi
}
```

### Quality Checks
```bash
run_quality_checks() {
  local subproject=$1
  if [ -f "$subproject/package.json" ]; then
    cd "$subproject"
    npm run format && npm run lint
    # Run tests only if logic files changed
    if git diff --name-only HEAD~1 | grep -E '\.(ts|js|py|java)$' | grep -v -E '\.(spec|test|d\.ts)$'; then
      npm run test
    fi
    cd ..
  fi
}

# Run quality checks for all affected subprojects
check_all_affected() {
  for subproject in client server website; do
    if git diff --name-only | grep -q "^${subproject}/"; then
      run_quality_checks "$subproject"
    fi
  done
}
```

### GitHub Issue Utilities
```bash
# Fetch issue details
fetch_issue() {
  local issue_number=$1
  github_api GET "/issues/${issue_number}"
}

# Update issue comment
update_issue_comment() {
  local issue_number=$1
  local comment_id=$2
  local body=$3
  github_api PATCH "/issues/comments/${comment_id}" "{\"body\": \"${body}\"}"
}

# Add issue comment
add_issue_comment() {
  local issue_number=$1
  local body=$2
  github_api POST "/issues/${issue_number}/comments" "{\"body\": \"${body}\"}"
}

# Update issue (e.g., add labels, update state)
update_issue() {
  local issue_number=$1
  local data=$2
  github_api PATCH "/issues/${issue_number}" "$data"
}
```

### GitHub PR Utilities
```bash
# Fetch PR details
fetch_pr() {
  local pr_number=$1
  github_api GET "/pulls/${pr_number}"
}

# Fetch PR comments (all)
fetch_pr_comments() {
  local pr_number=$1
  github_api GET "/pulls/${pr_number}/comments"
}

# Fetch unresolved PR review comments
fetch_unresolved_comments() {
  local pr_number=$1
  fetch_pr_comments "$pr_number" | jq '[.[] | select(.resolved_at == null)]'
}

# Reply to PR comment (in thread)
reply_to_comment() {
  local pr_number=$1
  local comment_id=$2
  local review_id=$3
  local body=$4
  
  github_api POST "/pulls/${pr_number}/reviews/${review_id}/comments" \
    "{\"body\": \"${body}\", \"in_reply_to\": ${comment_id}}"
}

# Get review ID for a comment
get_review_id() {
  local pr_number=$1
  local comment_id=$2
  github_api GET "/pulls/${pr_number}/comments/${comment_id}" | jq -r '.pull_request_review_id'
}

# Create PR
create_pr() {
  local title=$1
  local body=$2
  local head_branch=$3
  local base_branch=${4:-main}
  
  github_api POST "/pulls" "{\"title\": \"${title}\", \"body\": \"${body}\", \"head\": \"${head_branch}\", \"base\": \"${base_branch}\"}"
}
```

## Rules
- Always validate GITHUB_TOKEN is set before API calls
- Always extract owner/repo from git remote
- Always use helper functions instead of raw curl commands
- Never commit directly to main branch
- Always pull latest changes before starting work
- Always run quality checks before pushing
