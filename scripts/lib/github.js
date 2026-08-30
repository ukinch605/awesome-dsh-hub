const UA = { 'User-Agent': 'dsh-hub' };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gitRequest(url, { fetchFn = fetch, token, retries = 5 } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetchFn(url, {
        headers: { ...UA, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      if (attempt < retries) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw new Error(`GitHub API network failure for ${url}`);
    }
    if (res.status === 200) {
      const remaining = Number(res.headers.get('x-ratelimit-remaining') ?? -1);
      if (remaining >= 0 && remaining <= 2) {
        const reset = Number(res.headers.get('x-ratelimit-reset') ?? 0) * 1000;
        const wait = Math.max(0, reset - Date.now()) + 1000;
        if (wait > 0 && wait < 120_000) await sleep(wait);
      }
      return res.json();
    }
    if (res.status === 404) return null;
    if ((res.status === 403 || res.status === 429) && attempt < retries) {
      const resetSec = Number(res.headers.get('x-ratelimit-reset') ?? 0);
      const retryAfter = Number(res.headers.get('retry-after') ?? 0);
      const wait =
        Math.max(retryAfter * 1000, resetSec ? resetSec * 1000 - Date.now() : 0) +
        1000;
      await sleep(Math.min(Math.max(wait, 2000), 120_000));
      continue;
    }
    throw new Error(`GitHub API ${res.status} for ${url}`);
  }
}

export function normalizeRepo(item) {
  return {
    id: item.id ?? null,
    full_name: item.full_name,
    owner: item.owner?.login,
    name: item.name,
    html_url: item.html_url,
    description: item.description || '',
    stars: item.stargazers_count ?? 0,
    license: item.license?.spdx_id || null,
    pushed_at: item.pushed_at,
    archived: Boolean(item.archived),
    fork: Boolean(item.fork),
    default_branch: item.default_branch,
    topics: Array.isArray(item.topics) ? item.topics : [],
  };
}

export function packageMetadata(packageJsonText) {
  try {
    const pkg = JSON.parse(packageJsonText);
    return {
      packageName: typeof pkg.name === 'string' ? pkg.name : null,
      packageVersion: typeof pkg.version === 'string' ? pkg.version : null,
    };
  } catch {
    return { packageName: null, packageVersion: null };
  }
}

export function subdivideCreatedRange(query) {
  const match = query.match(/created:(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})/);
  if (!match) return [];
  const start = Date.parse(`${match[1]}T00:00:00Z`);
  const end = Date.parse(`${match[2]}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return [];
  const day = 86_400_000;
  const midpoint = start + Math.floor((end - start) / day / 2) * day;
  const rightStart = midpoint + day;
  const date = (value) => new Date(value).toISOString().slice(0, 10);
  return [
    query.replace(match[0], `created:${match[1]}..${date(midpoint)}`),
    query.replace(match[0], `created:${date(rightStart)}..${match[2]}`),
  ];
}

export async function searchTopicRepos({
  queries = ['topic:dsh-plugin', 'topic:dsh-plugin'],
  sorts = ['stars', 'updated'],
  fetchFn = fetch,
  token,
  pageSize = 100,
  onPage,
  onSegment,
  sleepFn = sleep,
  maxSegments = 256,
} = {}) {
  const seen = new Map();
  const queue = queries.map((query, index) => ({ query, sort: sorts[index], subdivisionDepth: 0 }));
  let processed = 0;
  while (queue.length > 0) {
    const segment = queue.shift();
    processed++;
    const segmentRepos = new Set();
    let reportedTotal = 0;
    let pagesFetched = 0;
    let subdivisions = [];
    let page = 1;
    let totalPages = Infinity;
    while (page <= totalPages && page <= 10) {
      const q = `q=${encodeURIComponent(segment.query)}&sort=${segment.sort}&order=desc&per_page=${pageSize}&page=${page}`;
      const data = await gitRequest(
        `https://api.github.com/search/repositories?${q}`,
        { fetchFn, token },
      );
      if (!data) break;
      reportedTotal = data.total_count || 0;
      pagesFetched++;
      if (page === 1 && reportedTotal >= 1000 && processed + queue.length + 2 <= maxSegments) {
        subdivisions = subdivideCreatedRange(segment.query);
        if (subdivisions.length > 0) {
          queue.push(...subdivisions.map((query) => ({
            query,
            sort: segment.sort,
            subdivisionDepth: segment.subdivisionDepth + 1,
          })));
          break;
        }
      }
      totalPages = Math.ceil((data.total_count || 0) / pageSize) || 1;
      for (const item of data.items || []) {
        const norm = normalizeRepo(item);
        const key = norm.full_name.toLowerCase();
        segmentRepos.add(key);
        if (!seen.has(key)) seen.set(key, norm);
      }
      onPage?.({ query: segment.query, page, total: data.total_count });
      page++;
      // Unauthenticated search quota is 10 req/min; keep a safe pace.
      if (!token) await sleepFn(6500);
      else await sleepFn(1100);
    }
    onSegment?.({
      query: segment.query,
      reportedTotal,
      pagesFetched,
      uniqueRepositories: segmentRepos.size,
      reachedSearchCeiling: reportedTotal >= 1000,
      subdivided: subdivisions.length > 0,
      subdivisionDepth: segment.subdivisionDepth,
    });
  }
  return [...seen.values()];
}

