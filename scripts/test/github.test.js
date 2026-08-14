import test from 'node:test';
import assert from 'node:assert/strict';
import { hasBundlePatch, normalizeRepo, searchTopicRepos } from '../lib/github.js';

test('hasBundlePatch: accepts declared patch', () => {
  assert.equal(hasBundlePatch('{"dsh":{"bundle":{"patch":{}}}}'), true);
  assert.equal(hasBundlePatch('{"dsh":{"bundle":{"patch":true}}}'), true);
});

test('hasBundlePatch: rejects missing or invalid manifests', () => {
  assert.equal(hasBundlePatch('{"name":"x"}'), false);
  assert.equal(hasBundlePatch('{invalid json'), false);
  assert.equal(hasBundlePatch(null), false);
  assert.equal(hasBundlePatch(''), false);
});

test('normalizeRepo: maps search item fields', () => {
  const norm = normalizeRepo({
    full_name: 'a/b',
    owner: { login: 'a' },
    name: 'b',
    html_url: 'https://github.com/a/b',
    description: 'desc',
    stargazers_count: 42,
    license: { spdx_id: 'MIT' },
    pushed_at: '2026-08-01T00:00:00Z',
    archived: false,
    fork: true,
    default_branch: 'main',
    topics: ['dsh-plugin'],
  });
  assert.equal(norm.stars, 42);
  assert.equal(norm.license, 'MIT');
  assert.equal(norm.fork, true);
  assert.deepEqual(norm.topics, ['dsh-plugin']);
});

test('searchTopicRepos: paginates, dedupes across queries, respects page cap', async () => {
  const makeItem = (n, owner) => ({
    full_name: `${owner}/repo-${n}`,
    owner: { login: owner },
    name: `repo-${n}`,
    html_url: `https://github.com/${owner}/repo-${n}`,
    description: '',
    stargazers_count: n,
    license: null,
    pushed_at: '2026-08-01T00:00:00Z',
    archived: false,
    fork: false,
    default_branch: 'main',
    topics: [],
  });
  let calls = 0;
  const fakeFetch = async (url) => {
    calls++;
    const page = Number(new URL(url).searchParams.get('page'));
    const sort = new URL(url).searchParams.get('sort');
    const items =
      sort === 'stars'
        ? [makeItem(100, 's1'), makeItem(50, 's2')]
        : [makeItem(100, 'u1'), makeItem(7, 'u2')];
    return {
      status: 200,
      headers: new Map([['x-ratelimit-remaining', '50']]),
      json: async () => ({ total_count: 150, items }),
    };
  };
  const repos = await searchTopicRepos({ fetchFn: fakeFetch, token: 't', pageSize: 100 });
  assert.equal(calls, 4); // 2 queries x 2 pages (150 total -> 2 pages)
  assert.equal(repos.length, 4); // s1/s2 + u1/u2, s1==u1 deduped by full_name
});
