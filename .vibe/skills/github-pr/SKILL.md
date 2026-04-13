--- 
name: github-pr
description: Workflow for addressing GitHub pull request review comments
user-invocable: true
---

# GitHub Pull Request Skill

## Purpose
Systematically address PR review comments using a structured workflow.

## When to use
- Work on existing GitHub pull requests
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
// collect_comments_graphql.js
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
// generate_todos.js
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
    content: `Reply on GitHub in thread of comment ${commentId}`,
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

### 6. Process Comments

For each comment:

1. Mark todo as in_progress:
```bash
todo write --update '{"id": "impl_${commentId}", "status": "in_progress"}'
```

2. Implement required changes

3. Run quality checks:
```bash
npm run format && npm run lint && npm run test
```

4. Commit and push changes

5. Reply to comment:
```bash
# First, find the review ID for the comment
REVIEW_ID=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/{owner}/{repo}/pulls/${pr_number}/comments/${commentId}" | jq -r '.pull_request_review_id')

# Then reply to the comment in the review thread
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"body\": \"@${AUTHOR} [Explain changes made]\", \"in_reply_to\": ${commentId}}" \
  "https://api.github.com/repos/{owner}/{repo}/pulls/${pr_number}/reviews/${REVIEW_ID}/comments"
```

**CRITICAL**: Always reply in same thread using `@username`
**CRITICAL**: Never edit existing comments or create new top-level comments
**CRITICAL**: Use the review ID and in_reply_to field to ensure proper threading

6. Mark implementation todo as completed:
```bash
todo write --update '{"id": "impl_${commentId}", "status": "completed"}'
```

7. Mark response todo as completed:
```bash
todo write --update '{"id": "resp_${commentId}", "status": "completed"}'
```

8. Verify reply was posted:
```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/{owner}/{repo}/pulls/comments/${commentId}/replies" | jq '.[] | select(.body | contains("@${AUTHOR}"))'
```

### 7. Cleanup
Remove temporary files:
- collect_comments_graphql.js
- generate_todos.js
- generated_todos.json
- unresolved_comments.json
