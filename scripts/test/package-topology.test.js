import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildTopologySnapshot,
  candidateManifestPaths,
  classifyPackageManifest,
  scanRepository,
  selectRepositories,
  summarizeTopology,
} from '../lib/package-topology.js';

const headers = () => ({
  'x-ratelimit-remaining': '999',
  'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
});

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: headers() });
}

function textResponse(value, status = 200) {
  return new Response(value, { status, headers: headers() });
}

function repositoryMetadata(id = 1) {
  return {
    id,
    full_name: 'Example/mono',
    name: 'mono',
    owner: { login: 'Example' },
    default_branch: 'main',
    topics: ['dsh-plugin'],
  };
}

function mockRepositoryFetch({ tree, manifests = {}, rawStatus = {} }) {
  return async (url) => {
    if (url === 'https://api.github.com/repositories/1') return jsonResponse(repositoryMetadata());
    if (url.includes('/git/trees/main?recursive=1')) return jsonResponse(tree);
    if (url.startsWith('https://raw.githubusercontent.com/')) {
      const path = url.split('/main/')[1];
      const status = rawStatus[path] || (Object.hasOwn(manifests, path) ? 200 : 404);
      return textResponse(manifests[path] || '', status);
    }
    throw new Error(`unexpected URL: ${url}`);
  };
}

const noSleep = async () => {};

test('classifyPackageManifest distinguishes bundle, non-bundle, and invalid manifests', () => {
  assert.deepEqual(
    classifyPackageManifest('{"name":"a","version":"1.0.0","dsh":{"bundle":{"patch":"./cordis.patch.yml"}}}'),
    { kind: 'bundle', packageName: 'a', packageVersion: '1.0.0', bundleSignal: true },
  );
  assert.deepEqual(
    classifyPackageManifest('{"name":"a","version":"1.0.0"}'),
    { kind: 'non-bundle', packageName: 'a', packageVersion: '1.0.0', bundleSignal: false },
  );
  assert.equal(classifyPackageManifest('{bad').kind, 'invalid');
});

test('candidateManifestPaths is deterministic, excludes node_modules, and reports bounds', () => {
  const result = candidateManifestPaths({ tree: [
    { type: 'blob', path: 'packages/z/package.json' },
    { type: 'blob', path: 'package.json' },
    { type: 'blob', path: 'node_modules/x/package.json' },
    { type: 'blob', path: 'packages/a/package.json' },
    { type: 'blob', path: 'packages/a/package.json' },
  ] }, { limit: 2 });
  assert.deepEqual(result.paths, ['package.json', 'packages/a/package.json']);
  assert.equal(result.total, 3);
  assert.equal(result.boundExhausted, true);
});

test('scanRepository preserves multiple package paths and detects nested bundles', async () => {
  const tree = {
    truncated: false,
    tree: [
      { type: 'blob', path: 'package.json' },
      { type: 'blob', path: 'packages/agent/package.json' },
      { type: 'blob', path: 'packages/lib/package.json' },
    ],
  };
  const fetchFn = mockRepositoryFetch({
    tree,
    manifests: {
      'package.json': '{"name":"workspace","private":true}',
      'packages/agent/package.json': '{"name":"same-name","version":"1.0.0","dsh":{"bundle":{"patch":"./cordis.patch.yml"}}}',
      'packages/lib/package.json': '{"name":"same-name","version":"1.0.0"}',
    },
  });
  const result = await scanRepository(
    { repositoryId: '1', repo: 'Example/mono' },
    { fetchFn, sleepFn: noSleep, manifestLimit: 10 },
  );
  assert.equal(result.complete, true);
  assert.equal(result.manifests.length, 3);
  assert.equal(result.manifests.filter((item) => item.kind === 'bundle' && !item.root).length, 1);
  assert.equal(result.manifests.filter((item) => item.packageName === 'same-name').length, 2);
  assert.equal(result.manifests.find((item) => item.path === 'package.json').kind, 'non-bundle');
});

