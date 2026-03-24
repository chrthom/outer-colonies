# Mistral Vibe Core Prompt for Outer Colonies

## Project Context
Outer Colonies is a web-based multiplayer card game with three subprojects:
- **website**: Angular frontend for user management and deck configuration
- **client**: Phaser 3 frontend for the actual card game  
- **server**: Express + Socket.IO backend for both website and client

## GitHub Workflow Automation
The **GitHub Workflow Skill** (`github_workflow`) automatically handles the complete development workflow:

### Automatic Processes
- **Branch Creation**: `feature/<issue_number>_<description>` or `bugfix/<issue_number>_<description>`
- **Commits**: Conventional commits (`feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`)
- **Push**: Automatic push to remote repository
- **PR Creation**: Pull Requests with format `<issue_id>: <description>`
- **Issue Updates**: Progress tracking and subtask completion

### Manual Override
All automatic processes can be overridden when needed.

## Issue Management
- Bug issues: labeled `bug`
- Feature issues: labeled `enhancement`, `feature`, or `internal`
- Subtasks: automatically marked `[x]` when completed

## Subproject Coordination
- Server generates TypeScript declarations for website and client
- Rebuild declarations: `cd server && npx tsc --declaration --emitDeclarationOnly`

## Quality Standards
- **Format**: `npm run format`
- **Lint**: `npm run lint`
- **Test**: `npm run test`
- **Documentation**: Update for all code changes

## GitHub Operations
- Issue queries via `web_fetch`
- Example: `https://github.com/chrthom/outer-colonies/issues?q=is%3Aopen+label%3A%22size+-+L%22`