import crypto from 'node:crypto';

export const PACKAGE_TOPOLOGY_STATE_SCHEMA_VERSION = 1;
export const DEFAULT_TOPOLOGY_SCAN_LIMIT = 150;
export const DEFAULT_TOPOLOGY_STALE_DAYS = 30;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function repoId(item) {
  const value = item?.id ?? item?.repositoryId;
  return value == null ? null : String(value);
}

function deterministicKey(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function observedMeta(repo) {
  return {
    repositoryId: repoId(repo),
    repo: repo?.full_name ?? repo?.repo ?? null,
    defaultBranch: repo?.default_branch ?? repo?.defaultBranch ?? null,
    repoPushedAt: repo?.pushed_at ?? repo?.repoPushedAt ?? null,
  };
}

function stateMap(state) {
  return new Map((state?.repositories || [])
    .filter((record) => record?.repositoryId != null)
    .map((record) => [String(record.repositoryId), record]));
}

function dateMs(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : null;
}

function currentInventory(record, repo) {
  if (!record?.lastCompleteScanAt) return false;
  const meta = observedMeta(repo);
  return record.lastCompleteDefaultBranch === meta.defaultBranch
    && record.lastCompleteRepoPushedAt === meta.repoPushedAt;
}

function retryDue(record, nowMs) {
  if (!record || record.lastAttemptComplete !== false) return false;
  const next = dateMs(record.nextRetryAt);
  return next == null || next <= nowMs;
}

export function selectTopologyScanTargets(observed, state, {
  limit = DEFAULT_TOPOLOGY_SCAN_LIMIT,
  staleDays = DEFAULT_TOPOLOGY_STALE_DAYS,
  now = Date.now(),
} = {}) {
  const records = stateMap(state);
  const categories = {
    neverScanned: [],
    incompleteRetry: [],
    changed: [],
    staleRevalidation: [],
  };
  let deferredIncomplete = 0;
  let currentInventoryComplete = 0;

  for (const repo of observed || []) {
    const id = repoId(repo);
    if (!id) continue;
    const record = records.get(id);
    if (currentInventory(record, repo)) currentInventoryComplete++;

    if (!record) {
      categories.neverScanned.push(repo);
      continue;
    }

    const meta = observedMeta(repo);
    const changed = Boolean(record.lastCompleteScanAt)
      && (record.lastCompleteDefaultBranch !== meta.defaultBranch
        || record.lastCompleteRepoPushedAt !== meta.repoPushedAt);

    if (record.lastAttemptComplete === false) {
      if (changed || retryDue(record, now)) categories.incompleteRetry.push(repo);
      else deferredIncomplete++;
      continue;
    }

    if (!record.lastCompleteScanAt) {
      if (retryDue(record, now)) categories.incompleteRetry.push(repo);
      else deferredIncomplete++;
      continue;
    }

    if (changed) {
      categories.changed.push(repo);
      continue;
    }

    const completeAt = dateMs(record.lastCompleteScanAt);
    if (completeAt != null && now - completeAt >= staleDays * DAY_MS) {
      categories.staleRevalidation.push(repo);
    }
  }

  const order = ['neverScanned', 'incompleteRetry', 'changed', 'staleRevalidation'];
  for (const key of order) {
    categories[key].sort((a, b) => {
      if (key === 'staleRevalidation') {
        const ar = records.get(repoId(a));
        const br = records.get(repoId(b));
        const byAge = (dateMs(ar?.lastCompleteScanAt) || 0) - (dateMs(br?.lastCompleteScanAt) || 0);
        if (byAge !== 0) return byAge;
      }
      if (key === 'incompleteRetry') {
        const ar = records.get(repoId(a));
        const br = records.get(repoId(b));
        const byRetry = (dateMs(ar?.nextRetryAt) || 0) - (dateMs(br?.nextRetryAt) || 0);
        if (byRetry !== 0) return byRetry;
      }
      return deterministicKey(repoId(a)).localeCompare(deterministicKey(repoId(b)));
    });
  }

  const selected = [];
  const selectedReason = new Map();
  for (const key of order) {
    for (const repo of categories[key]) {
      if (selected.length >= limit) break;
      selected.push(repo);
      selectedReason.set(repoId(repo), key);
    }
    if (selected.length >= limit) break;
  }

  return {
    selected,
    selectedReason,
    diagnostics: {
      scanLimit: limit,
      observedRepositories: (observed || []).length,
      currentInventoryComplete,
      currentInventoryPending: Math.max(0, (observed || []).length - currentInventoryComplete),
      neverScanned: categories.neverScanned.length,
      incompleteRetryDue: categories.incompleteRetry.length,
      incompleteRetryDeferred: deferredIncomplete,
      changedSinceCompleteScan: categories.changed.length,
      staleRevalidationDue: categories.staleRevalidation.length,
      selectedThisRun: selected.length,
    },
  };
}

function surfaceFromManifest(manifest) {
  return {
    path: manifest.path,
    root: Boolean(manifest.root),
    packageName: manifest.packageName ?? null,
    packageVersion: manifest.packageVersion ?? null,
    bundlePatch: manifest.bundlePatch ?? null,
    packagePrivate: manifest.packagePrivate ?? null,
    repositoryDirectory: manifest.repositoryDirectory ?? null,
  };
}

function nextRetryAt(scannedAt, consecutiveIncomplete) {
  const base = dateMs(scannedAt) ?? Date.now();
  const hours = Math.min(24, 2 ** Math.max(0, consecutiveIncomplete - 1));
  return new Date(base + hours * HOUR_MS).toISOString();
}

export function applyTopologyScanResults(state, selected, scans, scannedAt) {
  const records = stateMap(state);
  const selectedById = new Map((selected || []).map((repo) => [repoId(repo), repo]));

  for (const scan of scans || []) {
    const id = String(scan.repositoryId);
    const repo = selectedById.get(id);
    if (!repo) continue;
    const previous = records.get(id) || null;
    const meta = observedMeta(repo);
    const complete = scan.complete === true;
    const consecutiveIncomplete = complete ? 0 : (previous?.consecutiveIncomplete || 0) + 1;
    const next = {
      ...(previous || {}),
      repositoryId: id,
      repo: meta.repo,
      defaultBranch: meta.defaultBranch,
      repoPushedAt: meta.repoPushedAt,
      lastAttemptAt: scannedAt,
      lastAttemptComplete: complete,
      incompleteReasons: complete ? [] : [...new Set(scan.incompleteReasons || [])],
      consecutiveIncomplete,
      nextRetryAt: complete ? null : nextRetryAt(scannedAt, consecutiveIncomplete),
      lastAttemptStats: {
        candidateManifestCount: scan.candidateManifestCount || 0,
        manifestsExamined: scan.manifestsExamined || 0,
        treeTruncated: Boolean(scan.treeTruncated),
        apiRequests: scan.stats?.apiRequests || 0,
        rawFetches: scan.stats?.rawFetches || 0,
      },
    };
    if (complete) {
      next.lastCompleteScanAt = scannedAt;
      next.lastCompleteDefaultBranch = meta.defaultBranch;
      next.lastCompleteRepoPushedAt = meta.repoPushedAt;
      next.bundleSurfaces = (scan.manifests || [])
        .filter((manifest) => manifest.kind === 'bundle')
        .map(surfaceFromManifest)
        .sort((a, b) => a.path.localeCompare(b.path));
    }
    records.set(id, next);
  }

  return {
    schemaVersion: PACKAGE_TOPOLOGY_STATE_SCHEMA_VERSION,
    repositories: [...records.values()].sort((a, b) =>
      deterministicKey(a.repositoryId).localeCompare(deterministicKey(b.repositoryId))),
  };
}

export function summarizeTopologyState(state, observed, scans, selectionDiagnostics = {}) {
  const records = stateMap(state);
  let currentInventoryComplete = 0;
  let currentRepositoriesWithBundles = 0;
  let currentBundleSurfaces = 0;
  let currentNestedBundleSurfaces = 0;

  for (const repo of observed || []) {
    const record = records.get(repoId(repo));
    if (!currentInventory(record, repo)) continue;
    currentInventoryComplete++;
    const surfaces = record.bundleSurfaces || [];
    if (surfaces.length > 0) currentRepositoriesWithBundles++;
    currentBundleSurfaces += surfaces.length;
    currentNestedBundleSurfaces += surfaces.filter((surface) => !surface.root).length;
  }

  const completeThisRun = (scans || []).filter((scan) => scan.complete).length;
  const apiRequests = (scans || []).reduce((sum, scan) => sum + (scan.stats?.apiRequests || 0), 0);
  const rawFetches = (scans || []).reduce((sum, scan) => sum + (scan.stats?.rawFetches || 0), 0);

  return {
    schemaVersion: PACKAGE_TOPOLOGY_STATE_SCHEMA_VERSION,
    semantics: 'incremental-shadow-package-topology',
    ...selectionDiagnostics,
    stateRepositories: records.size,
    currentInventoryComplete,
    currentInventoryPending: Math.max(0, (observed || []).length - currentInventoryComplete),
    currentRepositoriesWithBundles,
    currentBundleSurfaces,
    currentNestedBundleSurfaces,
    scannedThisRun: (scans || []).length,
    completeThisRun,
    incompleteThisRun: (scans || []).length - completeThisRun,
    apiRequestsThisRun: apiRequests,
    rawFetchesThisRun: rawFetches,
    completeCoverageClaimed: (observed || []).length > 0
      && currentInventoryComplete === (observed || []).length,
  };
}
