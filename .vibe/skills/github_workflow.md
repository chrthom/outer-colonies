# GitHub Workflow Skill for Outer Colonies

## Purpose
This skill automates the complete GitHub workflow including branch creation, commits, pushes, PR creation, and issue updates.

## Configuration

```toml
[skills.github_workflow]
enabled = true
auto_branch_creation = true
auto_commit_push = true
auto_pr_creation = true
auto_issue_update = true
default_commit_type = "feat"
```

## Workflow Automation

### 1. Branch Creation
- Automatically creates branches following format: `feature/<issue_number>_<description>` or `bugfix/<issue_number>_<description>`
- Links branches to corresponding GitHub issues

### 2. Commit Management
- Automatically creates conventional commits
- Commit types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`
- Commit messages follow format: `<type>: <description>`

### 3. Push to Remote
- Automatically pushes changes to the remote repository
- Handles authentication and error recovery

### 4. Pull Request Creation
- Automatically creates PRs when feature development is complete
- PR name format: `<issue_id>: <description>`
- Automatically links PR to the original issue
- Includes proper description with implementation details

### 5. Issue Management
- Automatically updates GitHub issues with progress
- Marks subtasks as completed ([x]) when done
- Adds comments with links to PRs
- Updates issue status based on implementation progress

## Usage

### Automatic Mode (Recommended)
The skill automatically triggers when:
1. Working on a GitHub issue
2. Changes are made to the codebase
3. Feature implementation is complete

### Manual Mode
```bash
# Create branch for issue #123
vibe github create-branch 123 "implement-card-validation"

# Create PR for current branch
vibe github create-pr "Implement card validation"

# Update issue #123 with progress
vibe github update-issue 123 "Implementation complete, PR #456 created"
```

## Implementation Details

### Branch Naming
- Features: `feature/<issue_number>_<slugified_description>`
- Bugfixes: `bugfix/<issue_number>_<slugified_description>`

### Commit Standards
- Follows conventional commits specification
- Automatic commit message generation based on changes

### PR Standards
- Automatic PR title generation
- Includes issue reference for auto-closing
- Adds implementation summary to PR description

### Issue Updates
- Progress comments with emoji indicators
- Subtask management with [x] completion markers
- Automatic linking to created PRs

## Error Handling
- Automatic retry on network failures
- Graceful degradation to manual mode
- Detailed error reporting

## Security
- Uses GitHub API with proper authentication
- Respects repository permissions
- No hardcoded credentials

## Token Optimization
- Minimal API calls
- Batch operations where possible
- Caching of common responses