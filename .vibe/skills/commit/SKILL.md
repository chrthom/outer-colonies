---
name: commit
description: Add relevant changes, commit them and push the changes on the current branch
user-invocable: true
---

# Commit Skill

## Purpose
Provide a structured workflow for committing changes following conventional commit format and pushing to the current branch.

## When to Use
- When you need to commit and push changes to the current branch
- When following conventional commit format is required
- When you want to automate the git workflow

## Workflow

### 1. Check Current Status
First, check the current git status to understand what changes are available:

```bash
git status
```

### 2. Stage Relevant Changes
Add relevant changes to the staging area. Be selective about what to include:

```bash
# For specific files:
git add <file1> <file2>

# For all changes (use with caution):
git add -A
```

### 3. Create Conventional Commit
Follow the conventional commit format for the commit message:

```bash
git commit -m "<type>(<scope>): <description>"

Co-Authored-By: OpenClaude (devstral-latest) <openclaude@gitlawb.com>
```

#### Conventional Commit Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

### 4. Push Changes
Push the committed changes to the current branch:

```bash
git push
```

### 5. Verify Push
Check that the push was successful:

```bash
git status
```

## Gotchas
- **Critical**: Always review changes before committing
- **Critical**: Follow conventional commit format strictly
- Ensure you're on the correct branch before pushing
- Never commit sensitive files (check .gitignore)
- Run quality checks before committing: `npm run format && npm run lint && npm run test`

## Quality Validation
Before committing, ensure all quality checks pass:

```bash
npm run format && npm run lint && npm run test
```

If any checks fail, fix the issues before proceeding with the commit.