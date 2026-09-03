const UA = { 'User-Agent': 'dsh-hub' };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(headers, now = Date.now()) {
  const value = headers?.get?.('retry-after');
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : 0;
}

async function gitRequest(url, {
  fetchFn = fetch, token, retries = 5, sleepFn = sleep, onResponse,
} = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetchFn(url, {
        headers: { ...UA, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      if (attempt < retries) {
        await sleepFn(2000 * (attempt + 1));
        continue;
      }
      throw new Error(`GitHub API network failure for ${url}`);
    }
    if (res.status === 200) {
      if (onResponse) {
        await onResponse(res);
      } else {
        // Preserve the low-quota protection for non-search API requests.
        const remaining = Number(res.headers.get('x-ratelimit-remaining') ?? -1);
        if (remaining >= 0 && remaining <= 2) {
          const reset = Number(res.headers.get('x-ratelimit-reset') ?? 0) * 1000;
          const wait = Math.max(0, reset - Date.now()) + 1000;
          if (wait > 0 && wait < 120_000) await sleepFn(wait);
        }
      }
      return res.json();
    }
    if (res.status === 404) return null;
    if ((res.status === 403 || res.status === 429) && attempt < retries) {
      const resetSec = Number(res.headers.get('x-ratelimit-reset') ?? 0);
      const retryAfter = retryAfterMs(res.headers);
      const wait =
        Math.max(retryAfter, resetSec ? resetSec * 1000 - Date.now() : 0) +
        1000;
      await sleepFn(Math.min(Math.max(wait, 2000), 120_000));
      continue;
    }
    throw new Error(`GitHub API ${res.status} for ${url}`);
  }
}

const DAY_MS = 86_400_000;
const isoDay = (value) => new Date(value).toISOString().slice(0, 10);

export function bisectDateRange(start, end) {
  const first = Date.parse(`${start}T00:00:00Z`);
  const last = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first >= last) return null;
  const leftEnd = first + Math.floor((last - first) / (2 * DAY_MS)) * DAY_MS;
  return [
    { start, end: isoDay(leftEnd) },
    { start: isoDay(leftEnd + DAY_MS), end },
  ];
}

