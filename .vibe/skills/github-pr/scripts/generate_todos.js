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
    status: "pending"
  });
  
  todos.push({
    id: `resp_${commentId}`,
    content: `Reply on GitHub in thread of comment ${commentId}`,
    status: "pending"
  });
});

todos.push(
  {id: "qa_quality", content: "Run format, lint, and test", status: "pending"},
  {id: "qa_github", content: "Check GitHub Actions status", status: "pending"},
  {id: "qa_cleanup", content: "Cleanup temporary files", status: "pending"}
);

fs.writeFileSync('generated_todos.json', JSON.stringify(todos, null, 2));
console.log(`Generated ${todos.length} todos`);