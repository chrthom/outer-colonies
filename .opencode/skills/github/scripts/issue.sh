#!/bin/bash
# GitHub Issue utilities
# Dependencies: api.sh (github_api), config.sh (GITHUB_BASE_URL)

# Fetch issue details
# Usage: fetch_issue <issue_number>
# @param issue_number - The GitHub issue number to fetch
# @returns JSON string with issue data or empty if not found
fetch_issue() {
  local issue_number=$1
  github_api GET "/issues/${issue_number}"
}

# Update issue comment
# Usage: update_issue_comment <issue_number> <comment_id> <body>
# @param issue_number - The issue number containing the comment
# @param comment_id - The comment ID to update
# @param body - The new comment body text
# @returns JSON with updated comment data
update_issue_comment() {
  local issue_number=$1
  local comment_id=$2
  local body=$3
  github_api PATCH "/issues/comments/${comment_id}" "{\"body\": \"${body}\"}"
}

# Add issue comment
# Usage: add_issue_comment <issue_number> <body>
# @param issue_number - The issue number to add comment to
# @param body - The comment body text
# @returns JSON with created comment data
add_issue_comment() {
  local issue_number=$1
  local body=$2
  github_api POST "/issues/${issue_number}/comments" "{\"body\": \"${body}\"}"
}

# Update issue (e.g., add labels, update state)
# Usage: update_issue <issue_number> <data_json>
# Example: update_issue 123 '{"labels": ["bug"]}'
# @param issue_number - The issue number to update
# @param data - JSON string with issue data to update
# @returns JSON with updated issue data
update_issue() {
  local issue_number=$1
  local data=$2
  github_api PATCH "/issues/${issue_number}" "$data"
}
