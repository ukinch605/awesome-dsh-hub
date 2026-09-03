import test from 'node:test';
import assert from 'node:assert/strict';
import { bisectDateRange, fetchRawPackageJson, fetchRawPackageJsonResult, hasBundlePatch, normalizeRepo, searchTopicRepos } from '../lib/github.js';
import { SEARCH_QUERIES } from '../lib/constants.js';

const noSleep = async () => {};

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
    id: 123,
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
  assert.equal(norm.id, 123);
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
  const repos = await searchTopicRepos({ fetchFn: fakeFetch, token: 't', pageSize: 100, sleepFn: noSleep });
  assert.equal(calls, 4); // 2 queries x 2 pages (150 total -> 2 pages)
  assert.equal(repos.length, 4); // s1/s2 + u1/u2, s1==u1 deduped by full_name
});

test('SEARCH_QUERIES: star-segmented queries cover the full range', () => {
  assert.ok(SEARCH_QUERIES.length >= 6);
  for (const q of SEARCH_QUERIES) assert.ok(q.startsWith('topic:dsh-plugin '));
  assert.ok(SEARCH_QUERIES.some((q) => q.includes('stars:>=1000')));
  assert.ok(SEARCH_QUERIES.some((q) => q.includes('stars:100..499')));
  assert.ok(SEARCH_QUERIES.includes('topic:dsh-plugin stars:3'));
  assert.ok(SEARCH_QUERIES.includes('topic:dsh-plugin stars:1'));
  assert.ok(SEARCH_QUERIES.includes('topic:dsh-plugin stars:0'));
});

for (const stars of ['stars:0', 'stars:1']) {
  test(`searchTopicRepos: saturated ${stars} subdivides into deterministic disjoint dates`, async () => {
    const requested = [];
    const repos = await searchTopicRepos({
      queries: [`topic:dsh-plugin ${stars}`], sorts: ['stars'], token: 't',
      creationStart: '2026-01-01', creationEnd: '2026-01-02', segmentBudget: 10,
      sleepFn: noSleep,
      fetchFn: async (url) => {
        const query = new URL(url).searchParams.get('q');
        requested.push(query);
        return { status: 200, headers: new Map(), json: async () => ({ total_count: query.includes('created:') ? 0 : 1000, items: [] }) };
      },
    });
    assert.deepEqual(requested.slice(1), [
      `topic:dsh-plugin ${stars} created:2026-01-01..2026-01-01`,
      `topic:dsh-plugin ${stars} created:2026-01-02..2026-01-02`,
    ]);
    assert.equal(repos.diagnostics.subdivided, true);
    assert.deepEqual(bisectDateRange('2026-01-01', '2026-01-02'), [
      { start: '2026-01-01', end: '2026-01-01' }, { start: '2026-01-02', end: '2026-01-02' },
    ]);
  });
}

test('searchTopicRepos: unresolved one-day saturation is explicit', async () => {
  const repos = await searchTopicRepos({ queries: ['topic:dsh-plugin stars:1 created:2026-01-01..2026-01-01'], sorts: ['stars'], token: 't', sleepFn: noSleep, fetchFn: async () => ({ status: 200, headers: new Map(), json: async () => ({ total_count: 1000, items: [] }) }) });
  assert.equal(repos.diagnostics.unresolvedCappedSegments[0].reason, 'one-day-saturated');
  assert.equal(repos.diagnostics.completeCoverageClaimed, false);
});

test('searchTopicRepos: segment budget exhaustion is explicit', async () => {
  const repos = await searchTopicRepos({ queries: ['topic:dsh-plugin stars:1'], sorts: ['stars'], token: 't', creationStart: '2026-01-01', creationEnd: '2026-01-02', segmentBudget: 1, sleepFn: noSleep, fetchFn: async () => ({ status: 200, headers: new Map(), json: async () => ({ total_count: 1000, items: [] }) }) });
  assert.ok(repos.diagnostics.unresolvedCappedSegments.every((item) => item.reason === 'segment-budget-exhausted'));
  assert.equal(repos.diagnostics.completeCoverageClaimed, false);
});

