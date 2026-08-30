import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmRemovalCandidates, markConfirmationPreserved, observeDiscovery } from '../lib/discovery-state.js';
import { generateEvents } from '../lib/registry-v2.js';

const at = '2026-08-29T12:00:00Z';
const entry = { githubRepoId: 42, repo: 'owner/plugin', packageVersion: '1.0.0', activity: 'active' };
const candidate = { id: 42, full_name: 'owner/plugin' };

test('one discovery miss preserves registry entry and emits no removal', () => {
  const result = observeDiscovery([entry], [], { schemaVersion: 1, records: [] }, at);
  assert.deepEqual(result.preserved, [entry]);
  assert.equal(result.state.records[0].lastDiscoveredAt, null);
  assert.equal(result.state.records[0].consecutiveDiscoveryMisses, 1);
  assert.deepEqual(generateEvents([entry], result.preserved, at, { confirmedRemovalIds: new Set() }), []);
});

test('rediscovery resets misses and does not emit plugin_added', () => {
  const state = { schemaVersion: 1, records: [{ repositoryId: 42, repo: entry.repo, lastDiscoveredAt: at, consecutiveDiscoveryMisses: 1 }] };
  const result = observeDiscovery([entry], [candidate], state, '2026-08-30T12:00:00Z');
  assert.equal(result.state.records[0].consecutiveDiscoveryMisses, 0);
  assert.deepEqual(generateEvents([entry], [entry], at), []);
});

test('confirmed removal emits exactly once', async () => {
  const state = { schemaVersion: 1, records: [{ repositoryId: 42, repo: entry.repo, lastDiscoveredAt: at, consecutiveDiscoveryMisses: 1 }] };
  const observed = observeDiscovery([entry], [], state, at);
  const confirmation = await confirmRemovalCandidates(observed.confirmationCandidates, async () => ({ kind: 'confirmed-ineligible', reason: 'repository-not-found' }));
  assert.equal(confirmation.confirmed.length, 1);
  const events = generateEvents([entry], [], at, { confirmedRemovalIds: new Set(['42']) });
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'plugin_removed');
  assert.equal(events[0].changes.confirmation, 'direct-verification');
  assert.deepEqual(generateEvents([], [], at, { confirmedRemovalIds: new Set(['42']) }), []);
});

test('transient confirmation failure preserves entry and resets bounded retry state', async () => {
  const confirmation = await confirmRemovalCandidates([entry], async () => ({ kind: 'transient-failure' }));
  assert.deepEqual(confirmation.preserved[0].entry, entry);
  const state = { schemaVersion: 1, records: [{ repositoryId: 42, repo: entry.repo, lastDiscoveredAt: at, consecutiveDiscoveryMisses: 2 }] };
  assert.equal(markConfirmationPreserved(state, entry).records[0].consecutiveDiscoveryMisses, 0);
});

test('stable ID preserves rename detection after rediscovery', () => {
  const renamed = { ...entry, repo: 'owner/renamed' };
  const events = generateEvents([entry], [renamed], at);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'repo_renamed');
});
