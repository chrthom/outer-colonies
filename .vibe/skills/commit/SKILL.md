---
name: commit
description: Analyze changes, create conventional commit, and push to current branch
user-invocable: true
---

Commit and push the changes on this branch by following this workflow:

1. Run quality checks per subproject (only if subproject has package.json):
   ```bash
   git diff --name-only
   ```
   - Check which of `server/`, `client/`, `website/` contain changed files
   - Only proceed with quality checks for affected subprojects
   ```bash
   cd <subproject> && npm run format && npm run lint
   ```

2. Analyze all changes:
   ```bash
   git diff --stat
   ```

3. Determine commit type based on changes:
   - `feat`: New features or functionality added
   - `fix`: Bug fixes or corrections
   - `docs`: Documentation-only changes
   - `refactor`: Code structure changes without new features/bugfixes
   - `perf`: Performance improvements
   - `style`: Formatting, whitespace, semicolons, etc.
   - `test`: Adding or correcting tests
   - `chore`: Build process, dependencies, configuration changes

4. Generate commit message from the actual changes:
   - Extract scope from changed file paths (e.g., `server`, `client`, `website`)
   - Create description from diff summary (max 72 chars)
   - Format: `<type>(<scope>): <description>`
   - Use imperative mood, lowercase, no period at end

5. Stage, commit and push:
   ```bash
   git add --all && \
      git commit -m "<generated message>" && \
      git push
   ```

## Rules
- ALWAYS analyze `git diff` before generating the commit message
- ALWAYS use conventional commit format
- NEVER ask the user for the commit message
