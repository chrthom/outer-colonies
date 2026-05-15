#!/bin/bash
# GitHub Issue utilities
# Dependencies: api.sh (github_api)

# Fetch issue details
# Usage: fetch_issue <issue_number>
fetch_issue() {
  local issue_number=$1
  github_api GET "/issues/${issue_number}"
}

# Update issue comment
# Usage: update_issue_comment <issue_number> <comment_id> <body>
update_issue_comment() {
  local issue_number=$1
  local comment_id=$2
  local body=$3
  github_api PATCH "/issues/comments/${comment_id}" "{\"body\": \"${body}\"}"
}

# Add issue comment
# Usage: add_issue_comment <issue_number> <body>
add_issue_comment() {
  local issue_number=$1
  local body=$2
  github_api POST "/issues/${issue_number}/comments" "{\"body\": \"${body}\"}"
}

# Update issue (e.g., add labels, update state)
# Usage: update_issue <issue_number> <data_json>
# Example: update_issue 123 '{"labels": ["bug"]}'
update_issue() {
  local issue_number=$1
  local data=$2
  github_api PATCH "/issues/${issue_number}" "$data"
}
