--- 
name: github-workflow
description: Instruction to follow, when instructed to work on GitHub issue
user-invocable: true
---

# GitHub Workflow Skill

This skill provides instructions for working on GitHub issues in a structured manner.

## When to use

- Should work on an GitHub issue (references e.g. with #123)
- Fetch information from GitHub
- Check for a failing GitHub Actions check
- Create Pull Requests

## Systematic Workflow

### 1. Start from main branch
- Checkout the main branch, if currently on any other branch
- `git pull` on main branch

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

Breakdown the issue into todos and implement them one by one.
For each successfully implemented implemented ToDo:

#### Commit and push
- Run format, lint and test before git committ and git push

#### Create Pull Request (PR)
- **First Push**: Only create, if it does not exist yet.
- **Title Format**: `#<issue_id> : <description>`
- **Link to Issue**: Ensure the PR is linked to the issue.

### Issue Management
- Update the GitHub issue you are working on via GitHub API.
- **Subtask Management**: Update `[ ]` to `[x]` markers for completed subtasks.
- **Commenting**: Comment on the GitHub issue if necessary to provide updates or clarifications.

### 5. Check GitHub Actions checks
- Wait for the GitHub Actions checks of the PR to be completed
- If checks failed, create todos to fix them and start over at step "3. Perform implementation"
