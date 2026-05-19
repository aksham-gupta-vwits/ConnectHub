#!/usr/bin/env node
/**
 * pre-push (node) — ConnectHub git pre-push hook
 *
 * Git hooks support shebang lines. This script runs via Node.js
 * which is available on all platforms (Windows, Linux, macOS).
 *
 * Installed by: npm run hooks:install  OR  pwsh scripts\install-hooks.ps1
 */

'use strict';

const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const remote = process.argv[2] || '';
const url    = process.argv[3] || '';

const repoRoot    = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout.trim();
const gitDir      = spawnSync('git', ['rev-parse', '--git-dir'],       { encoding: 'utf8' }).stdout.trim();
const reviewScript = path.join(repoRoot, 'scripts', 'review-diff.js');
const reviewsDir   = path.join(gitDir, 'reviews');

if (!fs.existsSync(reviewScript)) process.exit(0);
fs.mkdirSync(reviewsDir, { recursive: true });

const rl = readline.createInterface({ input: process.stdin, terminal: false });
const lines = [];

rl.on('line', line => lines.push(line.trim()));
rl.on('close', () => {
  for (const line of lines) {
    const parts = line.split(' ');
    if (parts.length < 4) continue;

    const [localRef, localSha, remoteRef, remoteSha] = parts;
    const ZERO = '0000000000000000000000000000000000000000';

    if (localSha === ZERO) continue; // branch deletion

    const range = remoteSha === ZERO ? localSha : `${remoteSha}..${localSha}`;

    const stat = spawnSync('git', ['diff', '--stat', range], { encoding: 'utf8' }).stdout.trim();
    if (!stat) continue;

    const timestamp = Date.now();
    const diffFile  = path.join(reviewsDir, `review_${timestamp}.diff`);
    const fullDiff  = spawnSync('git', ['diff', range], { encoding: 'utf8' }).stdout;

    const content = [
      '=== ConnectHub Code Review Request ===',
      `Remote : ${remote} (${url})`,
      `Branch : ${localRef} → ${remoteRef}`,
      `Range  : ${range}`,
      `Date   : ${new Date().toISOString()}`,
      '',
      '--- Changed Files ---',
      stat,
      '',
      '--- Full Diff ---',
      fullDiff,
    ].join('\n');

    fs.writeFileSync(diffFile, content);

    // Launch review in background — non-blocking
    const child = spawn(process.execPath, [reviewScript, diffFile], {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
      cwd: repoRoot,
    });
    child.unref();

    const reviewOutput = diffFile.replace(/\.diff$/, '_review.md');
    process.stderr.write('\n');
    process.stderr.write('🔍 Code review requested (running in background)\n');
    process.stderr.write(`   Diff  : ${diffFile}\n`);
    process.stderr.write(`   Review: ${reviewOutput}  (ready shortly)\n`);
    process.stderr.write('   Tip   : Open in VS Code and ask @Reviewer to review if needed.\n');
    process.stderr.write('\n');
  }

  process.exit(0);
});