test('truncated repository trees are explicit incomplete observations', async () => {
  const fetchFn = mockRepositoryFetch({
    tree: { truncated: true, tree: [{ type: 'blob', path: 'package.json' }] },
    manifests: { 'package.json': '{"name":"root"}' },
  });
  const result = await scanRepository(
    { repositoryId: '1', repo: 'Example/mono' },
    { fetchFn, sleepFn: noSleep },
  );
  assert.equal(result.complete, false);
  assert.equal(result.treeTruncated, true);
  assert.ok(result.incompleteReasons.includes('tree-truncated'));
});

test('transient manifest failures never become non-bundle absence', async () => {
  const fetchFn = mockRepositoryFetch({
    tree: { truncated: false, tree: [{ type: 'blob', path: 'package.json' }] },
    rawStatus: { 'package.json': 500 },
  });
  const result = await scanRepository(
    { repositoryId: '1', repo: 'Example/mono' },
    { fetchFn, sleepFn: noSleep },
  );
  assert.equal(result.complete, false);
  assert.equal(result.manifests[0].kind, 'transient');
  assert.ok(result.incompleteReasons.includes('manifest-transient:package.json'));
});

test('per-repository manifest bound is explicit and cannot claim completeness', async () => {
  const tree = {
    truncated: false,
    tree: [
      { type: 'blob', path: 'package.json' },
      { type: 'blob', path: 'packages/a/package.json' },
      { type: 'blob', path: 'packages/b/package.json' },
    ],
  };
  const fetchFn = mockRepositoryFetch({
    tree,
    manifests: {
      'package.json': '{"name":"root"}',
      'packages/a/package.json': '{"name":"a"}',
      'packages/b/package.json': '{"name":"b"}',
    },
  });
  const result = await scanRepository(
    { repositoryId: '1', repo: 'Example/mono' },
    { fetchFn, sleepFn: noSleep, manifestLimit: 2 },
  );
  assert.equal(result.candidateManifestCount, 3);
  assert.equal(result.manifestsExamined, 2);
  assert.equal(result.complete, false);
  assert.ok(result.incompleteReasons.includes('manifest-limit-exhausted'));
});

test('selection is bounded and explicit include repositories are retained', () => {
  const repositories = Array.from({ length: 10 }, (_, index) => ({
    repositoryId: String(index + 1),
    repo: index === 7 ? 'Neplich/dsh_plugin' : `Example/repo-${index + 1}`,
  }));
  const first = selectRepositories(repositories, { limit: 4, includeRepos: ['Neplich/dsh_plugin'] });
  const second = selectRepositories(repositories, { limit: 4, includeRepos: ['Neplich/dsh_plugin'] });
  assert.equal(first.length, 4);
  assert.equal(first[0].repo, 'Neplich/dsh_plugin');
  assert.deepEqual(first, second);
});

test('snapshot summary never equates a bounded sample with full ecosystem coverage', () => {
  const records = [{
    complete: true,
    treeTruncated: false,
    candidateManifestCount: 2,
    manifestsExamined: 2,
    stats: { apiRequests: 2, rawFetches: 2 },
    manifests: [
      { root: true, kind: 'non-bundle' },
      { root: false, kind: 'bundle' },
    ],
  }];
  const summary = summarizeTopology(records);
  assert.equal(summary.nestedBundles, 1);
  assert.equal(summary.repositoriesWithNestedBundles, 1);
  const snapshot = buildTopologySnapshot({
    generatedAt: '2026-09-03T00:00:00Z',
    observedRepositories: 100,
    selectedRepositories: [{ repositoryId: '1', repo: 'Example/mono' }],
    records,
    repoLimit: 1,
    manifestLimit: 100,
    includeRepos: [],
  });
  assert.equal(snapshot.coverage.fullObservedSetScanned, false);
  assert.equal(snapshot.coverage.completeSelectedSample, true);
});
