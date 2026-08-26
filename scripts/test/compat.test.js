import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  addAllowBuild,
  allowBuildSpec,
  allowBuildsHint,
  classifyCompatRun,
  validateCompatResults,
} from '../compat.js';

test('classifyCompatRun: exit 0 is verified', () => {
  assert.deepEqual(classifyCompatRun({ exitCode: 0, timedOut: false, output: 'ok' }), {
    status: 'verified',
  });
});

test('classifyCompatRun: timeout is failed with reason', () => {
  assert.deepEqual(classifyCompatRun({ exitCode: -1, timedOut: true, output: '' }), {
    status: 'failed',
    reason: 'timeout',
  });
});

test('classifyCompatRun: non-zero exit records output tail', () => {
  const r = classifyCompatRun({ exitCode: 1, timedOut: false, output: 'line1\nline2\nERR: boom\n' });
  assert.equal(r.status, 'failed');
  assert.ok(r.reason.includes('ERR: boom'));
});

test('validateCompatResults: accepts valid results', () => {
  const results = [
    { repo: 'a/b', status: 'verified', dshVersion: '0.1.0-rc.6', checkedAt: '2026-08-15T00:00:00Z' },
    { repo: 'c/d', status: 'failed', reason: 'boom', dshVersion: '0.1.0-rc.6', checkedAt: '2026-08-15T00:00:00Z' },
  ];
  assert.deepEqual(validateCompatResults(results), []);
});

test('validateCompatResults: rejects invalid status and missing fields', () => {
  const results = [
    { repo: 'a/b', status: 'nope', dshVersion: 'x', checkedAt: 'bad' },
    { repo: 'no-slash', status: 'verified', dshVersion: 'x', checkedAt: '2026-08-15T00:00:00Z' },
  ];
  const errors = validateCompatResults(results);
  assert.ok(errors.length >= 3);
});

test('allowBuildsHint / allowBuildSpec: extracts the exact blocked git spec', () => {
  const output =
    'something\n"@scope/name@https://codeload.github.com/o/r/tar.gz/abc123" is blocked\n' +
    'dsh: git-hosted plugins build on install via their prepare script, which pnpm blocks until allowed';
  assert.equal(allowBuildsHint(output), true);
  assert.equal(allowBuildSpec(output), '@scope/name@https://codeload.github.com/o/r/tar.gz/abc123');
  assert.equal(allowBuildsHint('plain failure'), false);
  assert.equal(allowBuildSpec('no spec here'), null);
});

test('addAllowBuild: appends a block or inserts under an existing one', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-hub-'));
  try {
    const bare = path.join(dir, 'bare.yml');
    fs.writeFileSync(bare, 'packages:\n  - .\n');
    addAllowBuild(bare, 'pkg@https://x/y');
    const bareText = fs.readFileSync(bare, 'utf8');
    assert.ok(bareText.includes("allowBuilds:\n  'pkg@https://x/y': true"));

    const existing = path.join(dir, 'existing.yml');
    fs.writeFileSync(existing, 'packages:\n  - .\n\nallowBuilds:\n  esbuild: true\n');
    addAllowBuild(existing, 'pkg@https://x/y');
    const existingText = fs.readFileSync(existing, 'utf8');
    // The new entry lands right under the allowBuilds header.
    assert.ok(existingText.includes("allowBuilds:\n  'pkg@https://x/y': true\n  esbuild: true"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
