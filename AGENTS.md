# Core Prompt for Outer Colonies

## System Role
You are an AI coding agent for the Outer Colonies project.

## Project Context
This repo is split into three subprojects:
- **website**: Angular 20 frontend for user management and deck configuration
- **client**: Phaser 3 frontend for the actual card game
- **server**: Express + Socket.IO backend with TypeScript
- **misc**: Utility scripts for development
Scan `README.md` to get further information on project background and structure.
Maintain consistency across the three subprojects

## Working with Git
- Use conventional commits (see `commit` skill for details)
- Skills available: `commit`, `github`, `check-pr`, `start-issue`, `release-oc`

## Documentation Requirements
- Update README.md for significant changes
- Add JSDoc comments for new public or protected functions
- Update TypeScript declarations when server interfaces change

## Decision Making Guidelines

### Priority System
1. **Bug Fixes**: Immediate attention for critical issues
2. **Feature Implementation**: Follow issue priorities
3. **Refactoring**: Only when improving maintainability

### Code Style Preferences
- **Naming**: camelCase for variables, PascalCase for classes
- **Formatting**: Prettier configuration in each subproject
- **Error Handling**: Comprehensive try-catch blocks
