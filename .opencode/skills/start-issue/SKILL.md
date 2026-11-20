---
name: start-issue
description: Work on GitHub issues systematically using a structured workflow
---

Implement a GitHub issue (`issue_number`) and open a pull request:

1. Load GitHub helpers and validate token:
   ```bash
   source .opencode/skills/github/scripts/config.sh
   source .opencode/skills/github/scripts/api.sh
   source .opencode/skills/github/scripts/branch.sh
   source .opencode/skills/github/scripts/issue.sh
   source .opencode/skills/github/scripts/pr.sh
   source .opencode/skills/github/scripts/quality.sh

   validate_github_token
   ```

2. Fetch issue details and determine branch naming (`fix/` for `Bug`, `feature/` otherwise):
   ```bash
   ISSUE_DATA=$(fetch_issue "$issue_number")
   ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
   ISSUE_TYPE=$(echo "$ISSUE_DATA" | jq -r '.type.name // empty')

   if [ "$ISSUE_TYPE" = "Bug" ]; then
     BRANCH_PREFIX="fix"
   else
     BRANCH_PREFIX="feature"
   fi
   BRANCH_DESC=$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | head -c 30)
   BRANCH_NAME="${BRANCH_PREFIX}/${issue_number}_${BRANCH_DESC}"
   ```

3. Sync `main` and create/checkout the issue branch:
   ```bash
   sync_main
   create_branch "$BRANCH_PREFIX" "$issue_number" "$BRANCH_DESC"
   ```

4. Implement the issue, then run quality checks on affected subprojects:
   ```bash
   check_all_affected
   ```

5. Commit, push, and create the pull request referencing the issue:
   ```bash
   git push -u origin "$BRANCH_NAME"
   create_pr "$ISSUE_TITLE" "Closes #${issue_number}" "$BRANCH_NAME"
   ```
