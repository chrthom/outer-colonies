---
name: commit
description: Analyze changes, create conventional commit, and push to current branch
---

Commit and push the changes on the current branch:

1. Run quality checks for affected subprojects (`server`, `client`, `website`):
   ```bash
   source .opencode/skills/github/scripts/quality.sh
   check_all_affected
   ```

2. Generate a conventional commit message from the diff without asking the user:
   - Format: `<type>(<scope>): <description>` (omit `(<scope>)` for cross-cutting/repo-level changes)
   - Scope: affected subproject (`server`, `client`, `website`)
   - Description: imperative mood, lowercase, no trailing period, max 72 chars

3. Stage all changes, commit, and push to the current branch.
