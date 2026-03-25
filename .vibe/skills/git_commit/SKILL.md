---
name: git_commit
description: Instructions for committing and pushing changes with conventional commits
user-invocable: true
---

# Git Commit Skill

## Overview
This skill provides instructions for committing and pushing changes using conventional commits and ensuring code quality.

## Steps to Follow

### 1. Pre-Commit Checks
- **Run Format**: Execute `npm run format` to ensure code is properly formatted.
- **Run Lint**: Execute `npm run lint` to check for linting issues.
- **Fix Lint Issues**: Resolve any linting issues before proceeding.
- **Run Tests**: Execute `npm run test` to ensure all tests pass.
- **Fix Test Failures**: Resolve any test failures before proceeding.

### 2. Commit Changes
- **Conventional Commits**: Use conventional commit messages (e.g., `feat: add new feature`, `fix: resolve bug`).
- **Commit Types**: Use the following commit types:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `chore`: Changes to the build process or auxiliary tools
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `test`: Adding missing tests or correcting existing tests

### 3. Push Changes
- **Push to Remote**: Push changes to the remote repository.
- **Stable State**: Ensure changes are in a stable state before pushing.

## Notes
- Always commit and push when a stable state is achieved.
- Ensure all changes are reviewed and tested before merging.