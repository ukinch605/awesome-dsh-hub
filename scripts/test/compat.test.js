import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
