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
# Usage: reply_to_comment <pr_number> <comment_id> <review_id> <body>
reply_to_comment() {
  local pr_number=$1
  local comment_id=$2
  local review_id=$3
  local body=$4
  
  github_api POST "/pulls/${pr_number}/reviews/${review_id}/comments" \
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
