import test from 'node:test';
import assert from 'node:assert/strict';
import { preserveTransientEntry, pruneConfirmedStale } from '../lib/registry-state.js';

const entry = { repo: 'owner/plugin', categories: ['agent'] };

test('transient fetch failure preserves previous registry entry', () => {
  const out = [];
  assert.equal(preserveTransientEntry({ kind: 'transient-failure' }, 'OWNER/PLUGIN', new Map([['owner/plugin', entry]]), out), true);
  assert.deepEqual(out, [entry]);
});

test('transient failure does not prune compatibility or overrides', () => {
  const out = [];
  preserveTransientEntry({ kind: 'transient-failure' }, entry.repo, new Map([[entry.repo, entry]]), out);
  const current = out.map((e) => ({ repo: e.repo }));
  assert.deepEqual(pruneConfirmedStale(current, out.map((e) => e.repo)), current);
});

test('confirmed stale or renamed repo is pruned', () => {
  assert.deepEqual(pruneConfirmedStale([{ repo: 'old/plugin' }, { repo: 'owner/plugin' }], ['owner/plugin']), [{ repo: 'owner/plugin' }]);
});
