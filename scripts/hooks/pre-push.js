#!/usr/bin/env node
/**
 * pre-push (node) - ConnectHub git pre-push hook
 * Cross-platform (Windows/Linux/macOS). Installed by: pwsh scripts\install-hooks.ps1
 *
 * Compares HEAD against the remote tracking branch and triggers a background
 * code review via review-diff.js. Non-blocking: push always proceeds.
 */

'use strict';

const { spawnSync, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');

const remote = process.argv[2] || 'origin';
const url    = process.argv[3] || '';

const repoRoot     = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout.trim();
const gitDir       = spawnSync('git', ['rev-parse', '--git-dir'],       { encoding: 'utf8' }).stdout.trim();
const reviewScript = path.join(repoRoot, 'scripts', 'review-diff.js');
const reviewsDir   = path.join(gitDir, 'reviews');

if (!fs.existsSync(reviewScript)) process.exit(0);
fs.mkdirSync(reviewsDir, { recursive: true });

const branch   = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'],                     { encoding: 'utf8' }).stdout.trim();
const localSha = spawnSync('git', ['rev-parse', 'HEAD'],                                      { encoding: 'utf8' }).stdout.trim();

// Prefer tracking branch diff; fall back to HEAD~1 for new branches
const tracking = spawnSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { encoding: 'utf8' });
let range;
if (tracking.status === 0 && tracking.stdout.trim()) {
  const remoteSha = spawnSync('git', ['rev-parse', tracking.stdout.trim()], { encoding: 'utf8' }).stdout.trim();
  range = remoteSha ? remoteSha + '..' + localSha : localSha;
} else {
  const parent = spawnSync('git', ['rev-parse', 'HEAD~1'], { encoding: 'utf8' });
  range = parent.status === 0 ? parent.stdout.trim() + '..' + localSha : localSha;
}

const stat = spawnSync('git', ['diff', '--stat', range], { encoding: 'utf8' }).stdout.trim();
if (!stat) process.exit(0);

const timestamp  = Date.now();
const diffFile   = path.join(reviewsDir, 'review_' + timestamp + '.diff');
const fullDiff   = spawnSync('git', ['diff', range], { encoding: 'utf8' }).stdout;

fs.writeFileSync(diffFile, [
  '=== ConnectHub Code Review Request ===',
  'Remote : ' + remote + ' (' + url + ')',
  'Branch : ' + branch,
  'Range  : ' + range,
  'Date   : ' + new Date().toISOString(),
  '',
  '--- Changed Files ---',
  stat,
  '',
  '--- Full Diff ---',
  fullDiff,
].join('\n'));

const child = spawn(process.execPath, [reviewScript, diffFile], {
  detached: true,
  stdio: ['ignore', 'ignore', 'ignore'],
  cwd: repoRoot,
});
child.unref();

const reviewOutput = diffFile.replace(/\.diff$/, '_review.md');
process.stderr.write('\n');
process.stderr.write('Code review requested (running in background)\n');
process.stderr.write('   Branch: ' + branch + '\n');
process.stderr.write('   Diff  : ' + diffFile + '\n');
process.stderr.write('   Review: ' + reviewOutput + '  (ready shortly)\n');
process.stderr.write('   Tip   : Open in VS Code and ask @Reviewer to review if needed.\n');
process.stderr.write('\n');

process.exit(0);