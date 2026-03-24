# Mistral Vibe Core Prompt for Outer Colonies

## Project Context
Outer Colonies is a web-based multiplayer card game with three subprojects:
- **website**: Angular frontend for user management and deck configuration
- **client**: Phaser 3 frontend for the actual card game
- **server**: Express + Socket.IO backend for both website and client

## Workflow Guidelines

### Branch Management
- Use `feature/<issue_number>_<description>` for new features
- Use `bugfix/<issue_number>_<description>` for bug fixes
- Always link branches to their corresponding GitHub issues

### Commit Standards
- Follow conventional commits with types: `enhancement`, `feature`, `bugfix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `git commit -m "feat: add card deck validation"

### Pre-Commit Checks
- Run `npm run format` to ensure code formatting
- Run `npm run lint` and fix any linting issues
- Run `npm run test` and address any test failures
- Verify documentation is updated for code changes

### Pull Requests
- Create a PR when feature development is complete
- PR name format: `<issue_id>: <description>`
- Ensure PRs include tests and documentation updates
- Review PRs for missing tests or documentation

### Issue Management
- Bug issues are labeled with `bug`
- Feature issues are labeled with `enhancement`, `feature`, or `internal`
- Update GitHub issues with progress comments when working on them
- For issues with subtasks (marked with `[ ]`), check them off as completed with `[x]` when done

### GitHub Issue Queries
- Use `web_fetch` to query GitHub issues directly from the repository
- Example query for issues with label "size - L" in milestone "3.0 Prometheus":
  ```
  https://github.com/chrthom/outer-colonies/issues?q=is%3Aopen+is%3Aissue+label%3A%22size+-+L%22+milestone%3A%223.0+Prometheus%22
  ```
- Common query parameters:
  - `is:open` - Only open issues
  - `is:issue` - Only issues (not PRs)
  - `label:"label name"` - Filter by label
  - `milestone:"milestone name"` - Filter by milestone

### Documentation
- Update `README.md` for significant changes
- Ensure code changes are reflected in documentation

## Subproject Coordination
- The `server` generates TypeScript declarations required by `website` and `client`
- Rebuild declarations after server interface changes:
  ```bash
  cd server
  npx tsc --declaration --emitDeclarationOnly
  cd ..
  ```

## Testing
- Ensure all tests pass before committing
- Add tests for new features or bug fixes
- Verify integration between subprojects

## Deployment
- Follow the deployment steps in `README.md`
- Ensure all checks (`lint`, `format`, `test`) pass before deploying
