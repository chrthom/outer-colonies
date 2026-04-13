--- 
name: github-pr
description: Instruction to follow, when instructed to work on GitHub pull request
user-invocable: true
---

# GitHub Pull Request Skill

This skill provides a simplified workflow for working on GitHub pull requests.

## When to use

- Work on an existing GitHub pull request (e.g., PR #567)
- Check for failing GitHub Actions checks
- Address review comments systematically

## Simplified Workflow

### 1. Fetch PR Details
```bash
# Get repository info
cd /path/to/repo && git remote -v

# Fetch PR details
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number} > pr_details.json
```

### 2. Checkout PR Branch
```bash
git checkout {pr_branch_name}
```

### 3. Collect Unresolved Comments (GraphQL API - Recommended)

For accurate resolution tracking, use the GitHub GraphQL API:

```javascript
// save as collect_comments_graphql.js
const fs = require('fs');
const { execSync } = require('child_process');

async function collectCommentsWithGraphQL() {
  const owner = "{owner}";
  const repo = "{repo}";
  const prNumber = {pr_number};
  const token = process.env.GITHUB_TOKEN;
  
  // GitHub GraphQL query to get unresolved review threads
  const query = `
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
                  author {
                    login
                  }
                  createdAt
                  updatedAt
                }
              }
            }
          }
        }
      }
    }
  `;
  
  // Execute GraphQL query
  const response = JSON.parse(execSync(
    `curl -s -H "Authorization: bearer ${token}" \
     -H "Content-Type: application/json" \
     -d '{"query": "${query.replace(/\\"/g, '\\\\"')}"}' \
     https://api.github.com/graphql`
  ).toString());
  
  // Extract unresolved comments from unresolved threads
  const unresolvedComments = [];
  
  try {
    const threads = response.data.repository.pullRequest.reviewThreads.nodes;
    
    threads.forEach(thread => {
      if (!thread.isResolved) {
        // This thread is unresolved, so all its comments are considered unresolved
        thread.comments.nodes.forEach(comment => {
          unresolvedComments.push({
            id: comment.databaseId,
            body: comment.body,
            path: comment.path,
            line: comment.line,
            author: comment.author.login,
            created_at: comment.createdAt,
            updated_at: comment.updatedAt,
            isResolved: false
          });
        });
      }
    });
  } catch (error) {
    console.error('Error parsing GraphQL response:', error);
    console.log('Full response:', JSON.stringify(response, null, 2));
  }
  
  fs.writeFileSync('unresolved_comments.json', JSON.stringify(unresolvedComments, null, 2));
  console.log(`Found ${unresolvedComments.length} truly unresolved comments via GraphQL`);
  
  return unresolvedComments;
}

collectCommentsWithGraphQL().catch(console.error);
```

Run it with:
```bash
node collect_comments_graphql.js
```

### 3. Alternative: REST API with Heuristics (Fallback)

If you cannot use GraphQL API, use this REST API version with temporal filtering:

```javascript
// save as collect_comments_rest.js
const fs = require('fs');
const { execSync } = require('child_process');

async function collectCommentsREST() {
  const owner = "{owner}";
  const repo = "{repo}";
  const prNumber = {pr_number};
  const token = process.env.GITHUB_TOKEN;
  
  // Fetch PR-level comments
  const prComments = JSON.parse(execSync(
    `curl -s -H "Authorization: token ${token}" \
     https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`
  ).toString());
  
  // Fetch review comments
  const reviewComments = JSON.parse(execSync(
    `curl -s -H "Authorization: token ${token}" \
     https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`
  ).toString());
  
  // Combine all comments
  const allComments = [...prComments, ...reviewComments];
  
  // Filter out responses (comments starting with @)
  const potentialComments = allComments.filter(comment => !comment.body.startsWith('@'));
  
  // Use temporal filtering as heuristic for REST API limitations
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const unresolvedComments = potentialComments.filter(comment => {
    const commentDate = new Date(comment.created_at);
    return commentDate > twentyFourHoursAgo;
  });
  
  fs.writeFileSync('unresolved_comments.json', JSON.stringify(unresolvedComments, null, 2));
  console.log(`Found ${unresolvedComments.length} recent comments via REST API (last 24 hours)`);
  console.log('Note: REST API cannot determine true resolution status - use GraphQL for accuracy');
  
  return unresolvedComments;
}

collectCommentsREST().catch(console.error);
```

Run it with:
```bash
node collect_comments_rest.js
```

### 4. Generate Todos (Simplified)

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
    content: `Respond to comment ${commentId}`,
    status: "pending",
    priority: "medium"
  });
});

// Add quality assurance
todos.push(
  {id: "qa_format", content: "Run format, lint, and test", status: "pending", priority: "high"},
  {id: "qa_github", content: "Check GitHub Actions status", status: "pending", priority: "high"}
);

fs.writeFileSync('generated_todos.json', JSON.stringify(todos, null, 2));
console.log(`Generated ${todos.length} todos`);
```

Run it with:
```bash
node generate_todos.js
```

### 5. Load Todos into System
```bash
# Use the todo tool to load
todo write --file generated_todos.json
```

## Key Improvements

### Fixed Issues:
1. **Accurate resolution tracking** - GraphQL API provides `isResolved` field
2. **Fallback option** - REST API with temporal filtering for limited access
3. **Better error handling** - Proper GraphQL response parsing
4. **Clear documentation** - Explains API limitations and workarounds

### API Comparison:

| Approach | Resolution Accuracy | Requirements | Complexity |
|----------|-------------------|--------------|------------|
| GraphQL | ✅ Perfect - uses `isResolved` field | Personal access token | Moderate |
| REST | ⚠️ Heuristic - temporal filtering | Basic auth | Simple |

### Best Practices:
1. **Use GraphQL when possible** - For accurate resolution status
2. **Fallback to REST** - When GraphQL is not available
3. **Document limitations** - Be clear about heuristic approaches
4. **Error handling** - Handle API response parsing carefully
5. **Conservative filtering** - Better to miss some than create false todos

## Important Limitations

### REST API Limitations:
- **No resolution tracking**: GitHub REST API doesn't include resolution status for review comments
- **Heuristic approach**: Temporal filtering is a practical workaround but not perfect
- **Manual verification needed**: Always review the generated todos

### GraphQL API Advantages:
- **Accurate resolution status**: `isResolved` field on review threads
- **Thread-level tracking**: Resolution applies to entire comment threads
- **Comprehensive data**: Includes all comment metadata in one query

## Verification

Before starting work:
1. Check todo count matches your expectation
2. Verify no duplicate comment IDs
3. Ensure you're on the correct branch
4. Confirm clean working directory

Base directory for this skill: /home/christopher/Dokumente/outer-colonies/.vibe/skills/github-pr