export async function verifyRepositoryAdmission(repo, {
  fetchFn = fetch,
  token = '',
  fetchManifest = fetchRawPackageJsonResult,
} = {}) {
  let item;
  try {
    item = await gitRequest(`https://api.github.com/repos/${repo}`, { fetchFn, token, retries: 1 });
  } catch {
    return { kind: 'transient-failure', reason: 'repository metadata unavailable' };
  }
  if (!item) return { kind: 'confirmed-ineligible', reason: 'repository-not-found' };
  const repository = normalizeRepo(item);
  if (repository.archived) return { kind: 'confirmed-ineligible', reason: 'repository-archived' };
  if (!repository.default_branch) return { kind: 'confirmed-ineligible', reason: 'no-default-branch' };
  if (!repository.topics.includes('dsh-plugin')) return { kind: 'confirmed-ineligible', reason: 'topic-removed' };
  const manifest = await fetchManifest(repository.owner, repository.name, repository.default_branch, { fetchFn, token });
  if (manifest.kind === 'transient-failure') return manifest;
  if (manifest.kind !== 'success') return { kind: 'confirmed-ineligible', reason: 'manifest-missing' };
  if (!hasBundlePatch(manifest.text)) return { kind: 'confirmed-ineligible', reason: 'manifest-no-longer-admitted' };
  return { kind: 'eligible', repository };
}

export async function fetchRawPackageJson(
  owner,
  repo,
  branch,
  { fetchFn = fetch, retries = 2, token = '' } = {},
) {
  const result = await fetchRawPackageJsonResult(owner, repo, branch, { fetchFn, retries, token });
  return result.kind === 'success' ? result.text : null;
}

export async function fetchRawPackageJsonResult(
  owner,
  repo,
  branch,
  { fetchFn = fetch, retries = 2, token = '', sleepFn = sleep } = {},
) {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/package.json`;
  try {
    const res = await fetchFn(rawUrl, {
      headers: UA,
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status === 200) {
      return { kind: 'success', text: await res.text(), rawFetches: 1, apiFallbacks: 0 };
    }
    // A raw 404 is authoritative and must not spend API quota on a fallback.
    if (res.status === 404) {
      return { kind: 'confirmed-missing', rawFetches: 1, apiFallbacks: 0 };
    }
  } catch {
    // Network and timeout errors may be recovered by the authenticated API.
  }

  if (!token) {
    return { kind: 'transient-failure', rawFetches: 1, apiFallbacks: 0 };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/package.json?ref=${encodeURIComponent(branch)}`;
  const headers = {
    ...UA,
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.raw+json',
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetchFn(apiUrl, {
        headers,
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 200) {
        return {
          kind: 'success',
          text: await res.text(),
          rawFetches: 1,
          apiFallbacks: 1,
          fallbackRecovered: true,
        };
      }
      if (res.status === 404) {
        return { kind: 'confirmed-missing', rawFetches: 1, apiFallbacks: 1 };
      }
      if (attempt < retries) {
        const retryAfter = Number(res.headers?.get?.('retry-after') ?? 0) * 1000;
        const resetAt = Number(res.headers?.get?.('x-ratelimit-reset') ?? 0) * 1000;
        const rateLimitWait = resetAt ? Math.max(0, resetAt - Date.now()) + 1000 : 0;
        const backoff = 1500 * (attempt + 1);
        await sleepFn(Math.min(Math.max(retryAfter, rateLimitWait, backoff), 120_000));
        continue;
      }
    } catch {
      // Network/abort errors are treated as a failed fetch attempt.
    }
    if (attempt < retries) {
      await sleepFn(1500 * (attempt + 1));
      continue;
    }
    return { kind: 'transient-failure', rawFetches: 1, apiFallbacks: 1 };
  }
}

export function hasBundlePatch(packageJsonText) {
  if (!packageJsonText) return false;
  try {
    const pkg = JSON.parse(packageJsonText);
    return Boolean(pkg?.dsh?.bundle?.patch);
  } catch {
    return false;
  }
}
