#!/usr/bin/env node
/**
 * check-push-review.js
 *
 * VS Code Copilot PostToolUse hook.
 * Fires after the agent runs any shell command via the execute tool.
 * If the command was a `git push`, captures the diff of the pushed commits
 * and triggers a background review via the Reviewer agent.
 *
 * Hook output format (stdout):
 *   { "systemMessage": "..." }  — injected into the agent's context
 *
 * Exit codes:
 *   0 = success / no action needed
 *   Non-0 = non-blocking warning (does not abort the session)
 */

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

let rawInput = '';
process.stdin.on('data', chunk => { rawInput += chunk; });
process.stdin.on('end', () => {
  let toolData;
  try {
    toolData = JSON.parse(rawInput);
  } catch {
    process.exit(0);
  }

  // Extract the command that was executed
  const command =
    toolData?.toolInput?.command ||
    toolData?.toolInput?.cmd ||
    toolData?.input?.command ||
    '';

  // Only act on git push commands
  if (!/\bgit\s+push\b/.test(command)) {
    process.exit(0);
  }

  // Get the diff of the most recently pushed commits (HEAD~1..HEAD)
  const repoRoot = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  }).stdout.trim();

  if (!repoRoot) process.exit(0);

  const diffResult = spawnSync('git', ['diff', 'HEAD~1..HEAD', '--stat', '--diff-filter=ACMRT'], {
    encoding: 'utf8',
    cwd: repoRoot,
  });

  const diffStat = diffResult.stdout.trim();
  if (!diffStat) {
    process.exit(0);
  }

  // Write diff to a temp file for the review script to consume
  const timestamp = Date.now();
  const reviewsDir = path.join(repoRoot, '.git', 'reviews');
  fs.mkdirSync(reviewsDir, { recursive: true });

  const diffFile = path.join(reviewsDir, `review_${timestamp}.diff`);
  const fullDiff = spawnSync('git', ['diff', 'HEAD~1..HEAD'], {
    encoding: 'utf8',
    cwd: repoRoot,
  }).stdout;

  fs.writeFileSync(
    diffFile,
    `=== ConnectHub Code Review (PostToolUse Hook) ===\nDate: ${new Date().toISOString()}\nCommand: ${command}\n\n--- Stat ---\n${diffStat}\n\n--- Full Diff ---\n${fullDiff}`,
  );

  // Launch review-diff.js in the background (non-blocking)
  const reviewScript = path.join(repoRoot, 'scripts', 'review-diff.js');
  if (fs.existsSync(reviewScript)) {
    const child = spawnSync('node', [reviewScript, diffFile], {
      detached: true,
      stdio: 'ignore',
      cwd: repoRoot,
    });
  }

  // Inject a message into the agent's context so the user is aware
  const reviewOutputFile = diffFile.replace(/\.diff$/, '_review.md');
  const output = {
    systemMessage: `\n🔍 **Code review triggered** for the pushed commits.\nDiff saved: \`${diffFile}\`\nReview output (when ready): \`${reviewOutputFile}\`\nYou can also ask **@Reviewer** directly to review the latest diff.`,
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
});
