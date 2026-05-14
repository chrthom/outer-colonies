---
name: commit
description: Analyze changes, create conventional commit, and push to current branch
user-invocable: true
---

# Commit Skill

## Workflow

1. **Identify affected subprojects**:
   ```bash
   git diff --name-only
   ```

   - Check which of `server/`, `client/`, `website/` contain changed files
   - Only proceed with quality checks for affected subprojects

2. **Determine if logic changed**:
   - Logic files: `.ts`, `.js`, `.py` (excluding `.spec.`, `.test.`, `*.d.ts`)
   - Non-logic files: `.md`, `.json`, `.yml`, `.yaml`, `.toml`, `.css`, `.html`

3. **Run quality checks per subproject** (only if subproject has package.json):
   ```bash
   cd <subproject> && npm run format && npm run lint
   ```
   Only if logic files changed in that subproject:
   ```bash
   cd <subproject> && npm run test
   ```

4. **Analyze all changes**:
   ```bash
   git diff --stat
   ```

5. **Determine commit type** based on changes:
   - `feat`: New features or functionality added
   - `fix`: Bug fixes or corrections
   - `docs`: Documentation-only changes
   - `refactor`: Code structure changes without new features/bugfixes
   - `perf`: Performance improvements
   - `style`: Formatting, whitespace, semicolons, etc.
   - `test`: Adding or correcting tests
   - `chore`: Build process, dependencies, configuration changes

6. **Generate commit message** from the actual changes:
   - Extract scope from changed file paths (e.g., `server`, `client`, `website`)
   - Create description from diff summary (max 72 chars)
   - Format: `<type>(<scope>): <description>`
   - Use imperative mood, lowercase, no period at end

7. **Stage, commit and push**:
   ```bash
   git add --all && \
      git commit -m "<generated message>" && \
      git push
   ```

## Rules
- ALWAYS analyze `git diff` before generating the commit message
- ALWAYS use conventional commit format
- NEVER ask the user for the commit message
- NEVER commit if quality checks fail
- NEVER commit sensitive files (respect .gitignore)
- Only run format/lint/test for subprojects with changed files
- Only run test if logic files changed in that subproject
