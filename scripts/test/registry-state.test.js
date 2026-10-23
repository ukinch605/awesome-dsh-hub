import test from 'node:test';
import assert from 'node:assert/strict';
import { preserveTransientEntry, pruneConfirmedStale, previousEntryForCandidate, resolveRepoNameCollisions } from '../lib/registry-state.js';

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

const makeRepo = (id, name) => ({ id, full_name: name, owner: name.split('/')[0], name: name.split('/')[1] });
const prior = (id = 1, name = 'a/plugin') => ({ githubRepoId: id, repo: name });

test('repo name reused by a different ID: confirm old removal and admit new identity', async () => {
  const next = makeRepo(2, 'a/plugin');
  const result = await resolveRepoNameCollisions({
    previous: [prior()], observed: [next],
    verify: async ({ repositoryId }) => {
      assert.equal(repositoryId, '1');
      return { kind: 'confirmed-removed', reason: 'repository-not-found' };
    },
  });
  assert.deepEqual(result.candidates, [next]);
  assert.deepEqual([...result.confirmedRemovalIds], ['1']);
  assert.equal(previousEntryForCandidate(next, new Map([['1', prior()]]), new Map([['a/plugin', prior()]])), null);
});

test('prior ID still exists under a verified new name: preserve both identities', async () => {
  const fresh = makeRepo(2, 'a/plugin');
  const moved = makeRepo(1, 'a/renamed');
  const result = await resolveRepoNameCollisions({
    previous: [prior()], observed: [fresh],
    verify: async ({ repositoryId }) => ({ kind: 'eligible', repository: repositoryId === '1' ? moved : fresh }),
  });
  assert.deepEqual(result.candidates.map((x) => x.id), [2, 1]);
  assert.deepEqual([...result.confirmedRemovalIds], []);
});

test('transient incumbent verification preserves prior and defers new claimant', async () => {
  const result = await resolveRepoNameCollisions({
    previous: [prior()], observed: [makeRepo(2, 'a/plugin')],
    verify: async () => ({ kind: 'transient-failure' }),
  });
  assert.deepEqual(result.candidates, []);
  assert.deepEqual([...result.confirmedRemovalIds], []);
  assert.deepEqual(result.diagnostics.unresolvedRepoNames, ['a/plugin']);
});

test('stale GitHub Search ID and canonical renamed ID are reconciled', async () => {
  const oldHit = makeRepo(1, 'a/plugin');
  const fresh = makeRepo(2, 'a/plugin');
  const result = await resolveRepoNameCollisions({
    observed: [oldHit, fresh],
    verify: async ({ repositoryId }) => ({
      kind: 'eligible',
      repository: repositoryId === '1' ? makeRepo(1, 'a/renamed') : fresh,
    }),
  });
  assert.deepEqual(result.candidates.map((x) => x.full_name), ['a/renamed', 'a/plugin']);
  assert.equal(result.diagnostics.verifiedSearchCollisions, 1);
});

test('duplicate canonical Search name stays unresolved without guessing identity', async () => {
  const result = await resolveRepoNameCollisions({
    observed: [makeRepo(1, 'a/plugin'), makeRepo(2, 'a/plugin')],
    verify: async ({ repositoryId }) => ({ kind: 'eligible', repository: makeRepo(Number(repositoryId), 'a/plugin') }),
  });
  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.diagnostics.unresolvedRepoNames, ['a/plugin']);
});

test('same GitHub ID preserves old lifecycle and probe evidence after rename', () => {
  const old = { ...prior(), installProbe: { status: 'installed' } };
  const updated = makeRepo(1, 'a/renamed');
  assert.equal(previousEntryForCandidate(updated, new Map([['1', old]]), new Map([['a/plugin', old]])), old);
  assert.equal(previousEntryForCandidate(makeRepo(2, 'a/plugin'), new Map([['1', old]]), new Map([['a/plugin', old]])), null);
});
