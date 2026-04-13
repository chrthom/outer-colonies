--- 
name: github-pr
description: Instruction to follow, when instructed to create or work on an existing GitHub pull request
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

### 3. Collect Unresolved Comments (Simplified)

Use this Node.js script to avoid complex bash/jq issues:

```javascript
// save as collect_comments.js
const fs = require('fs');
const { execSync } = require('child_process');

async function collectComments() {
  const owner = "{owner}";
  const repo = "{repo}";
  const prNumber = {pr_number};
  const token = process.env.GITHUB_TOKEN;
  
  // Fetch PR-level comments
  const prComments = JSON.parse(execSync(
    `curl -s -H "Authorization: token ${token}" \
     https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`
  ).toString());
  
  // Fetch all reviews
  const allReviews = [];
  let page = 1;
  while (true) {
    const reviews = JSON.parse(execSync(
      `curl -s -H "Authorization: token ${token}" \
       https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews?page=${page}&per_page=100`
    ).toString());
    
    if (!reviews.length) break;
    allReviews.push(...reviews);
    
    if (reviews.length < 100) break;
    page++;
  }
  
  // Collect all unresolved comments
  const unresolvedComments = [];
  
  // Add PR-level unresolved comments
  prComments.forEach(comment => {
    if (!comment.resolved_at && !comment.body.startsWith('@')) {
      unresolvedComments.push(comment);
    }
  });
  
  // Add review comments
  const commentedReviews = allReviews.filter(r => r.state === 'COMMENTED');
  for (const review of commentedReviews) {
    let reviewPage = 1;
    while (true) {
      const reviewComments = JSON.parse(execSync(
        `curl -s -H "Authorization: token ${token}" \
         https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews/${review.id}/comments?page=${reviewPage}&per_page=100`
      ).toString());
      
      if (!reviewComments.length) break;
      
      reviewComments.forEach(comment => {
        if (!comment.resolved_at && !comment.body.startsWith('@')) {
          unresolvedComments.push(comment);
        }
      });
      
      if (reviewComments.length < 100) break;
      reviewPage++;
    }
  }
  
  // Remove duplicates by ID
  const uniqueComments = Array.from(new Map(
    unresolvedComments.map(c => [c.id, c])
  ).values());
  
  fs.writeFileSync('unresolved_comments.json', JSON.stringify(uniqueComments, null, 2));
  console.log(`Found ${uniqueComments.length} unresolved comments`);
  
  return uniqueComments;
}

collectComments().catch(console.error);
```

Run it with:
```bash
node collect_comments.js
```

### 4. Generate Todos (Simplified)

```javascript
// save as generate_todos.js
const fs = require('fs');

const comments = JSON.parse(fs.readFileSync('unresolved_comments.json', 'utf8'));
const todos = [];

comments.forEach(comment => {
  const commentId = comment.id;
  const shortBody = comment.body.substring(0, 60).replace(/[\"\\]/g, '').replace(/\n/g, ' ');
  
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
1. **No more duplicate todos** - Proper deduplication using Map
2. **Simplified API calls** - Using Node.js instead of complex bash/jq
3. **Better error handling** - Native JavaScript error handling
4. **No quoting/escaped issues** - Avoids bash command substitution problems

### Simplified Workflow:
- Reduced from 500+ lines to ~100 lines
- Uses reliable Node.js scripts instead of error-prone bash
- Clear separation of concerns
- Easier to maintain and debug

### Best Practices:
1. **Always deduplicate** - Use `Array.from(new Map(values))` pattern
2. **Check for resolved comments** - Filter by `resolved_at == null`
3. **Exclude responses** - Filter out comments starting with `@`
4. **Use proper tools** - Node.js for complex JSON manipulation
5. **Keep it simple** - Avoid over-engineering the workflow

## Error Handling

### Common Issues:
- **Rate limiting**: Add `sleep` between API calls if needed
- **Network errors**: Wrap API calls in try/catch
- **Invalid JSON**: Validate responses before parsing
- **Duplicate IDs**: Always deduplicate by comment ID

## Verification

Before starting work:
1. Check todo count matches comment count
2. Verify no duplicate comment IDs
3. Ensure you're on the correct branch
4. Confirm clean working directory
