#!/bin/bash
# GitHub Pull Request utilities
# Dependencies: api.sh (github_api)

# Fetch PR details
# Usage: fetch_pr <pr_number>
fetch_pr() {
  local pr_number=$1
  github_api GET "/pulls/${pr_number}"
}

# Fetch PR comments (all)
# Usage: fetch_pr_comments <pr_number>
fetch_pr_comments() {
  local pr_number=$1
  github_api GET "/pulls/${pr_number}/comments"
}

# Fetch unresolved PR review comments
# Usage: fetch_unresolved_comments <pr_number>
fetch_unresolved_comments() {
  local pr_number=$1
  fetch_pr_comments "$pr_number" | jq '[.[] | select(.resolved_at == null)]'
}

# Reply to PR comment (in thread)
# Usage: reply_to_comment <comment_id> <body>
# Auto-discovers PR number and review_id from the comment
reply_to_comment() {
  local comment_id=$1
  local body=$2

  # Auto-discover PR number and review_id from the comment
  local comment_data=$(github_api GET "/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/pulls/comments/${comment_id}")
  local pr_number=$(echo "$comment_data" | jq -r '.pull_request.url' | grep -oE '/[0-9]+$' | tr -d '/')
  local review_id=$(echo "$comment_data" | jq -r '.pull_request_review_id // empty')

  if [ -z "$review_id" ]; then
    echo "ERROR: Cannot find review_id for comment ${comment_id}" >&2
    return 1
  fi

  github_api POST "/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/pulls/${pr_number}/reviews/${review_id}/comments" \
    "{\"body\": \"${body}\", \"in_reply_to\": ${comment_id}}"
}

# Get review ID for a comment
# Usage: get_review_id <pr_number> <comment_id>
get_review_id() {
  local pr_number=$1
  local comment_id=$2
  github_api GET "/pulls/${pr_number}/comments/${comment_id}" | jq -r '.pull_request_review_id'
}

# Create PR
# Usage: create_pr <title> <body> <head_branch> [<base_branch>]
# Example: create_pr "Fix bug" "Closes #123" feature/123_fix_login main
create_pr() {
  local title=$1
  local body=$2
  local head_branch=$3
  local base_branch=${4:-main}
  
  github_api POST "/pulls" "{\"title\": \"${title}\", \"body\": \"${body}\", \"head\": \"${head_branch}\", \"base\": \"${base_branch}\"}"
}
