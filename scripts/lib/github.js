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

export async function searchTopicRepos({
  queries = ['topic:dsh-plugin', 'topic:dsh-plugin'],
  sorts = ['stars', 'updated'],
  fetchFn = fetch,
  token,
  pageSize = 100,
  onPage,
} = {}) {
  const seen = new Map();
  for (let qi = 0; qi < queries.length; qi++) {
    let page = 1;
    let totalPages = Infinity;
    while (page <= totalPages && page <= 10) {
      const q = `q=${encodeURIComponent(queries[qi])}&sort=${sorts[qi]}&order=desc&per_page=${pageSize}&page=${page}`;
      const data = await gitRequest(
        `https://api.github.com/search/repositories?${q}`,
        { fetchFn, token },
      );
      if (!data) break;
      totalPages = Math.ceil((data.total_count || 0) / pageSize) || 1;
      for (const item of data.items || []) {
        const norm = normalizeRepo(item);
        const key = norm.full_name.toLowerCase();
        if (!seen.has(key)) seen.set(key, norm);
      }
      onPage?.({ query: queries[qi], page, total: data.total_count });
      page++;
      // Unauthenticated search quota is 10 req/min; keep a safe pace.
      if (!token) await sleep(6500);
      else await sleep(1100);
    }
  }
  return [...seen.values()];
}

export async function fetchRawPackageJson(
  owner,
  repo,
  branch,
  { fetchFn = fetch, retries = 2 } = {},
) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/package.json`;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetchFn(url, {
        headers: UA,
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 200) return await res.text();
      if (res.status === 404) return null;
    } catch {
      // Network/abort errors are treated as a failed fetch attempt.
    }
    if (attempt < retries) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    return null;
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
