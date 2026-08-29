import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendEvents,
  generateEvents,
  migrateInstallProbeStatus,
  migrateV1Entry,
  preserveLifecycle,
  recordInstallProbeEvents,
} from '../lib/registry-v2.js';
import { validateEventLedger } from '../lib/validate.js';

const at = '2026-08-29T12:00:00Z';
const plugin = (overrides = {}) => ({ githubRepoId: 42, repo: 'owner/plugin', packageVersion: '1.0.0', activity: 'active', ...overrides });

test('v1 migration is readable and does not fabricate lifecycle history', () => {
  const migrated = migrateV1Entry({ repo: 'owner/plugin', stars: 1 });
  assert.equal(migrated.repo, 'owner/plugin');
  assert.equal(migrated.githubRepoId, null);
  assert.equal(migrated.firstSeenAt, null);
  assert.equal(migrated.lastSeenAt, null);
  assert.deepEqual(generateEvents([{ repo: 'owner/plugin' }], [plugin()], at), []);
});

test('lifecycle timestamps preserve first evidence and update last seen', () => {
  const old = plugin({ firstSeenAt: '2026-08-01T00:00:00Z', lastSeenAt: '2026-08-02T00:00:00Z' });
  const next = preserveLifecycle(plugin(), old, at);
  assert.equal(next.firstSeenAt, old.firstSeenAt);
  assert.equal(next.lastSeenAt, at);
  assert.equal(preserveLifecycle(plugin(), null, at).firstSeenAt, at);
});

test('stable repository ID detects rename and semantic changes but ignores stars', () => {
  const events = generateEvents(
    [plugin({ stars: 1, installProbe: { status: 'failed' } })],
    [plugin({ repo: 'owner/new-name', stars: 99, packageVersion: '2.0.0', activity: 'watching', installProbe: { status: 'installed' } })], at,
  );
  assert.deepEqual(events.map((e) => e.type).sort(), ['activity_changed', 'install_probe_changed', 'package_version_changed', 'repo_renamed']);
});

test('events cover additions/removals and ledger append is idempotent', () => {
  const events = generateEvents([plugin()], [plugin({ githubRepoId: 77, repo: 'new/plugin' })], at, { suppressMigration: false });
  assert.deepEqual(events.map((e) => e.type).sort(), ['plugin_added', 'plugin_removed']);
  const once = appendEvents({ schemaVersion: 1, events: [] }, events);
  const twice = appendEvents(once, events);
  assert.deepEqual(twice, once);
  assert.deepEqual(validateEventLedger(twice), []);
});

test('preserved transient state emits no false removal or version event', () => {
  const old = plugin();
  assert.deepEqual(generateEvents([old], [old], at), []);
  assert.deepEqual(generateEvents([plugin({ packageVersion: null })], [plugin()], at), []);
});

test('legacy failed probe migration distinguishes policy blocks and timeouts', () => {
  assert.equal(migrateInstallProbeStatus('failed', 'pnpm requires this key under allowBuilds'), 'blocked');
  assert.equal(migrateInstallProbeStatus('failed', 'Ignored build scripts: esbuild; run pnpm approve-builds'), 'blocked');
  assert.equal(migrateInstallProbeStatus('failed', 'timeout'), 'timeout');
  assert.equal(migrateInstallProbeStatus('failed', 'install timed out'), 'timeout');
  assert.equal(migrateInstallProbeStatus('failed', 'dependency resolution failed'), 'failed');
});

test('production probe transition appends exactly once and rerun is idempotent', () => {
  const before = [plugin({ installProbe: { status: 'failed' } })];
  const results = [{ repo: 'owner/plugin', status: 'installed', reason: null }];
  const once = recordInstallProbeEvents(before, results, { schemaVersion: 1, events: [] }, at);
  assert.equal(once.events.length, 1);
  assert.equal(once.events[0].type, 'install_probe_changed');
  assert.deepEqual(once.events[0].changes, { from: 'failed', to: 'installed' });

  // A retry is idempotent even if generation has not persisted the new state yet.
  const twice = recordInstallProbeEvents(before, results, once, '2026-08-29T13:00:00Z');
  assert.equal(twice.events.length, 1);
  assert.deepEqual(twice, once);
});
