--- 
name: github-pr
description: Instruction to follow, when instructed to create or work on an existing GitHub pull request
user-invocable: true
---

# GitHub Pull Request Skill

This skill provides instructions for working on GitHub pull requests in a structured manner.

## When to use

- Should work on an GitHub pull request (references e.g. PR #567)
- Check for a failing GitHub Actions checks
- Create pull requests
- Check review comments in a pull request

## Systematic Workflow

### 1. Fetch GitHub pull request
Use the GitHub API to fetch PR details:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}
```

**Note**: First determine the correct repository owner and name by checking the git remote:
```bash
cd /path/to/repo && git remote -v
```

### 2. Checkout PR branch
Locally checkout the branch that the PR is using

### 3. Check all unresolved comments

**Step 3.1: Fetch all PR-level comments**
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments > pr_comments.json
```

**Step 3.2: Fetch all reviews (handle pagination)**
```bash
# Fetch all reviews with pagination support
reviews_file="all_reviews.json"
echo "[]" > $reviews_file
page=1
while true; do
  response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/reviews?page=$page&per_page=100")
  
  # Check if response is empty or invalid
  if [ -z "$response" ] || [ "$response" = "[]" ]; then
    break
  fi
  
  # Append to our file
  jq -s '.[0] + .[1]' $reviews_file <(echo "$response") > temp.json && mv temp.json $reviews_file
  
  # Check if we have less than 100 items (last page)
  length=$(echo "$response" | jq 'length')
  if [ "$length" -lt 100 ]; then
    break
  fi
  
  ((page++))
done
```

**Step 3.3: Extract all review IDs with state "COMMENTED"**
```bash
review_ids=$(jq -r '[.[] | select(.state == "COMMENTED") | .id] | .[]' all_reviews.json)
```

**Step 3.4: Fetch comments for each review**
```bash
all_comments_file="all_unresolved_comments.json"
echo "[]" > $all_comments_file

for review_id in $review_ids; do
  echo "Fetching comments for review $review_id..."
  
  # Handle pagination for review comments
  page=1
  while true; do
    response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/reviews/$review_id/comments?page=$page&per_page=100")
    
    if [ -z "$response" ] || [ "$response" = "[]" ]; then
      break
    fi
    
    # Filter for unresolved comments (resolved_at == null) and non-responses (body doesn't start with @)
    filtered=$(echo "$response" | jq '[.[] | select(.resolved_at == null and (.body | startswith("@") | not))]')
    
    # Append to our master file
    jq -s '.[0] + .[1]' $all_comments_file <(echo "$filtered") > temp.json && mv temp.json $all_comments_file
    
    # Check if last page
    length=$(echo "$response" | jq 'length')
    if [ "$length" -lt 100 ]; then
      break
    fi
    
    ((page++))
  done
done
```

**Step 3.5: Combine PR-level and review comments**
```bash
# Filter PR-level comments for unresolved, non-response comments
pr_filtered=$(jq '[.[] | select(.resolved_at == null and (.body | startswith("@") | not))]' pr_comments.json)

# Combine with review comments
jq -s '.[0] + .[1]' <(echo "$pr_filtered") $all_comments_file > final_unresolved_comments.json

# Get count
total_unresolved=$(jq 'length' final_unresolved_comments.json)
echo "Found $total_unresolved unresolved comments that need attention"
```

### 4. Verify and display all unresolved comments

**Step 4.1: Display summary of all unresolved comments**
```bash
echo "=== UNRESOLVED COMMENTS SUMMARY ==="
jq -r '.[] | "ID: \(.id) | Path: \(.path) | Comment: \(.body[0:80])" + if (.body | length > 80) then "..." else "" end' final_unresolved_comments.json
```

**Step 4.2: Create detailed report**
```bash
report_file="comment_report.txt"
echo "UNRESOLVED COMMENTS REPORT - $(date)" > $report_file
echo "=================================" >> $report_file
echo "Total: $total_unresolved comments" >> $report_file
echo "" >> $report_file

jq -r '.[] | "Comment ID: \(.id)", "File: \(.path)", "Line: \(.original_line // "N/A")", "Comment:", \(.body), "---"' final_unresolved_comments.json >> $report_file

cat $report_file
```

**Step 4.3: Verify no duplicates**
```bash
unique_count=$(jq 'unique_by(.id) | length' final_unresolved_comments.json)
if [ $total_unresolved -ne $unique_count ]; then
  echo "ERROR: Duplicate comments found! Total: $total_unresolved, Unique: $unique_count"
  exit 1
fi
```