test('searchTopicRepos: default traversal continues beyond the former 100-segment boundary', async () => {
  const repos = await searchTopicRepos({
    queries: ['topic:dsh-plugin stars:0'], sorts: ['stars'], token: 't', sleepFn: noSleep,
    creationStart: '2026-01-01', creationEnd: '2026-07-19',
    fetchFn: async (url) => {
      const query = new URL(url).searchParams.get('q');
      const match = /created:(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})/.exec(query);
      if (!match) return { status: 200, headers: new Map(), json: async () => ({ total_count: 1000, items: [] }) };
      const days = (Date.parse(match[2]) - Date.parse(match[1])) / 86_400_000 + 1;
      return { status: 200, headers: new Map(), json: async () => ({ total_count: days > 4 ? 1000 : days, items: [] }) };
    },
  });
  assert.ok(repos.diagnostics.segmentsAttempted > 100);
  assert.equal(repos.diagnostics.completeCoverageClaimed, true);
  assert.deepEqual(repos.diagnostics.unresolvedCappedSegments, []);
});

test('searchTopicRepos: saturated page-one subdivision requests are rate-aware', async () => {
  const waits = [];
  const requested = [];
  await searchTopicRepos({
    queries: ['topic:dsh-plugin stars:0'], sorts: ['stars'], token: 't',
    creationStart: '2026-01-01', creationEnd: '2026-01-02',
    nowFn: () => 1_000_000,
    sleepFn: async (ms) => waits.push(ms),
    fetchFn: async (url) => {
      const query = new URL(url).searchParams.get('q');
      requested.push(query);
      return {
        status: 200,
        headers: new Map([['x-ratelimit-remaining', '2'], ['x-ratelimit-reset', '1003']]),
        json: async () => ({ total_count: query.includes('created:') ? 0 : 1000, items: [] }),
      };
    },
  });
  assert.equal(requested.length, 3);
  assert.deepEqual(waits, [1_000_000, 1_000_000, 1_000_000].map(() => 1500));
});

test('searchTopicRepos: diagnostics count only uncapped disjoint leaves, not parents and children', async () => {
  const repos = await searchTopicRepos({
    queries: ['topic:dsh-plugin stars:0'], sorts: ['stars'], token: 't', sleepFn: noSleep,
    creationStart: '2026-01-01', creationEnd: '2026-01-02',
    fetchFn: async (url) => {
      const query = new URL(url).searchParams.get('q');
      const total = !query.includes('created:') ? 1000 : query.includes('01..2026-01-01') ? 4 : 6;
      return { status: 200, headers: new Map(), json: async () => ({ total_count: total, items: [] }) };
    },
  });
  assert.equal(repos.diagnostics.totalCountObservations, 3);
  assert.equal(repos.diagnostics.resolvedLeafTotalCount, 10);
  assert.equal(repos.diagnostics.uniqueRepositories, 0);
  assert.equal('reportedTotal' in repos.diagnostics, false);
  assert.equal(repos.diagnostics.completeCoverageClaimed, true);
});

test('searchTopicRepos: incomplete page one subdivides and cannot resolve its parent', async () => {
  const requested = [];
  const repos = await searchTopicRepos({
    queries: ['topic:dsh-plugin stars:0'], sorts: ['stars'], token: 't', sleepFn: noSleep,
    creationStart: '2026-01-01', creationEnd: '2026-01-02',
    fetchFn: async (url) => {
      const query = new URL(url).searchParams.get('q');
      requested.push(query);
      return {
        status: 200, headers: new Map(),
        json: async () => ({ total_count: query.includes('created:') ? 2 : 10, incomplete_results: !query.includes('created:'), items: [] }),
      };
    },
  });
  assert.equal(requested.length, 3);
  assert.equal(repos.diagnostics.resolvedLeaves, 2);
  assert.equal(repos.diagnostics.resolvedLeafTotalCount, 4);
  assert.equal(repos.diagnostics.completeCoverageClaimed, true);
});

