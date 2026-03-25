---
name: github_workflow
description: GitHub Workflow Automation
version: 1.0
---

# GitHub Workflow Skill for Outer Colonies

## Overview

This skill provides comprehensive GitHub workflow automation for the Outer Colonies project.

## Configuration

```toml
[skills.github_workflow]
enabled = true
auto_branch_creation = true
auto_commit_push = true
auto_pr_creation = true
auto_issue_update = true
default_commit_type = "feat"
enforcement_enabled = true
hooks_installed = true
start_script_path = ".vibe/scripts/start_github_workflow.sh"
```

## Workflow Automation

### Branch Creation
- **Format**: `feature/<issue_number>_<description>` or `bugfix/<issue_number>_<description>`
- **Examples**: `feature/568_surrender_menu`, `bugfix/451_card_validation`
- **Automatic**: Triggered when working on GitHub issues

### Commit Management
- **Types**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`
- **Format**: `<type>: <description>`
- **Examples**: `feat: implement surrender functionality`, `fix: resolve card validation bug`

### Push to Remote
- Automatic push to origin with proper branch tracking
- Error handling and retry logic

### Pull Request Creation
- **Title Format**: `<issue_id>: <description>`
- **Automatic**: Links to original issue, includes implementation summary
- **Examples**: `#568: Menu option to surrender without quitting the game`

### Issue Updates
- Progress tracking with emoji indicators
- Subtask management using `[ ]` and `[x]` markers
- Automatic status updates

## Manual Operations

### Starting Workflow
```bash
# Using helper script
.vibe/scripts/start_github_workflow.sh <issue_number> <description>

# Manual process
git checkout -b feature/<issue_number>_<description>
git commit -m "<type>: <description>"
git push origin feature/<issue_number>_<description>
```

### Helper Script Usage
```bash
# Start workflow for issue #123 with description "card_validation"
.vibe/scripts/start_github_workflow.sh 123 card_validation

# This will:
# 1. Verify you're on main branch
# 2. Create branch: feature/123_card_validation
# 3. Switch to the new branch
# 4. Show next steps
```

## Enforcement Mechanisms

### Pre-commit Hook
- **Location**: `.git/hooks/pre-commit`
- **Function**: Prevents GitHub issue commits on main branch
- **Behavior**: 
  - Blocks commits with issue references (`#123`) on main branch
  - Warns about non-standard branch names
  - Provides helpful error messages with correction instructions

### Configuration
- **enforcement_enabled**: Enable/disable enforcement
- **hooks_installed**: Track hook installation status
- **start_script_path**: Path to helper script

## Error Handling & Recovery

### Common Issues

**Issue**: Accidentally committed to main branch
```bash
# Create proper branch
git checkout -b feature/<issue_number>_<description>
# Move changes using git stash or cherry-pick
git cherry-pick <commit_hash>
# Reset main branch
git checkout main
git reset --hard origin/main
```

**Issue**: Wrong branch name
```bash
# Rename branch
git branch -m <old_name> <new_name>
# Update remote
git push origin -u <new_name>
git push origin --delete <old_name>
```

### Correction Procedure

1. **Stop**: Immediately stop current work
2. **Create Branch**: `git checkout -b feature/<issue_number>_<description>`
3. **Move Changes**: Use `git stash`/`git cherry-pick`
4. **Follow Workflow**: Continue with proper commits, push, PR
5. **Document**: Update documentation if workflow was bypassed

## Best Practices

### Branch Management
- Keep branches focused on single issues
- Regularly update from main: `git pull origin main`
- Delete merged branches: `git branch -d feature/<issue>`

### Commit Hygiene
- Small, focused commits
- Clear, descriptive messages
- Reference issues: `feat: implement #123`
- Follow conventional commit standards

### Pull Request Standards
- Clear title and description
- Reference related issues
- Include testing instructions
- Link to documentation updates

## Integration with Mistral Vibe

### Automatic Detection
The system detects GitHub issue work when:
- Issue numbers are referenced (`#123`)
- GitHub issue URLs are mentioned
- Issue-related commands are used

### Skill Commands
```bash
# Manually trigger workflow
vibe github start-issue-workflow <issue_number>

# Create PR for current branch
vibe github create-pr "<description>"

# Update issue progress
vibe github update-issue <issue_number> "<status>"
```

## Troubleshooting

### Hook Not Working
```bash
# Check hook permissions
chmod +x .git/hooks/pre-commit

# Test hook manually
.vibe/scripts/test_hook.sh
```

### Skill Not Available
```bash
# Check skill configuration
grep "enabled" .vibe/config.toml

# Manually follow workflow
.vibe/scripts/start_github_workflow.sh <issue> <description>
```

## Advanced Usage

### Custom Workflows
Modify `.vibe/config.toml` to customize:
- Branch naming patterns
- Commit message formats
- PR title templates
- Issue update frequency

### Batch Operations
```bash
# Process multiple issues
for issue in 123 124 125; do
  .vibe/scripts/start_github_workflow.sh $issue "description"
done
```

## Security & Permissions

- Respects repository permissions
- No hardcoded credentials
- Uses GitHub API with proper authentication
- Minimal API calls for efficiency

## Performance Optimization

- Batch operations where possible
- Caching of common responses
- Minimal API calls
- Efficient token usage