### 5. Create ToDos Systematically

**Step 5.1: Generate todos from JSON file**
```bash
todos_file="generated_todos.json"
echo "[]" > $todos_file

# Generate implementation and response todos for each comment
jq -r '.[] | "IMPLEMENT:\nAddress comment \(.id): \(.body[0:50] | gsub("[\"\\]\"; "") | gsub("\\n"; " ")) - \(.path)", "RESPOND:\nRespond to comment \(.id)"' final_unresolved_comments.json | 
while read -r impl_todo; read -r resp_todo; do
  # Extract comment ID from implementation todo
  comment_id=$(echo "$impl_todo" | grep -oP 'Address comment \K[0-9]+')
  
  # Create implementation todo
  impl_json=$(jq -n --arg id "impl_$comment_id" --arg content "$impl_todo" --arg status "pending" --arg priority "high" 
    '{id: $id, content: $content, status: $status, priority: $priority}')
  
  # Create response todo  
  resp_json=$(jq -n --arg id "resp_$comment_id" --arg content "$resp_todo" --arg status "pending" --arg priority "medium" 
    '{id: $id, content: $content, status: $status, priority: $priority}')
  
  # Append to todos file
  jq -s '.[0] + [.[1]] + [.[2]]' $todos_file <(echo "$impl_json") <(echo "$resp_json") > temp.json && mv temp.json $todos_file
done

# Add quality assurance todos
qa_todos='[
  {"id": "qa_format", "content": "Run format, lint, and test", "status": "pending", "priority": "high"},
  {"id": "qa_github", "content": "Check GitHub Actions status", "status": "pending", "priority": "high"}
]' 
jq -s '.[0] + .[1]' $todos_file <(echo "$qa_todos") > temp.json && mv temp.json $todos_file
```

**Step 5.2: Display and verify todos**
```bash
echo "=== GENERATED TODOS ==="
jq -r '.[] | "[\(.priority)] \(.id): \(.content)"' $todos_file

expected_impl_count=$total_unresolved
expected_resp_count=$total_unresolved
actual_impl_count=$(jq '[.[] | select(.content | startswith("Address comment"))] | length' $todos_file)
actual_resp_count=$(jq '[.[] | select(.content | startswith("Respond to comment"))] | length' $todos_file)

if [ $actual_impl_count -ne $expected_impl_count ] || [ $actual_resp_count -ne $expected_resp_count ]; then
  echo "ERROR: Todo count mismatch!"
  echo "Expected $expected_impl_count implementation todos, got $actual_impl_count"
  echo "Expected $expected_resp_count response todos, got $actual_resp_count"
  exit 1
fi
```

**Step 5.3: Load todos into system**
```bash
# Display the final todos file for manual verification
echo "Final todos to be loaded:"
cat $todos_file | jq .

# Note: Use the todo tool to load these into the system
# todo write --file $todos_file
```

### 5.2 Comment Processing Flow

```
START
  │
  ├─ Fetch all PR comments
  │    │
  │    ├─ Filter: resolved_at == null
  │    │    │
  │    │    ├─ Filter: body does NOT start with "@"
  │    │    │    │
  │    │    │    ├─ For EACH comment:
  │    │    │    │    ├─ Create implementation todo
  │    │    │    │    ├─ Create response todo
  │    │    │    │    └─ Create verification todo
  │    │    │    │
  │    │    │    └─ END FOR
  │    │    │
  │    │    └─ END FILTER
  │    │
  │    └─ END FILTER
  │
  ├─ Fetch all reviews with state == "COMMENTED"
  │    │
  │    ├─ For EACH review:
  │    │    ├─ Fetch review comments
  │    │    │    │
  │    │    │    ├─ Filter: resolved_at == null
  │    │    │    │    │
  │    │    │    │    ├─ Filter: body does NOT start with "@"
  │    │    │    │    │    │
  │    │    │    │    │    ├─ For EACH comment:
  │    │    │    │    │    │    ├─ Create implementation todo
  │    │    │    │    │    │    ├─ Create response todo
  │    │    │    │    │    │    └─ Create verification todo
  │    │    │    │    │    │
  │    │    │    │    │    └─ END FOR
  │    │    │    │    │
  │    │    │    │    └─ END FILTER
  │    │    │    │
  │    │    │    └─ END FILTER
  │    │    │
  │    │    └─ END FOR
  │    │
  │    └─ END FOR
  │
  ├─ Add quality assurance todos
  ├─ Add GitHub Actions check todo
  │
  └─ END
```

### 6. Work on todos
Work on the created todos one by one.

