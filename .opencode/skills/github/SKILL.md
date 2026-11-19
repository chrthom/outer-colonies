---
name: github
description: Generic GitHub utilities and shared workflows for Outer Colonies project
metadata:
  opencode/autoinvoke: false
---

# GitHub Skill

Shared shell utilities under `.opencode/skills/github/scripts/`:

```bash
source .opencode/skills/github/scripts/config.sh
source .opencode/skills/github/scripts/api.sh
source .opencode/skills/github/scripts/branch.sh
source .opencode/skills/github/scripts/quality.sh
source .opencode/skills/github/scripts/issue.sh
source .opencode/skills/github/scripts/pr.sh

validate_github_token
```

| Script | Description |
|--------|-------------|
| `config.sh` | Extracts `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BASE_URL` from git remote |
| `api.sh` | `validate_github_token`, `github_api <method> <endpoint> [<data>]` |
| `branch.sh` | `sync_main`, `create_branch <prefix> <issue_number> <description>` |
| `quality.sh` | `run_quality_checks [<subproject>]`, `check_all_affected` |
| `issue.sh` | `fetch_issue`, `add_issue_comment`, `update_issue_comment`, `update_issue` |
| `pr.sh` | `fetch_pr`, `fetch_pr_comments`, `fetch_unresolved_comments`, `reply_to_comment`, `create_pr` |
