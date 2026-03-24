#!/usr/bin/env node

const { execSync } = require('child_process');
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

const browser = isGitHubActions ? 'ChromeHeadless' : 'Chromium';
const watch = process.argv.includes('--watch');

let command = `ng test ${watch ? '' : '--watch=false --code-coverage'} --browsers=${browser}`;

console.log(`Running tests with ${browser}...`);
console.log(`Command: ${command}`);

try {
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status);
}