#### 6.1 For todos that include implementation
- Run format, lint and test before git commit and git push.
- If lint or format do fail, fix them and run them again until they pass.

#### 6.2 For todos that include responding to a comment

Use the GitHub API to post responses:

```bash
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -d '{"body":"@<reviewer> I have addressed your comment by <describe changes>. Please review."}'
```

**Response Requirements:**
- Always mention the reviewer using @username
- Be specific about what was changed
- Keep responses professional and concise
- One response per comment (one API call per comment)
- Respond to EVERY unresolved comment, even if just to ask for clarification

**Response Verification:**
- Check that the response appears in GitHub UI
- Verify the comment thread shows as resolved

#### 6.3 For todos to check GitHub checks
Check all GitHub actions:

Fetch check runs:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/commits/{commit_sha}/check-runs
```

- If checks are still running, wait and fetch again after 15 seconds (wait up to 3 minutes in total for them to complete).
- For failing checks:
  - Fetch detailed logs
  - Parse error messages
  - Create specific todos for each failure
- **IMPORTANT**: Redo this step until all checks are passing. You are not done before all checks pass.

## Pre-Work Verification

Before starting any implementation work:

**Step 1: Verify comment collection completeness**
```bash
# Count from our collected file
todos_impl_count=$(jq '[.[] | select(.content | startswith("Address comment"))] | length' $todos_file)
todos_resp_count=$(jq '[.[] | select(.content | startswith("Respond to comment"))] | length' $todos_file)

if [ $todos_impl_count -ne $total_unresolved ] || [ $todos_resp_count -ne $total_unresolved ]; then
  echo "ERROR: Todo generation failed!"
  echo "Unresolved comments: $total_unresolved"
  echo "Implementation todos generated: $todos_impl_count"
  echo "Response todos generated: $todos_resp_count"
  exit 1
fi
```

**Step 2: Cross-verify with live API**
```bash
# Fetch current unresolved comments from API
current_unresolved=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments | \
  jq '[.[] | select(.resolved_at == null and (.body | startswith("@") | not))] | length')

# Fetch all reviews and their comments
current_review_unresolved=0
review_page=1
while true; do
  reviews_response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/reviews?page=$review_page&per_page=100")
  
  if [ -z "$reviews_response" ] || [ "$reviews_response" = "[]" ]; then
    break
  fi
  
  review_ids=$(echo "$reviews_response" | jq -r '[.[] | select(.state == "COMMENTED") | .id] | .[]')
  for review_id in $review_ids; do
    comments_response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/reviews/$review_id/comments")
    review_unresolved=$(echo "$comments_response" | jq '[.[] | select(.resolved_at == null and (.body | startswith("@") | not))] | length')
    current_review_unresolved=$((current_review_unresolved + review_unresolved))
  done
  
  length=$(echo "$reviews_response" | jq 'length')
  if [ "$length" -lt 100 ]; then
    break
  fi
  
  ((review_page++))
done

total_current_unresolved=$((current_unresolved + current_review_unresolved))

if [ $total_current_unresolved -ne $total_unresolved ]; then
  echo "WARNING: Comment count mismatch between collection and live API!"
  echo "Collected: $total_unresolved"
  echo "Live API: $total_current_unresolved"
  echo "This might indicate new comments were added or some were resolved since collection."
  echo "Consider re-running the collection process."
fi
```

**Step 3: Branch Verification**
```bash
current_branch=$(git rev-parse --abbrev-ref HEAD)
expected_branch=$(jq -r '.head.ref' pr_details.json 2>/dev/null || echo "{pr_branch_name}")

if [ "$current_branch" != "$expected_branch" ]; then
  echo "ERROR: Not on correct branch. Expected $expected_branch, got $current_branch"
  exit 1
fi
```

**Step 4: Clean Working Directory**
```bash
if ! git diff --quiet; then
  echo "ERROR: Working directory has uncommitted changes"
  git status
  exit 1
fi
```

**Step 5: Verify file accessibility**
```bash
# Check that all files mentioned in comments exist and are readable
missing_files=()
for file in $(jq -r '.[] | .path' final_unresolved_comments.json | sort -u); do
  if [ ! -f "$file" ]; then
    missing_files+=("$file")
  fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
  echo "WARNING: The following files mentioned in comments don't exist locally:"
  printf '  - %s\n' "${missing_files[@]}"
  echo "This might be expected for new files that need to be created."
fi
```

## Error Handling and Best Practices

### Rate Limit Handling
```bash
# Check rate limits before making API calls
rate_limit_info=$(curl -s -I -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number} | \
  grep -i "X-RateLimit-")

