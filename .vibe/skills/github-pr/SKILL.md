--- 
name: github-pr
description: Instruction to follow, when instructed to work on GitHub pull request
user-invocable: true
---

# GitHub Pull Request Skill

This skill provides a workflow for working on GitHub pull requests.

## When to use

- Work on an existing GitHub pull request (e.g., PR #567)
- Address review comments systematically

## Workflow

### 1. Fetch PR Details
```bash
cd /path/to/repo && git remote -v
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number} > pr_details.json
```

### 2. Checkout PR Branch
```bash
git checkout {pr_branch_name}
```

### 3. Collect Unresolved Comments

```javascript
// save as collect_comments_graphql.js
const fs = require('fs');
const { execSync } = require('child_process');

async function collectCommentsWithGraphQL() {
  const owner = "{owner}";
  const repo = "{repo}";
  const prNumber = {pr_number};
  const token = process.env.GITHUB_TOKEN;
  
  const query = {
    query: `
      query {
        repository(owner: "${owner}", name: "${repo}") {
          pullRequest(number: ${prNumber}) {
            reviewThreads(first: 100) {
              nodes {
                isResolved
                comments(first: 100) {
                  nodes {
                    databaseId
                    body
                    path
                    line
                    author { login }
                    createdAt
                    updatedAt
                  }
                }
              }
            }
          }
        }
      }
    `
  };
  
  const response = JSON.parse(execSync(
    `curl -s -H "Authorization: bearer ${token}" \
     -H "Content-Type: application/json" \
     -d '${JSON.stringify(query)}' \
     https://api.github.com/graphql`
  ).toString());
  
  const unresolvedComments = [];
  
  try {
    const threads = response.data.repository.pullRequest.reviewThreads.nodes;
    threads.forEach(thread => {
      if (!thread.isResolved) {
        thread.comments.nodes.forEach(comment => {
          unresolvedComments.push({
            id: comment.databaseId,
            body: comment.body,
            path: comment.path,
            line: comment.line,
            author: comment.author.login,
            created_at: comment.createdAt,
            updated_at: comment.updatedAt
          });
        });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    console.log('Response:', JSON.stringify(response, null, 2));
  }
  
  fs.writeFileSync('unresolved_comments.json', JSON.stringify(unresolvedComments, null, 2));
  console.log(`Found ${unresolvedComments.length} unresolved comments`);
  
  return unresolvedComments;
}

collectCommentsWithGraphQL().catch(console.error);
```

### 4. Generate Todos

```javascript
// save as generate_todos.js
const fs = require('fs');

const comments = JSON.parse(fs.readFileSync('unresolved_comments.json', 'utf8'));
const todos = [];

comments.forEach(comment => {
  const commentId = comment.id;
  const shortBody = comment.body.substring(0, 60).replace(/["\\]/g, '').replace(/\n/g, ' ');
  
  todos.push({
    id: `impl_${commentId}`,
    content: `Address comment ${commentId}: ${shortBody} - ${comment.path}`,
    status: "pending",
    priority: "high"
  });
  
  todos.push({
    id: `resp_${commentId}`,
    content: `Reply to comment ${commentId} in GitHub`,
    status: "pending",
    priority: "medium"
  });
});

todos.push(
  {id: "qa_format", content: "Run format, lint, and test", status: "pending", priority: "high"},
  {id: "qa_github", content: "Check GitHub Actions status", status: "pending", priority: "high"}
);

fs.writeFileSync('generated_todos.json', JSON.stringify(todos, null, 2));
console.log(`Generated ${todos.length} todos`);
```

### 5. Load Todos
```bash
todo write --file generated_todos.json
```

### 6. Address Comments and Reply on GitHub

For each comment:

1. **Mark implementation todo as in_progress**
```bash
todo write --update '{"id": "impl_${commentId}", "status": "in_progress"}'
```

2. **Implement the required changes**

3. **Run quality checks**
```bash
npm run format && npm run lint && npm run test
```

4. **Reply to the comment on GitHub**

**IMPORTANT**: Always reply to comments in the same thread, never edit them or create new comments. Address the original author using `@username`.

```bash
# Post a reply in the same comment thread
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"body\": \"@${AUTHOR} [Your response explaining the changes made]\"}" \
  "https://api.github.com/repos/{owner}/{repo}/pulls/comments/${commentId}/replies"
```

- **CRITICAL**: Always post replies to comments in the same thread using the `/pulls/comments/{comment_id}/replies` endpoint
- **CRITICAL**: Never edit existing comments or create new top-level comments
- **CRITICAL**: Always address the original comment author using `@username` in replies

**Example reply format**:
```
@chrthom I have addressed your comment by [explain changes]. The changes include:
- [Change 1]
- [Change 2]

All tests pass and the functionality has been verified.
```

5. **Mark implementation todo as completed**
```bash
todo write --update '{"id": "impl_${commentId}", "status": "completed"}'
```

6. **Mark response todo as completed**
```bash
todo write --update '{"id": "resp_${commentId}", "status": "completed"}'
```

7. **Move to next comment**

## Notes

- Requires GitHub GraphQL API access with `repo` scope token
- Uses `isResolved` field for accurate comment resolution tracking
- Always verify generated todos before starting work
- Temporary files (`unresolved_comments.json`, `generated_todos.json`) should be cleaned up after use