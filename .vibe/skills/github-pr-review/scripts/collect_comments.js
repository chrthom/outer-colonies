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
  
  fs.writeFileSync('/tmp/unresolved_comments.json', JSON.stringify(unresolvedComments, null, 2));
  console.log(`Found ${unresolvedComments.length} unresolved comments`);
  
  return unresolvedComments;
}

collectCommentsWithGraphQL().catch(console.error);