function withCreatedRange(query, start, end) {
  return `${query} created:${start}..${end}`;
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

// The old limit was already observed to leave work queued at 100. 512 keeps
// traversal finite while allowing over five times that measured workload; a
// genuinely larger or pathological topic still produces explicit leaves.
export const DEFAULT_SEGMENT_BUDGET = 512;

export async function searchTopicRepos({
  queries = ['topic:dsh-plugin', 'topic:dsh-plugin'],
  sorts = ['stars', 'updated'],
  fetchFn = fetch,
  token,
  pageSize = 100,
  onPage,
  segmentBudget = DEFAULT_SEGMENT_BUDGET,
  creationStart = '2008-01-01',
  creationEnd = isoDay(Date.now()),
  sleepFn = sleep,
  nowFn = Date.now,
} = {}) {
  const seen = new Map();
  const diagnostics = {
    configuredSegments: queries.length, resolvedSegments: 0,
    segmentsAttempted: 0, resolvedLeaves: 0, resolvedLeafTotalCount: 0,
    totalCountObservations: 0, pagesFetched: 0,
    capped: false, subdivided: false, unresolvedCappedSegments: [],
  };
  const paceSearchResponse = async (res) => {
    const fallback = token ? 1100 : 6500;
    const remaining = Number(res.headers?.get?.('x-ratelimit-remaining') ?? -1);
    const resetAt = Number(res.headers?.get?.('x-ratelimit-reset') ?? 0) * 1000;
    let wait = Math.max(fallback, retryAfterMs(res.headers, nowFn()));
    if (remaining >= 0 && resetAt > nowFn()) {
      // Spread the remaining quota across its reset window instead of waiting
      // until a request has already failed or the quota is nearly empty.
      wait = Math.max(wait, Math.ceil((resetAt - nowFn()) / Math.max(remaining, 1)));
    }
    await sleepFn(Math.min(wait, 120_000));
  };
  for (let qi = 0; qi < queries.length; qi++) {
    const unresolvedBefore = diagnostics.unresolvedCappedSegments.length;
    const pending = [{ query: queries[qi], start: null, end: null }];
    while (pending.length) {
      const segment = pending.shift();
      if (diagnostics.segmentsAttempted >= segmentBudget) {
        diagnostics.capped = true;
        diagnostics.unresolvedCappedSegments.push({ query: segment.query, reason: 'segment-budget-exhausted' });
        for (const rest of pending.splice(0)) diagnostics.unresolvedCappedSegments.push({ query: rest.query, reason: 'segment-budget-exhausted' });
        break;
      }
      diagnostics.segmentsAttempted++;
      const requestPage = async (page) => {
        const q = `q=${encodeURIComponent(segment.query)}&sort=${sorts[qi]}&order=desc&per_page=${pageSize}&page=${page}`;
        const data = await gitRequest(`https://api.github.com/search/repositories?${q}`, {
          fetchFn, token, sleepFn, onResponse: paceSearchResponse,
        });
        diagnostics.pagesFetched++;
        for (const item of data?.items || []) {
          const norm = normalizeRepo(item);
          const key = norm.id == null ? norm.full_name.toLowerCase() : String(norm.id);
          if (!seen.has(key)) seen.set(key, norm);
        }
        onPage?.({ query: segment.query, page, total: data?.total_count || 0 });
        return data;
      };
      const first = await requestPage(1);
      diagnostics.totalCountObservations++;
      if (!first) {
        diagnostics.unresolvedCappedSegments.push({ query: segment.query, reason: 'search-response-missing' });
        continue;
      }
      const subdivideOrRecord = (data, reason) => {
        const created = /(?:^|\s)created:(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})(?:\s|$)/.exec(segment.query);
        const start = created?.[1] || creationStart;
        const end = created?.[2] || creationEnd;
        const halves = bisectDateRange(start, end);
        if (!halves) {
          diagnostics.unresolvedCappedSegments.push({
            query: withCreatedRange(segment.query.replace(/\s+created:[^\s]+/, ''), start, end),
            reportedTotal: data.total_count,
            reason,
          });
        } else {
          diagnostics.subdivided = true;
          const base = segment.query.replace(/\s+created:[^\s]+/, '');
          pending.unshift(...halves.map((range) => ({ ...range, query: withCreatedRange(base, range.start, range.end) })));
        }
      };
      if ((first.total_count || 0) >= 1000 || first.incomplete_results === true) {
        const saturated = (first.total_count || 0) >= 1000;
        if (saturated) diagnostics.capped = true;
        subdivideOrRecord(first, first.incomplete_results === true ? 'search-incomplete' : 'one-day-saturated');
        continue;
      }
      const totalPages = Math.min(10, Math.ceil((first.total_count || 0) / pageSize) || 1);
      let incomplete = false;
      for (let page = 2; page <= totalPages; page++) {
        const data = await requestPage(page);
        diagnostics.totalCountObservations++;
        if (data?.incomplete_results === true) incomplete = true;
      }
      if (incomplete) {
        subdivideOrRecord(first, 'search-incomplete');
        continue;
      }
      diagnostics.resolvedLeaves++;
      diagnostics.resolvedLeafTotalCount += first.total_count || 0;
    }
    if (diagnostics.unresolvedCappedSegments.length === unresolvedBefore) diagnostics.resolvedSegments++;
  }
  const repositories = [...seen.values()];
  diagnostics.uniqueRepositories = repositories.length;
  diagnostics.completeCoverageClaimed =
    diagnostics.resolvedSegments === diagnostics.configuredSegments &&
    diagnostics.unresolvedCappedSegments.length === 0;
  Object.defineProperty(repositories, 'diagnostics', { value: diagnostics, enumerable: false });
  return repositories;
}

export async function verifyRepositoryAdmission(repo, { fetchFn = fetch, token } = {}) {
  let metadata;
  try {
    metadata = await gitRequest(`https://api.github.com/repositories/${repo.repositoryId}`, { fetchFn, token, retries: 2 });
  } catch {
    return { kind: 'transient-failure' };
  }
  if (!metadata) return { kind: 'confirmed-removed', reason: 'repository-not-found' };
  if (metadata.archived || metadata.fork) return { kind: 'confirmed-removed', reason: metadata.archived ? 'archived' : 'fork' };
  if (!metadata.default_branch) return { kind: 'confirmed-removed', reason: 'no-default-branch' };
  if (!Array.isArray(metadata.topics)) return { kind: 'transient-failure' };
  if (!metadata.topics.includes('dsh-plugin')) return { kind: 'confirmed-removed', reason: 'topic-removed' };
  const manifest = await fetchRawPackageJsonResult(metadata.owner.login, metadata.name, metadata.default_branch, { fetchFn, token });
  if (manifest.kind === 'transient-failure') return manifest;
  if (manifest.kind === 'confirmed-missing') return { kind: 'confirmed-removed', reason: 'package-json-missing' };
  if (!hasBundlePatch(manifest.text)) return { kind: 'confirmed-removed', reason: 'admission-signal-missing' };
  return { kind: 'eligible', repository: normalizeRepo(metadata) };
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
