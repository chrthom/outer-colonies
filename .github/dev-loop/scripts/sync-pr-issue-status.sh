#!/usr/bin/env bash
# Dev-loop helper: sync open same-repo issues linked to a PR (via closing
# references or the vibe/issue-<N>-* branch convention) to a target GitHub
# planning status ("In progress" or "In review").
#
# Best-effort / fail-open by design: issue statuses are a public preview feature
# and a transient API error or an unlinked PR must never break the review or
# post-step state machine.
#
# Required env: GH_TOKEN, PR_NUMBER, and GH_REPO (or REPOSITORY).
# Usage: bash .github/dev-loop/scripts/sync-pr-issue-status.sh "In progress"|"In review"
set -u

target_status="${1:-}"
case "$target_status" in
  "In progress") target_id=4 ;;
  "In review")   target_id=8 ;;
  *)
    echo "::warning::sync-pr-issue-status.sh: unsupported target status '$target_status'; skipping."
    exit 0
    ;;
esac

repo="${GH_REPO:-${REPOSITORY:-}}"
pr_number="${PR_NUMBER:-}"
if [ -z "$repo" ] || [ -z "$pr_number" ]; then
  echo "::warning::sync-pr-issue-status.sh: missing repo ('$repo') or PR number ('$pr_number'); skipping."
  exit 0
fi

if ! printf '%s' "$pr_number" | grep -Eq '^[0-9]+$'; then
  echo "::warning::sync-pr-issue-status.sh: non-numeric PR number '$pr_number'; skipping."
  exit 0
fi

owner="${repo%%/*}"
name="${repo##*/}"

pr_meta_json="$(gh api graphql \
  -F owner="$owner" -F name="$name" -F number="$pr_number" \
  -f query='
    query($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        pullRequest(number: $number) {
          headRefName
          closingIssuesReferences(first: 20) {
            nodes {
              number
              state
              repository { nameWithOwner }
            }
          }
        }
      }
    }' 2>/dev/null || true)"

if [ -z "$pr_meta_json" ] || ! printf '%s' "$pr_meta_json" | jq -e '.data.repository.pullRequest' >/dev/null 2>&1; then
  echo "::warning::Could not resolve linked issues for PR #$pr_number; skipping issue status sync to '$target_status'."
  exit 0
fi

closing_issues="$(printf '%s' "$pr_meta_json" | jq -r --arg repo "$repo" '
  .data.repository.pullRequest.closingIssuesReferences.nodes[]?
  | select(.repository.nameWithOwner == $repo and .state == "OPEN")
  | .number' 2>/dev/null || true)"

head_ref="$(printf '%s' "$pr_meta_json" | jq -r '.data.repository.pullRequest.headRefName // empty' 2>/dev/null || true)"
branch_issue=""
if [[ "$head_ref" =~ ^vibe/issue-([0-9]+)- ]]; then
  branch_issue="${BASH_REMATCH[1]}"
fi

linked_issues="$(printf '%s\n%s\n' "$closing_issues" "$branch_issue" | sed '/^$/d' | sort -un)"
if [ -z "$linked_issues" ]; then
  exit 0
fi

for issue_num in $linked_issues; do
  issue_json="$(gh api "repos/${repo}/issues/${issue_num}" 2>/dev/null || true)"
  if [ -z "$issue_json" ] || ! printf '%s' "$issue_json" | jq -e '.number' >/dev/null 2>&1; then
    echo "::warning::Could not read linked issue #$issue_num; skipping status sync to '$target_status'."
    continue
  fi

  # REST /issues/<N> also serves PRs; never touch a PR or a closed issue
  # (setting an open status on a closed issue reopens it).
  is_pr="$(printf '%s' "$issue_json" | jq -r '.pull_request != null' 2>/dev/null || echo true)"
  issue_state="$(printf '%s' "$issue_json" | jq -r '.state // empty' 2>/dev/null || true)"
  if [ "$is_pr" = "true" ] || [ "$issue_state" != "open" ]; then
    continue
  fi

  current_id="$(printf '%s' "$issue_json" | jq -r '.status.id // 0' 2>/dev/null || echo 0)"
  if [ "$current_id" = "$target_id" ]; then
    echo "Linked issue #$issue_num is already '$target_status'."
    continue
  fi

  if gh api -X PATCH "repos/${repo}/issues/${issue_num}" -f status="$target_status" >/dev/null 2>&1; then
    echo "Updated linked issue #$issue_num status to '$target_status'."
  else
    echo "::warning::Could not update linked issue #$issue_num status to '$target_status' (best-effort)."
  fi
done
