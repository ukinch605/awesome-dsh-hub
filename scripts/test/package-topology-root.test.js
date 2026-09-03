import assert from 'node:assert/strict';
import test from 'node:test';
import { scanRepository } from '../lib/package-topology.js';

const noSleep = async () => {};
const rateHeaders = {
  'x-ratelimit-remaining': '999',
  'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
};

test('root-only bundle repository scans completely without nested packages', async () => {
  const fetchFn = async (url) => {
    if (url === 'https://api.github.com/repositories/1') {
      return new Response(JSON.stringify({
        id: 1,
        full_name: 'Example/root-plugin',
        name: 'root-plugin',
        owner: { login: 'Example' },
        default_branch: 'main',
        topics: ['dsh-plugin'],
      }), { status: 200, headers: rateHeaders });
    }
    if (url.includes('/git/trees/main?recursive=1')) {
      return new Response(JSON.stringify({
        truncated: false,
        tree: [{ type: 'blob', path: 'package.json' }],
      }), { status: 200, headers: rateHeaders });
    }
    if (url.endsWith('/main/package.json')) {
      return new Response(
        '{"name":"root-plugin","version":"1.0.0","dsh":{"bundle":{"patch":"./cordis.patch.yml"}}}',
        { status: 200 },
      );
    }
    throw new Error(`unexpected URL ${url}`);
  };

  const result = await scanRepository(
    { repositoryId: '1', repo: 'Example/root-plugin' },
    { fetchFn, sleepFn: noSleep },
  );
  assert.equal(result.complete, true);
  assert.equal(result.candidateManifestCount, 1);
  assert.equal(result.manifests.length, 1);
  assert.equal(result.manifests[0].root, true);
  assert.equal(result.manifests[0].kind, 'bundle');
});

test('tree API failure is explicit incomplete census evidence', async () => {
  const fetchFn = async (url) => {
    if (url === 'https://api.github.com/repositories/1') {
      return new Response(JSON.stringify({
        id: 1,
        full_name: 'Example/root-plugin',
        name: 'root-plugin',
        owner: { login: 'Example' },
        default_branch: 'main',
        topics: ['dsh-plugin'],
      }), { status: 200, headers: rateHeaders });
    }
    if (url.includes('/git/trees/main?recursive=1')) throw new Error('network down');
    throw new Error(`unexpected URL ${url}`);
  };

  const result = await scanRepository(
    { repositoryId: '1', repo: 'Example/root-plugin' },
    { fetchFn, sleepFn: noSleep },
  );
  assert.equal(result.complete, false);
  assert.deepEqual(result.incompleteReasons, ['tree-transient']);
  assert.deepEqual(result.manifests, []);
});
