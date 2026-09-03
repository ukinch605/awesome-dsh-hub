import assert from 'node:assert/strict';
import test from 'node:test';
import { scanObservedRepository } from '../lib/package-topology.js';
import {
  applyTopologyScanResults,
  selectTopologyScanTargets,
  summarizeTopologyState,
} from '../lib/package-topology-state.js';

const observed = (id, pushedAt = '2026-09-03T00:00:00Z') => ({
  id,
  full_name: `Example/repo-${id}`,
  default_branch: 'main',
  pushed_at: pushedAt,
});

const completeScan = (id, manifests = []) => ({
  repositoryId: String(id),
  complete: true,
  incompleteReasons: [],
  treeTruncated: false,
  candidateManifestCount: manifests.length,
  manifestsExamined: manifests.length,
  manifests,
  stats: { apiRequests: 1, rawFetches: manifests.length },
});

test('incremental selection advances never-scanned backfill instead of rescanning completed repos', () => {
  const repos = [observed(1), observed(2), observed(3), observed(4)];
  const first = selectTopologyScanTargets(repos, { schemaVersion: 1, repositories: [] }, { limit: 2, now: Date.parse('2026-09-03T01:00:00Z') });
  assert.equal(first.selected.length, 2);
  const state = applyTopologyScanResults(
    { schemaVersion: 1, repositories: [] },
    first.selected,
    first.selected.map((repo) => completeScan(repo.id)),
    '2026-09-03T01:00:00Z',
  );
  const second = selectTopologyScanTargets(repos, state, { limit: 2, now: Date.parse('2026-09-03T02:00:00Z') });
  assert.equal(second.selected.length, 2);
  const firstIds = new Set(first.selected.map((repo) => String(repo.id)));
  assert.ok(second.selected.every((repo) => !firstIds.has(String(repo.id))));
});

test('changed repository metadata requeues a previously complete inventory', () => {
  const repo = observed(1, '2026-09-03T00:00:00Z');
  let state = applyTopologyScanResults(
    { schemaVersion: 1, repositories: [] }, [repo], [completeScan(1)], '2026-09-03T01:00:00Z',
  );
  const changed = observed(1, '2026-09-03T03:00:00Z');
  const selection = selectTopologyScanTargets([changed], state, { limit: 1, now: Date.parse('2026-09-03T04:00:00Z') });
  assert.equal(selection.selected.length, 1);
  assert.equal(selection.diagnostics.changedSinceCompleteScan, 1);
  state = applyTopologyScanResults(state, [changed], [completeScan(1)], '2026-09-03T04:00:00Z');
  assert.equal(summarizeTopologyState(state, [changed], [], {}).currentInventoryPending, 0);
});

test('incomplete scans retain the last complete surfaces and back off retries', () => {
  const repo = observed(1);
  const bundle = {
    path: 'packages/a/package.json', root: false, kind: 'bundle',
    packageName: '@example/a', packageVersion: '1.0.0', bundlePatch: './cordis.patch.yml',
    packagePrivate: false, repositoryDirectory: 'packages/a',
  };
  let state = applyTopologyScanResults(
    { schemaVersion: 1, repositories: [] }, [repo], [completeScan(1, [bundle])], '2026-09-03T01:00:00Z',
  );
  const failed = {
    repositoryId: '1', complete: false, incompleteReasons: ['tree-transient'],
    treeTruncated: false, candidateManifestCount: 0, manifestsExamined: 0,
    manifests: [], stats: { apiRequests: 1, rawFetches: 0 },
  };
  state = applyTopologyScanResults(state, [repo], [failed], '2026-09-03T02:00:00Z');
  assert.equal(state.repositories[0].bundleSurfaces.length, 1);
  assert.equal(state.repositories[0].lastCompleteScanAt, '2026-09-03T01:00:00Z');
  const tooSoon = selectTopologyScanTargets([repo], state, { limit: 1, now: Date.parse('2026-09-03T02:30:00Z') });
  assert.equal(tooSoon.selected.length, 0);
  assert.equal(tooSoon.diagnostics.incompleteRetryDeferred, 1);
  const due = selectTopologyScanTargets([repo], state, { limit: 1, now: Date.parse('2026-09-03T03:01:00Z') });
  assert.equal(due.selected.length, 1);
});

test('state summary never claims complete coverage while current inventories are pending', () => {
  const repos = [observed(1), observed(2)];
  const bundle = {
    path: 'package.json', root: true, kind: 'bundle', packageName: 'a', packageVersion: '1.0.0',
    bundlePatch: './cordis.patch.yml', packagePrivate: null, repositoryDirectory: null,
  };
  const state = applyTopologyScanResults(
    { schemaVersion: 1, repositories: [] }, [repos[0]], [completeScan(1, [bundle])], '2026-09-03T01:00:00Z',
  );
  const summary = summarizeTopologyState(state, repos, [completeScan(1, [bundle])], { scanLimit: 150 });
  assert.equal(summary.currentInventoryComplete, 1);
  assert.equal(summary.currentInventoryPending, 1);
  assert.equal(summary.currentBundleSurfaces, 1);
  assert.equal(summary.completeCoverageClaimed, false);
  assert.equal(summary.apiRequestsThisRun, 1);
});

test('observed-repository scan reuses search metadata and spends one REST request for the tree', async () => {
  const repo = {
    id: 7,
    full_name: 'Example/mono',
    owner: 'Example',
    name: 'mono',
    default_branch: 'main',
    pushed_at: '2026-09-03T00:00:00Z',
    topics: ['dsh-plugin'],
  };
  const fetchFn = async (url) => {
    if (url.includes('/git/trees/main?recursive=1')) {
      return new Response(JSON.stringify({
        truncated: false,
        tree: [{ type: 'blob', path: 'packages/a/package.json' }],
      }), { status: 200, headers: { 'x-ratelimit-remaining': '900' } });
    }
    if (url.includes('raw.githubusercontent.com')) {
      return new Response(JSON.stringify({
        name: '@example/a',
        version: '2.0.0',
        private: false,
        repository: { directory: 'packages/a' },
        dsh: { bundle: { patch: './cordis.patch.yml' } },
      }), { status: 200 });
    }
    throw new Error(`unexpected request ${url}`);
  };
  const result = await scanObservedRepository(repo, {
    fetchFn,
    sleepFn: async () => {},
    manifestLimit: 10,
  });
  assert.equal(result.complete, true);
  assert.equal(result.stats.apiRequests, 1);
  assert.equal(result.manifests[0].bundlePatch, './cordis.patch.yml');
  assert.equal(result.manifests[0].packagePrivate, false);
  assert.equal(result.manifests[0].repositoryDirectory, 'packages/a');
});
