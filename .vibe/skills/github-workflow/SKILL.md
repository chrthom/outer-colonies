---
name: github-workflow
description: Instruction to follow, when instructed to work on GitHub issue
user-invocable: true
---

# GitHub Workflow Skill for Outer Colonies

## Overview

This skill provides comprehensive GitHub workflow automation for the Outer Colonies project.

## Configuration

Configuration is handled in `.vibe/config.toml`. See the main configuration file for available options.

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

### Return to main Branch when done
- When feature branch is clean and all work is done switch back to main branch
- Use: `git checkout main`

## Error Handling & Recovery

For common issues and recovery procedures, use the helper script:

```bash
# Fix accidental commit to main branch
.vibe/skills/github-workflow/github_workflow_helper.sh fix-main-commit <issue_number>

# Rename branch
.vibe/skills/github-workflow/github_workflow_helper.sh rename-branch <old_name> <new_name>
```

### Correction Procedure

1. **Stop**: Immediately stop current work
2. **Use helper script**: Run appropriate recovery command
3. **Follow Workflow**: Continue with proper commits, push, PR
4. **Document**: Update documentation if workflow was bypassed

See the helper script for detailed recovery procedures.

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

### Helper Script

A comprehensive helper script is available for manual operations:

```bash
# Start workflow for issue #123 with description "card_validation"
.vibe/skills/github-workflow/github_workflow_helper.sh start-issue 123 card_validation

# Show all available commands
.vibe/skills/github-workflow/github_workflow_helper.sh help
```

### Skill Commands

```bash
# Manually trigger workflow for an issue
vibe github process-issue <issue_number>

# Create PR for current branch with description
vibe github create-pr "<description>"

# Update issue progress
vibe github update-issue <issue_number> "<status>"
```

For detailed command usage and options, refer to the skill's built-in help system.
