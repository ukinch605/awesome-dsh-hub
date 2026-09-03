import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateShadowRegistryV3,
  isPlaceholderPackageName,
} from '../lib/registry-v3-shadow.js';

const generatedAt = '2026-09-03T22:00:00.000Z';

function rootEntry(overrides = {}) {
  return {
    name: 'mono',
    githubRepoId: 42,
    repo: 'Example/mono',
    defaultBranch: 'main',
    packageName: '@example/root',
    packageVersion: '1.0.0',
    repoPushedAt: '2026-09-03T20:00:00Z',
    firstSeenAt: '2026-08-01T00:00:00Z',
    lastSeenAt: '2026-09-03T21:00:00Z',
    lastManifestCheckedAt: '2026-09-03T21:00:00Z',
    discoverySource: 'github-topic:dsh-plugin',
    url: 'https://github.com/Example/mono',
    description: 'Example',
    stars: 10,
    license: 'MIT',
    categories: ['agent'],
    activity: 'active',
    installCommand: 'dsh plugin add github:Example/mono',
    installProbe: { status: 'installed', checkedAt: '2026-09-03T20:00:00Z' },
    ...overrides,
  };
}

function topology(surfaces) {
  return {
    schemaVersion: 1,
    repositories: [{
      repositoryId: '42',
      repo: 'Example/mono',
      defaultBranch: 'main',
      repoPushedAt: '2026-09-03T20:00:00Z',
      lastCompleteScanAt: '2026-09-03T21:30:00Z',
      bundleSurfaces: surfaces,
    }],
  };
}

const rootSurface = {
  path: 'package.json', root: true, packageName: '@example/root', packageVersion: '1.0.0',
  bundlePatch: './root.patch.yml', packagePrivate: false, repositoryDirectory: null,
};

const nestedSurface = {
  path: 'packages/tool/package.json', root: false, packageName: '@example/tool', packageVersion: '2.0.0',
  bundlePatch: './tool.patch.yml', packagePrivate: false, repositoryDirectory: 'packages/tool',
};

test('v2 root carries lifecycle/install evidence while nested candidate remains non-installable', () => {
  const result = generateShadowRegistryV3({
    v2Entries: [rootEntry()],
    topologyState: topology([rootSurface, nestedSurface]),
    observed: [],
    generatedAt,
  });
  assert.equal(result.registry.authoritative, false);
  assert.equal(result.registry.entries.length, 2);
  const root = result.registry.entries.find((entry) => entry.packagePath === 'package.json');
  const nested = result.registry.entries.find((entry) => entry.packagePath === 'packages/tool/package.json');
  assert.equal(root.firstSeenAt, '2026-08-01T00:00:00Z');
  assert.equal(root.lastSeenAt, '2026-09-03T21:00:00Z');
  assert.equal(root.distribution.status, 'verified-repo-install');
  assert.equal(root.installProbe.status, 'installed');
  assert.equal(root.categories[0], 'agent');
  assert.equal(nested.distribution.status, 'unknown');
  assert.equal(nested.distribution.installCommand, null);
  assert.equal('installProbe' in nested, false);
  assert.equal('firstSeenAt' in nested, false);
  assert.equal(nested.observationSemantics, 'plugin_first_observed');
  assert.equal(result.migrationReport.v2RootEntriesCarried, 1);
  assert.equal(result.migrationReport.nestedCandidates, 1);
  assert.equal(result.migrationReport.publicCutoverReady, false);
});

test('plugin ids persist across package metadata changes and are not package-name keys', () => {
  const first = generateShadowRegistryV3({
    v2Entries: [rootEntry()],
    topologyState: topology([rootSurface, nestedSurface]),
    generatedAt,
  });
  const changed = topology([rootSurface, { ...nestedSurface, packageName: '@example/tool-renamed', packageVersion: '3.0.0' }]);
  const second = generateShadowRegistryV3({
    v2Entries: [rootEntry()],
    topologyState: changed,
    identityState: first.identityState,
    generatedAt: '2026-09-03T23:00:00.000Z',
  });
  const firstNested = first.registry.entries.find((entry) => !entry.packagePath.startsWith('package.json'));
  const secondNested = second.registry.entries.find((entry) => entry.packagePath === nestedSurface.path);
  assert.equal(secondNested.pluginId, firstNested.pluginId);
  assert.equal(secondNested.packageName, '@example/tool-renamed');
});