echo "Rate Limit Info:"
echo "$rate_limit_info"

remaining=$(echo "$rate_limit_info" | grep -oP 'X-RateLimit-Remaining: \K\d+')
reset_time=$(echo "$rate_limit_info" | grep -oP 'X-RateLimit-Reset: \K\d+')

if [ "$remaining" -lt 50 ]; then
  echo "WARNING: Low rate limit remaining: $remaining"
  reset_in=$((reset_time - $(date +%s)))
  if [ $reset_in -gt 0 ]; then
    echo "Rate limit resets in $reset_in seconds"
    if [ "$remaining" -lt 10 ]; then
      echo "Waiting for rate limit reset..."
      sleep $reset_in
    fi
  fi
fi
```

### API Error Handling
```bash
# Function to handle API calls with retries
api_call_with_retry() {
  local url="$1"
  local method="${2:-GET}"
  local data="${3:-}"
  local max_retries=3
  local retry_delay=5
  
  for ((retry=1; retry<=$max_retries; retry++)); do
    if [ "$method" = "GET" ]; then
      response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "$url")
    else
      response=$(curl -s -X "$method" -H "Authorization: token $GITHUB_TOKEN" -d "$data" "$url")
    fi
    
    # Check for API errors
    if echo "$response" | jq -e '.message' >/dev/null 2>&1; then
      error_message=$(echo "$response" | jq -r '.message')
      echo "API Error (attempt $retry/$max_retries): $error_message"
      
      # Check for rate limiting
      if echo "$error_message" | grep -qi "rate limit"; then
        reset_time=$(echo "$response" | jq -r '.headers["X-RateLimit-Reset"] // "0"')
        sleep_time=$((reset_time - $(date +%s) + 10))
        if [ $sleep_time -gt 0 ]; then
          echo "Rate limited. Waiting $sleep_time seconds..."
          sleep $sleep_time
        fi
      fi
      
      if [ $retry -lt $max_retries ]; then
        sleep $retry_delay
        retry_delay=$((retry_delay * 2))  # Exponential backoff
      else
        echo "Max retries reached. Failing."
        return 1
      fi
    else
      echo "$response"
      return 0
    fi
  done
}

# Usage example:
# comments=$(api_call_with_retry "https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments")
```

### Data Validation
```bash
# Validate that collected data is not empty
if [ ! -s "final_unresolved_comments.json" ] || [ "$(jq 'length' final_unresolved_comments.json)" = "0" ]; then
  echo "ERROR: No comments collected. This might indicate:"
  echo "  - All comments are already resolved"
  echo "  - API access issues"
  echo "  - Incorrect filtering"
  exit 1
fi

# Validate JSON structure
if ! jq empty final_unresolved_comments.json 2>/dev/null; then
  echo "ERROR: Invalid JSON in final_unresolved_comments.json"
  exit 1
fi
```

### Cleanup and Recovery
```bash
# Cleanup temporary files on error
cleanup() {
  echo "Cleaning up temporary files..."
  rm -f pr_comments.json all_reviews.json all_unresolved_comments.json \
        final_unresolved_comments.json comment_report.txt generated_todos.json \
        temp.json pr_details.json
}

trap cleanup EXIT

# Recovery from partial failures
if [ -f "final_unresolved_comments.json" ] && [ $total_unresolved -gt 0 ]; then
  echo "Recovering from previous run..."
  # Continue from todo generation step
fi
```

### Debugging Tips
1. **Check API responses directly**: Use `curl -v` for verbose output
2. **Validate jq queries**: Test them separately on sample data
3. **Inspect intermediate files**: Check JSON files at each step
4. **Test with small datasets**: Use `jq 'limit(5; .[])'` to work with subsets
5. **Check GitHub UI**: Compare API results with what you see in the browser

### Common Issues and Solutions

**Issue: Missing comments in collection**
- **Cause**: Not handling pagination properly
- **Solution**: Always check response length and iterate through pages

**Issue: Duplicate comments**
- **Cause**: Same comment appearing in multiple reviews
- **Solution**: Use `unique_by(.id)` in jq to deduplicate

**Issue: Response comments included**
- **Cause**: Filter not working correctly
- **Solution**: Verify jq filter: `select(.resolved_at == null and (.body | startswith("@") | not))`

**Issue: Rate limiting**
- **Cause**: Too many API calls in short time
- **Solution**: Add delays, check rate limits, consider caching

**Issue: File paths don't match**
- **Cause**: Local repo structure differs from GitHub
- **Solution**: Normalize paths, handle different separators
