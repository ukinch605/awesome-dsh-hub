import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileDiscovery } from '../lib/discovery-state.js';
import { generateEvents } from '../lib/registry-v2.js';

const at = '2026-08-30T00:00:00Z';
const plugin = { githubRepoId: 42, repo: 'owner/plugin', lastSeenAt: '2026-08-01T00:00:00Z', lastManifestCheckedAt: '2026-08-01T00:00:00Z' };

test('one miss preserves the plugin and emits no removal', async () => {
  const result = await reconcileDiscovery({ previous: [plugin], observed: [], observedAt: at, confirm: async () => assert.fail('not a candidate') });
  assert.deepEqual(result.retainedPrevious, [plugin]);
  assert.equal(result.state.repositories[0].consecutiveDiscoveryMisses, 1);
  assert.equal(result.state.repositories[0].lastDiscoveredAt, null);
  assert.deepEqual(generateEvents([plugin], result.retainedPrevious, at, { confirmedRemovalIds: result.confirmedRemovalIds }), []);
});

test('rediscovery resets misses without plugin_added and retains stable-ID rename behavior', async () => {
  const state = { repositories: [{ repositoryId: '42', repo: 'owner/plugin', lastDiscoveredAt: '2026-08-01T00:00:00Z', consecutiveDiscoveryMisses: 1 }] };
  const observed = [{ id: 42, full_name: 'owner/renamed' }];
  const result = await reconcileDiscovery({ previous: [plugin], state, observed, observedAt: at, confirm: async () => null });
  assert.equal(result.state.repositories[0].consecutiveDiscoveryMisses, 0);
  const events = generateEvents([plugin], [{ ...plugin, repo: 'owner/renamed' }], at);
  assert.deepEqual(events.map((event) => event.type), ['repo_renamed']);
});

test('two misses trigger bounded confirmation and confirmed ineligibility removes exactly once', async () => {
  let checks = 0;
  const state = { repositories: [{ repositoryId: '42', repo: plugin.repo, lastDiscoveredAt: '2026-08-01T00:00:00Z', consecutiveDiscoveryMisses: 1 }] };
  const result = await reconcileDiscovery({ previous: [plugin], state, observed: [], observedAt: at, confirm: async () => { checks++; return { kind: 'confirmed-removed', reason: 'topic-removed' }; } });
  assert.equal(checks, 1);
  assert.deepEqual(result.retainedPrevious, []);
  const events = generateEvents([plugin], [], at, { confirmedRemovalIds: result.confirmedRemovalIds });
  assert.equal(events.filter((event) => event.type === 'plugin_removed').length, 1);
});

test('transient confirmation failure preserves the prior plugin', async () => {
  const state = { repositories: [{ repositoryId: '42', repo: plugin.repo, lastDiscoveredAt: null, consecutiveDiscoveryMisses: 1 }] };
  const result = await reconcileDiscovery({ previous: [plugin], state, observed: [], observedAt: at, confirm: async () => ({ kind: 'transient-failure' }) });
  assert.deepEqual(result.retainedPrevious, [plugin]);
  assert.equal(result.confirmedRemovalIds.size, 0);
});
