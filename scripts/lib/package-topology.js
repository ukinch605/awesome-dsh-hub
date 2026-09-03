import crypto from 'node:crypto';

const UA = { 'User-Agent': 'dsh-hub-package-topology' };
export const PACKAGE_TOPOLOGY_SCHEMA_VERSION = 1;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function retryAfterMs(headers, now = Date.now()) {
  const value = headers?.get?.('retry-after');
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : 0;
}

async function apiRequest(url, {
  token = '', fetchFn = fetch, sleepFn = sleep, retries = 3, stats,
} = {}) {
  for (let attempt = 0; ; attempt++) {
    let response;
    try {
      if (stats) stats.apiRequests = (stats.apiRequests || 0) + 1;
      response = await fetchFn(url, {
        headers: { ...UA, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      if (attempt < retries) {
        await sleepFn(1000 * (attempt + 1));
        continue;
      }
      throw new Error(`GitHub API network failure for ${url}`);
    }

    if (response.status === 200) {
      const remaining = Number(response.headers?.get?.('x-ratelimit-remaining') ?? -1);
      const resetAt = Number(response.headers?.get?.('x-ratelimit-reset') ?? 0) * 1000;
      let wait = 100;
      if (remaining >= 0 && remaining < 100 && resetAt > Date.now()) {
        wait = Math.max(wait, Math.ceil((resetAt - Date.now()) / Math.max(remaining, 1)));
      }
      await sleepFn(Math.min(wait, 30_000));
      return response.json();
    }
    if (response.status === 404) return null;
    if ((response.status === 403 || response.status === 429) && attempt < retries) {
      const resetAt = Number(response.headers?.get?.('x-ratelimit-reset') ?? 0) * 1000;
      const wait = Math.max(
        1000 * (attempt + 1),
        retryAfterMs(response.headers),
        resetAt ? resetAt - Date.now() + 1000 : 0,
      );
      await sleepFn(Math.min(Math.max(wait, 1000), 120_000));
      continue;
    }
    throw new Error(`GitHub API ${response.status} for ${url}`);
  }
}

function deterministicKey(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function selectRepositories(repositories, { limit = 150, includeRepos = [] } = {}) {
  const byId = new Map();
  for (const item of repositories || []) {
    if (item?.repositoryId == null || typeof item.repo !== 'string') continue;
    byId.set(String(item.repositoryId), item);
  }
  const byRepo = new Map([...byId.values()].map((item) => [item.repo.toLowerCase(), item]));
  const selected = [];
  const selectedIds = new Set();
  for (const repo of includeRepos || []) {
    if (selected.length >= limit) break;
    const item = byRepo.get(String(repo).trim().toLowerCase());
    const id = item && String(item.repositoryId);
    if (!item || selectedIds.has(id)) continue;
    selected.push(item);
    selectedIds.add(id);
  }
  const remaining = [...byId.values()]
    .filter((item) => !selectedIds.has(String(item.repositoryId)))
    .sort((a, b) => deterministicKey(a.repositoryId).localeCompare(deterministicKey(b.repositoryId)));
  for (const item of remaining) {
    if (selected.length >= limit) break;
    selected.push(item);
  }
  return selected;
}

function isCandidateManifestPath(item) {
  if (!item || item.type !== 'blob' || typeof item.path !== 'string') return false;
  if (item.path !== 'package.json' && !item.path.endsWith('/package.json')) return false;
  return !item.path.split('/').includes('node_modules');
}

export function candidateManifestPaths(treeResponse, { limit = 100 } = {}) {
  const all = [...new Set((treeResponse?.tree || [])
    .filter(isCandidateManifestPath)
    .map((item) => item.path))]
    .sort((a, b) => a.localeCompare(b));
  return {
    paths: all.slice(0, limit),
    total: all.length,
    boundExhausted: all.length > limit,
  };
}

export function classifyPackageManifest(text) {
  let pkg;
  try {
    pkg = JSON.parse(text);
  } catch {
    return { kind: 'invalid', packageName: null, packageVersion: null, bundleSignal: false };
  }
  const packageName = typeof pkg?.name === 'string' ? pkg.name : null;
  const packageVersion = typeof pkg?.version === 'string' ? pkg.version : null;
  const bundleSignal = Boolean(pkg?.dsh?.bundle?.patch);
  return {
    kind: bundleSignal ? 'bundle' : 'non-bundle',
    packageName,
    packageVersion,
    bundleSignal,
  };
}

async function fetchManifest(owner, repo, branch, manifestPath, {
  fetchFn = fetch, sleepFn = sleep, retries = 2, stats,
} = {}) {
  const encodedPath = manifestPath.split('/').map(encodeURIComponent).join('/');
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${encodedPath}`;
  for (let attempt = 0; ; attempt++) {
    try {
      if (stats) stats.rawFetches = (stats.rawFetches || 0) + 1;
      const response = await fetchFn(url, { headers: UA, signal: AbortSignal.timeout(20_000) });
      if (response.status === 200) return { kind: 'success', text: await response.text() };
      if (response.status === 404) return { kind: 'confirmed-missing' };
    } catch {
      // Retry bounded transient raw failures; never reinterpret them as absence.
    }
    if (attempt < retries) {
      await sleepFn(500 * (attempt + 1));
      continue;
    }
    return { kind: 'transient-failure' };
  }
}

export async function scanRepository(stateEntry, {
  token = '', fetchFn = fetch, sleepFn = sleep, manifestLimit = 100,
} = {}) {
  const stats = { apiRequests: 0, rawFetches: 0 };
  const base = {
    repositoryId: String(stateEntry.repositoryId),
    repo: stateEntry.repo,
    defaultBranch: null,
    topicPresent: null,
    complete: false,
    incompleteReasons: [],
    treeTruncated: false,
    candidateManifestCount: 0,
    manifestsExamined: 0,
    manifests: [],
    stats,
  };

  let metadata;
  try {
    metadata = await apiRequest(`https://api.github.com/repositories/${stateEntry.repositoryId}`, {
      token, fetchFn, sleepFn, stats,
    });
  } catch {
    return { ...base, incompleteReasons: ['repository-metadata-transient'] };
  }
  if (!metadata) return { ...base, incompleteReasons: ['repository-missing'] };
  if (!metadata.default_branch || !metadata.owner?.login || !metadata.name) {
    return { ...base, incompleteReasons: ['repository-metadata-incomplete'] };
  }

  base.repo = metadata.full_name || base.repo;
  base.defaultBranch = metadata.default_branch;
  base.topicPresent = Array.isArray(metadata.topics) ? metadata.topics.includes('dsh-plugin') : null;

  let tree;
  try {
    tree = await apiRequest(
      `https://api.github.com/repos/${metadata.owner.login}/${metadata.name}/git/trees/${encodeURIComponent(metadata.default_branch)}?recursive=1`,
      { token, fetchFn, sleepFn, stats },
    );
  } catch {
    return { ...base, incompleteReasons: ['tree-transient'] };
  }
  if (!tree) return { ...base, incompleteReasons: ['tree-missing'] };

  const candidates = candidateManifestPaths(tree, { limit: manifestLimit });
  base.treeTruncated = Boolean(tree.truncated);
  base.candidateManifestCount = candidates.total;
  if (base.treeTruncated) base.incompleteReasons.push('tree-truncated');
  if (candidates.boundExhausted) base.incompleteReasons.push('manifest-limit-exhausted');

  for (const manifestPath of candidates.paths) {
    const result = await fetchManifest(
      metadata.owner.login,
      metadata.name,
      metadata.default_branch,
      manifestPath,
      { fetchFn, sleepFn, stats },
    );
    if (result.kind === 'transient-failure') {
      base.incompleteReasons.push(`manifest-transient:${manifestPath}`);
      base.manifests.push({
        path: manifestPath,
        root: manifestPath === 'package.json',
        kind: 'transient',
        packageName: null,
        packageVersion: null,
        bundleSignal: false,
      });
      continue;
    }
    if (result.kind === 'confirmed-missing') {
      base.incompleteReasons.push(`manifest-missing:${manifestPath}`);
      base.manifests.push({
        path: manifestPath,
        root: manifestPath === 'package.json',
        kind: 'missing',
        packageName: null,
        packageVersion: null,
        bundleSignal: false,
      });
      continue;
    }
    const classification = classifyPackageManifest(result.text);
    base.manifests.push({
      path: manifestPath,
      root: manifestPath === 'package.json',
      ...classification,
    });
  }

  base.manifestsExamined = base.manifests.length;
  base.incompleteReasons = [...new Set(base.incompleteReasons)];
  base.complete = base.incompleteReasons.length === 0;
  return base;
}

export function summarizeTopology(records) {
  const summary = {
    selectedRepositories: records.length,
    repositoriesScannedComplete: 0,
    repositoriesIncomplete: 0,
    repositoriesWithNestedBundles: 0,
    treesTruncated: 0,
    candidateManifests: 0,
    manifestsExamined: 0,
    rootBundles: 0,
    nestedBundles: 0,
    nonBundleManifests: 0,
    invalidManifests: 0,
    transientManifestFailures: 0,
    missingAfterTree: 0,
    apiRequests: 0,
    rawFetches: 0,
  };
  for (const record of records) {
    if (record.complete) summary.repositoriesScannedComplete++;
    else summary.repositoriesIncomplete++;
    if (record.treeTruncated) summary.treesTruncated++;
    summary.candidateManifests += record.candidateManifestCount || 0;
    summary.manifestsExamined += record.manifestsExamined || 0;
    summary.apiRequests += record.stats?.apiRequests || 0;
    summary.rawFetches += record.stats?.rawFetches || 0;
    let nestedBundle = false;
    for (const manifest of record.manifests || []) {
      if (manifest.kind === 'bundle') {
        if (manifest.root) summary.rootBundles++;
        else { summary.nestedBundles++; nestedBundle = true; }
      } else if (manifest.kind === 'non-bundle') summary.nonBundleManifests++;
      else if (manifest.kind === 'invalid') summary.invalidManifests++;
      else if (manifest.kind === 'transient') summary.transientManifestFailures++;
      else if (manifest.kind === 'missing') summary.missingAfterTree++;
    }
    if (nestedBundle) summary.repositoriesWithNestedBundles++;
  }
  return summary;
}

export function buildTopologySnapshot({
  generatedAt,
  observedRepositories,
  selectedRepositories,
  records,
  repoLimit,
  manifestLimit,
  includeRepos = [],
}) {
  const summary = summarizeTopology(records);
  return {
    schemaVersion: PACKAGE_TOPOLOGY_SCHEMA_VERSION,
    generatedAt,
    semantics: 'shadow-package-topology-census',
    source: 'registry/discovery-state.json current observation',
    bounds: {
      repositoryLimit: repoLimit,
      manifestLimitPerRepository: manifestLimit,
      requestedIncludes: includeRepos,
    },
    coverage: {
      observedRepositories,
      selectedRepositories: selectedRepositories.length,
      fullObservedSetScanned: selectedRepositories.length === observedRepositories,
      completeSelectedSample: records.length === selectedRepositories.length && records.every((record) => record.complete),
    },
    summary,
    repositories: records,
  };
}