test('duplicate and placeholder package names remain representable without identity collisions', () => {
  const duplicate = { ...nestedSurface, path: 'packages/other/package.json', packageName: '@example/root' };
  const placeholder = { ...nestedSurface, path: 'templates/package.json', packageName: '{{PKG_NAME}}' };
  const result = generateShadowRegistryV3({
    v2Entries: [rootEntry()],
    topologyState: topology([rootSurface, duplicate, placeholder]),
    generatedAt,
  });
  const ids = result.registry.entries.map((entry) => entry.pluginId);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(result.registry.entries.filter((entry) => entry.packageName === '@example/root')
    .every((entry) => entry.identityStatus === 'ambiguous-surface'));
  assert.equal(result.migrationReport.placeholderPackageNames, 1);
  assert.equal(result.migrationReport.duplicatePackageNameSurfaces, 2);
  assert.equal(isPlaceholderPackageName('{{PKG_NAME}}'), true);
});

test('nested-only topology candidates keep repository locators without fabricated install evidence', () => {
  const result = generateShadowRegistryV3({
    v2Entries: [],
    topologyState: topology([nestedSurface]),
    generatedAt,
  });
  assert.equal(result.registry.entries.length, 1);
  assert.equal(result.registry.entries[0].repo, 'Example/mono');
  assert.equal(result.registry.entries[0].defaultBranch, 'main');
  assert.equal(result.registry.entries[0].repoPushedAt, '2026-09-03T20:00:00Z');
  assert.equal(result.registry.entries[0].distribution.status, 'unknown');
  assert.equal(result.registry.entries[0].distribution.installCommand, null);
  assert.equal(result.migrationReport.nestedOnlyCandidates, 1);
});

test('a unique same-repo package path move preserves pluginId', () => {
  const first = generateShadowRegistryV3({
    v2Entries: [],
    topologyState: topology([nestedSurface]),
    generatedAt,
  });
  const moved = { ...nestedSurface, path: 'plugins/tool/package.json' };
  const second = generateShadowRegistryV3({
    v2Entries: [],
    topologyState: topology([moved]),
    identityState: first.identityState,
    generatedAt: '2026-09-03T23:00:00.000Z',
  });
  assert.equal(second.registry.entries[0].pluginId, first.registry.entries[0].pluginId);
  assert.equal(second.registry.entries[0].previousPackagePath, nestedSurface.path);
  assert.equal(second.migrationReport.pathMovesReconciled, 1);
});

test('ambiguous same-name path replacements do not reuse one prior pluginId', () => {
  const first = generateShadowRegistryV3({
    v2Entries: [],
    topologyState: topology([nestedSurface]),
    generatedAt,
  });
  const replacements = [
    { ...nestedSurface, path: 'plugins/tool-a/package.json' },
    { ...nestedSurface, path: 'plugins/tool-b/package.json' },
  ];
  const second = generateShadowRegistryV3({
    v2Entries: [],
    topologyState: topology(replacements),
    identityState: first.identityState,
    generatedAt: '2026-09-03T23:00:00.000Z',
  });
  const active = second.registry.entries;
  assert.equal(active.length, 2);
  assert.equal(new Set(active.map((entry) => entry.pluginId)).size, 2);
  assert.ok(active.every((entry) => entry.identityStatus === 'ambiguous-surface'));
  assert.ok(active.every((entry) => !('previousPackagePath' in entry)));
  assert.equal(second.migrationReport.pathMovesReconciled, 0);
});
