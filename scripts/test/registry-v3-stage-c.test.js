import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendShadowEvents,
  buildDependentState,
  generatePackageEvents,
  legacyEventReferences,
  resolvePluginOverride,
} from '../lib/registry-v3-stage-c.js';

const at = '2026-09-04T00:00:00.000Z';
const root = (extra = {}) => ({
  pluginId: 'dshp_root', githubRepoId: '1', repo: 'o/r', packagePath: 'package.json',
  packageName: '@o/r', packageVersion: '1.0.0', identityStatus: 'observed-surface',
  observationSemantics: 'v2-carried-forward', activity: 'active',
  installProbe: { status: 'installed' }, ...extra,
});
const nested = (extra = {}) => ({
  pluginId: 'dshp_nested', githubRepoId: '1', repo: 'o/r', packagePath: 'packages/x/package.json',
  packageName: '@o/x', packageVersion: '1.0.0', identityStatus: 'observed-surface',
  observationSemantics: 'plugin_first_observed', activity: 'active', ...extra,
});

function state(entries) {
  return { schemaVersion: 1, entries: entries.map((entry) => ({
    pluginId: entry.pluginId,
    githubRepoId: String(entry.githubRepoId),
    repo: entry.repo,
    packagePath: entry.packagePath,
    packageName: entry.packageName,
    packageVersion: entry.packageVersion,
    identityStatus: entry.identityStatus,
    activity: entry.activity,
    installProbeStatus: entry.installProbe?.status ?? 'not-tested',
    observationSemantics: entry.observationSemantics,
  })) };
}

test('initial baseline uses plugin_first_observed only for topology package surfaces', () => {
  const events = generatePackageEvents({ entries: [] }, [root(), nested()], at);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'plugin_first_observed');
  assert.equal(events[0].pluginId, 'dshp_nested');
  assert.equal(events[0].changes.backfill, true);
});

test('event generation is idempotent when appended twice', () => {
  const generated = generatePackageEvents({ entries: [] }, [nested()], at);
  const once = appendShadowEvents({ events: [] }, generated);
  const twice = appendShadowEvents(once, generated);
  assert.deepEqual(twice.events, once.events);
});

test('unambiguous path and name continuity emits semantic change events', () => {
  const old = nested();
  const now = nested({ packagePath: 'plugins/x/package.json', packageName: '@o/x2', packageVersion: '2.0.0' });
  const events = generatePackageEvents(state([old]), [now], at);
  assert.deepEqual(events.map((e) => e.type).sort(), [
    'package_name_changed', 'package_path_changed', 'package_version_changed',
  ]);
});

test('ambiguous continuity emits no path/name/version lifecycle claims', () => {
  const old = nested();
  const now = nested({ packagePath: 'other/package.json', packageName: '@o/y', packageVersion: '2.0.0', identityStatus: 'ambiguous-surface' });
  const events = generatePackageEvents(state([old]), [now], at);
  assert.equal(events.filter((e) => e.type.startsWith('package_')).length, 0);
});

test('repo rename follows stable githubRepoId and pluginId', () => {
  const old = root();
  const now = root({ repo: 'new-owner/new-name' });
  const events = generatePackageEvents(state([old]), [now], at);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'repo_renamed');
});

test('legacy repo overrides and compatibility are root-only', () => {
  const overrides = {
    categories: { 'o/r': ['tool'] },
    descriptions: { 'o/r': 'root override' },
  };
  const compatibility = { results: [{ repo: 'o/r', status: 'installed', dshVersion: '1.0.0', checkedAt: at }] };
  const out = buildDependentState([root(), nested()], compatibility, overrides, at);
  const r = out.entries.find((e) => e.pluginId === 'dshp_root');
  const n = out.entries.find((e) => e.pluginId === 'dshp_nested');
  assert.equal(r.override.scope, 'legacy-repo-root-fallback');
  assert.equal(r.compatibility.status, 'installed');
  assert.equal(n.override, null);
  assert.equal(n.compatibility, null);
});

test('explicit pluginId override may target nested package without changing repo fallback', () => {
  const overrides = {
    categories: { 'o/r': ['tool'] },
    pluginIds: { dshp_nested: { categories: ['agent'], description: 'nested only' } },
  };
  assert.equal(resolvePluginOverride(root(), overrides).scope, 'legacy-repo-root-fallback');
  const resolved = resolvePluginOverride(nested(), overrides);
  assert.equal(resolved.scope, 'pluginId');
  assert.deepEqual(resolved.value.categories, ['agent']);
});

test('duplicate or placeholder package names do not affect pluginId-scoped event identity', () => {
  const a = nested({ pluginId: 'dshp_a', packageName: '{{PKG_NAME}}' });
  const b = nested({ pluginId: 'dshp_b', packageName: '{{PKG_NAME}}', packagePath: 'templates/b/package.json' });
  const events = generatePackageEvents({ entries: [] }, [a, b], at);
  assert.deepEqual(new Set(events.map((e) => e.pluginId)), new Set(['dshp_a', 'dshp_b']));
});

test('historical v2 event references preserve ids and bodies stay outside shadow ledger', () => {
  const v2 = { events: [{ id: 'legacy-id', type: 'plugin_added', repositoryId: '1', changes: { repo: 'o/r' } }] };
  assert.deepEqual(legacyEventReferences(v2), [{ id: 'legacy-id', type: 'plugin_added', scope: 'legacy-repository-v2' }]);
  assert.deepEqual(v2.events[0].changes, { repo: 'o/r' });
});
