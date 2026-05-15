---
name: github
description: Generic GitHub utilities and shared workflows for Outer Colonies project
user-invocable: false
---

# GitHub Skill

## Setup

Load all utility scripts:
```bash
source .vibe/skills/github/scripts/config.sh
source .vibe/skills/github/scripts/api.sh
source .vibe/skills/github/scripts/branch.sh
source .vibe/skills/github/scripts/quality.sh
source .vibe/skills/github/scripts/issue.sh
source .vibe/skills/github/scripts/pr.sh

# Validate token
validate_github_token
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `config.sh` | Repository configuration (owner, name, base URL) |
| `api.sh` | API request helper and token validation |
| `branch.sh` | Branch management (sync_main, create_branch) |
| `quality.sh` | Quality checks (run_quality_checks, check_all_affected) |
| `issue.sh` | Issue utilities (fetch_issue, update_issue, add_issue_comment) |
| `pr.sh` | PR utilities (fetch_pr, fetch_unresolved_comments, reply_to_comment, create_pr) |

## Usage

See individual script files for function documentation and usage examples.

## Rules
- Always validate GITHUB_TOKEN is set before API calls
- Always extract owner/repo from git remote
- Always use helper functions instead of raw curl commands
- Never commit directly to main branch
- Always pull latest changes before starting work
- Always run quality checks before pushing
