import test from 'node:test';
import assert from 'node:assert/strict';
import { appendEvents, generateEvents, migrateV1Entry, preserveLifecycle } from '../lib/registry-v2.js';
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
