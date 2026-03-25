# .vibe Configuration and Workflow Guide

## MANDATORY GitHub Workflow

**ALL GitHub issue implementations MUST follow the GitHub workflow described in `skills/github_workflow.md`**

### Quick Reference

When working on any GitHub issue (e.g., "#568"):

```bash
# 1. Create feature branch
git checkout -b feature/<issue_number>_<slugified_description>

# 2. Implement changes
# ... make your code changes ...

# 3. Commit with conventional commit type
git add .
git commit -m "<type>: <description>"

# 4. Push to remote
git push origin feature/<issue_number>_<description>

# 5. Create Pull Request (manually via GitHub UI or CLI)

# 6. Return to main branch
git checkout main
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `chore`: Maintenance tasks
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/updates

### Branch Naming Convention
- Features: `feature/<issue_number>_<description>`
- Bugfixes: `bugfix/<issue_number>_<description>`

Examples:
- `feature/568_surrender_menu`
- `bugfix/451_card_validation`

### Enforcement

**Failure to follow this workflow will result in:**
1. Implementation rejection
2. Manual cleanup requirements
3. Documentation updates

### When in Doubt

Always check:
1. `config.toml` - Configuration settings
2. `skills/github_workflow.md` - Complete workflow documentation
3. This README - Quick reference

**Remember: The GitHub workflow is NOT optional for issue implementations!**