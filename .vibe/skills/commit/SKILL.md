---
name: commit
description: Analyze changes, create conventional commit, and push to current branch
user-invocable: true
---

Commit and push the changes on this branch by following this workflow:

1. Load GitHub Skill for quality check utilities:
   ```bash
   source "$SKILL_DIR/../github/scripts/quality.sh"
   ```

2. Run quality checks for affected subprojects:
   ```bash
   check_all_affected
   ```
   This automatically checks which of `server/`, `client/`, `website/` contain changed files and runs format/lint/tests as needed.

3. Analyze all changes:
   ```bash
   git diff --stat
   ```

4. Determine commit type based on changes:
   - `feat`: New features or functionality added
   - `fix`: Bug fixes or corrections
   - `docs`: Documentation-only changes
   - `refactor`: Code structure changes without new features/bugfixes
   - `perf`: Performance improvements
   - `style`: Formatting, whitespace, semicolons, etc.
   - `test`: Adding or correcting tests
   - `chore`: Build process, dependencies, configuration changes

5. Generate commit message from the actual changes:
   - Extract scope from changed file paths (e.g., `server`, `client`, `website`)
   - Create description from diff summary (max 72 chars)
   - Format: `<type>(<scope>): <description>`
   - Use imperative mood, lowercase, no period at end

6. Stage, commit and push:
   ```bash
   git add --all && \
      git commit -m "<generated message>" && \
      git push
   ```

## Rules
- ALWAYS analyze `git diff` before generating the commit message
- ALWAYS use conventional commit format
- NEVER ask the user for the commit message
