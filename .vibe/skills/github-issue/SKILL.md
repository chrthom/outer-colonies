--- 
name: github-issue
description: Instruction to follow, when instructed to work on GitHub issue
user-invocable: true
---

# GitHub Issue Skill

This skill provides instructions for working on GitHub issues in a structured manner.

## When to use

- Should work on an GitHub issue (references e.g. with #123).

## Systematic Workflow

### 1. Start from main branch
- Checkout the main branch, if currently on any other branch.
- `git pull` on main branch.

### 2. Fetch GitHub issue

To fetch issue details using the GitHub API, use the following `curl` command:

```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/<owner>/<repo>/issues/<issue_number>
```

Replace `<owner>`, `<repo>`, and `<issue_number>` with the appropriate values.

**Note**: First determine the correct repository owner and name by checking the git remote:
```bash
cd /path/to/repo && git remote -v
```

### 3. Create a branch
- **Format**: 
  - For features: `feature/<issue_number>_<description>`
  - For bugfixes: `bugfix/<issue_number>_<description>`
- **Check for Existing Branch**: If a branch with the same name exists, create a new one with a slightly different name.
- **No main branch**: Never work directly on the main branch.

### 4. Perform implementation
- Breakdown the issue into todos and implement them one by one.
- Run format, lint and test before git commit and git push.

### 5. Issue Management
- Update the GitHub issue you are working on via GitHub API.
- **Subtask Management**: Update `- [ ]` to `- [x]` markers for completed subtasks.
- **Commenting**: Comment on the GitHub issue if necessary to provide updates or clarifications.

### 6. Create Pull Request (PR)
- Use the GitHub Pull Request Skill to create a pull request in GitHub.