test('searchTopicRepos: an incomplete later page leaves a one-day query unresolved', async () => {
  const repos = await searchTopicRepos({
    queries: ['topic:dsh-plugin stars:0 created:2026-01-01..2026-01-01'],
    sorts: ['stars'], token: 't', sleepFn: noSleep, pageSize: 100,
    fetchFn: async (url) => {
      const page = Number(new URL(url).searchParams.get('page'));
      return {
        status: 200, headers: new Map(),
        json: async () => ({ total_count: 150, incomplete_results: page === 2, items: [] }),
      };
    },
  });
  assert.equal(repos.diagnostics.resolvedLeaves, 0);
  assert.equal(repos.diagnostics.resolvedLeafTotalCount, 0);
  assert.equal(repos.diagnostics.unresolvedCappedSegments[0].reason, 'search-incomplete');
  assert.equal(repos.diagnostics.completeCoverageClaimed, false);
});

test('fetchRawPackageJson: uses raw first even when a token is set', async () => {
  const calls = [];
  const fakeFetch = async (url, opts) => {
    calls.push({ url, headers: opts.headers });
    return { status: 200, text: async () => '{"name":"x"}' };
  };
  const text = await fetchRawPackageJson('owner', 'name', 'main', {
    fetchFn: fakeFetch,
    token: 'tok',
  });
  assert.equal(text, '{"name":"x"}');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.startsWith('https://raw.githubusercontent.com/owner/name/main/package.json'));
  assert.equal(calls[0].headers.Authorization, undefined);
});

test('fetchRawPackageJson: falls back to the raw URL without a token', async () => {
  let called;
  const fakeFetch = async (url, opts) => {
    called = { url, headers: opts.headers };
    return { status: 200, text: async () => '{"name":"x"}' };
  };
  await fetchRawPackageJson('owner', 'name', 'main', { fetchFn: fakeFetch });
  assert.ok(called.url.startsWith('https://raw.githubusercontent.com/owner/name/main/package.json'));
  assert.equal(called.headers.Authorization, undefined);
});

test('fetchRawPackageJson: confirmed raw 404 does not fall back', async () => {
  let calls = 0;
  const notFound = await fetchRawPackageJson('owner', 'name', 'main', {
    token: 'tok',
    fetchFn: async () => {
      calls++;
      return { status: 404, text: async () => '' };
    },
  });
  assert.equal(notFound, null);
  assert.equal(calls, 1);
});

test('fetchRawPackageJsonResult: authenticated API fallback recovers a transient raw failure', async () => {
  const calls = [];
  const result = await fetchRawPackageJsonResult('owner', 'name', 'main', {
    token: 'tok',
    fetchFn: async (url, opts) => {
      calls.push({ url, headers: opts.headers });
      if (calls.length === 1) return { status: 503, headers: new Map() };
      return { status: 200, headers: new Map(), text: async () => '{"name":"x"}' };
    },
  });
  assert.equal(result.kind, 'success');
  assert.equal(result.fallbackRecovered, true);
  assert.equal(result.rawFetches, 1);
  assert.equal(result.apiFallbacks, 1);
  assert.ok(calls[1].url.startsWith('https://api.github.com/repos/owner/name/contents/package.json'));
  assert.equal(calls[1].headers.Authorization, 'Bearer tok');
});

test('fetchRawPackageJsonResult: API fallback honors retry headers and retains transient failure', async () => {
  const waits = [];
  let calls = 0;
  const result = await fetchRawPackageJsonResult('owner', 'name', 'main', {
    token: 'tok',
    retries: 1,
    fetchFn: async () => {
      calls++;
      if (calls === 1) return { status: 503, headers: new Map() };
      return { status: 429, headers: new Map([['retry-after', '7']]) };
    },
    sleepFn: async (ms) => waits.push(ms),
  });
  assert.equal(result.kind, 'transient-failure');
  assert.equal(result.apiFallbacks, 1);
  assert.equal(calls, 3);
  assert.deepEqual(waits, [7000]);
});
