---
name: github_pr
description: Instructions for creating a Pull Request in GitHub
user-invocable: true
---

# GitHub PR Skill

## Overview
This skill provides instructions for creating a Pull Request (PR) in GitHub for an issue.

## Environment
- **GITHUB_TOKEN**: Provided as an environment variable to access the GitHub API. Ensure this token is set before using the skill.

## GitHub API Interaction
To create a Pull Request (PR) using the GitHub API, use the following `curl` command:

```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" \
  -d '{"title":"#<issue_id> : <description>","head":"<branch_name>","base":"main","body":"<pr_description>"}' \
  https://api.github.com/repos/<owner>/<repo>/pulls
```

Replace `<owner>`, `<repo>`, `<issue_id>`, `<description>`, `<branch_name>`, and `<pr_description>` with the appropriate values.

**Note**: First determine the correct repository owner and name by checking the git remote:
```bash
cd /path/to/repo && git remote -v
```

## Steps to Follow

### 1. Pull Request (PR) Creation
- **First Push**: After the first push, create a Pull Request.
- **Title Format**: `#<issue_id> : <description>`
- **Link to Issue**: Ensure the PR is linked to the issue.
