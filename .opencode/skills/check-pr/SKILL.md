---
name: check-pr
description: Check and address GitHub pull request review comments systematically
---

Check and address review comments on a GitHub pull request (`pr_number`):

1. Load GitHub helpers and validate token:
   ```bash
   source .opencode/skills/github/scripts/config.sh
   source .opencode/skills/github/scripts/api.sh
   source .opencode/skills/github/scripts/branch.sh
   source .opencode/skills/github/scripts/pr.sh
   source .opencode/skills/github/scripts/quality.sh

   validate_github_token
   ```

2. Fetch PR details and checkout its branch:
   ```bash
   PR_DATA=$(fetch_pr "$pr_number")
   PR_BRANCH=$(echo "$PR_DATA" | jq -r '.head.ref')

   sync_main
   git checkout "$PR_BRANCH"
   git pull origin "$PR_BRANCH"
   ```

3. Fetch unresolved review comments:
   ```bash
   UNRESOLVED_COMMENTS=$(fetch_unresolved_comments "$pr_number")
   ```

4. Address each comment in code and reply to the thread:
   ```bash
   reply_to_comment "$COMMENT_ID" "<response>"
   ```

5. Run quality checks on affected subprojects, commit, and push (never force-push):
   ```bash
   check_all_affected
   git add --all
   git commit -m "Address PR #${pr_number} review comments"
   git push origin "$PR_BRANCH"
   ```
