import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { activityLevel } from './lib/activity.js';
import { classify } from './lib/classify.js';
import {
  fetchRawPackageJsonResult,
  hasBundlePatch,
  packageMetadata,
  searchTopicRepos,
  verifyRepositoryAdmission,
} from './lib/github.js';
import { reconcileDiscovery } from './lib/discovery-state.js';
import { scanObservedRepository } from './lib/package-topology.js';
import {
  applyTopologyScanResults,
  DEFAULT_TOPOLOGY_SCAN_LIMIT,
  DEFAULT_TOPOLOGY_STALE_DAYS,
  PACKAGE_TOPOLOGY_STATE_SCHEMA_VERSION,
  selectTopologyScanTargets,
  summarizeTopologyState,
} from './lib/package-topology-state.js';
import { applyOverrides, loadOverrides, pruneOverrides } from './lib/overrides.js';
import { pruneCompatResults } from './lib/validate.js';
import { preserveTransientEntry } from './lib/registry-state.js';
import { annotateLegacyRemovalEvents, appendEvents, generateEvents, preserveLifecycle, REGISTRY_VERSION } from './lib/registry-v2.js';
import { INSTALL_PREFIX, SEARCH_QUERIES, SEARCH_SORTS } from './lib/constants.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_FILE = path.join(ROOT, 'registry', 'plugins.json');
const META_FILE = path.join(ROOT, 'registry', 'meta.json');
const EVENTS_FILE = path.join(ROOT, 'registry', 'events.json');
const DISCOVERY_STATE_FILE = path.join(ROOT, 'registry', 'discovery-state.json');
const PACKAGE_TOPOLOGY_STATE_FILE = path.join(ROOT, 'registry', 'package-topology-state.json');

function boundedInt(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

const TOPOLOGY_SCAN_LIMIT = boundedInt(
  process.env.PACKAGE_TOPOLOGY_SCAN_LIMIT,
  DEFAULT_TOPOLOGY_SCAN_LIMIT,
  { min: 0, max: 300 },
);
const TOPOLOGY_MANIFEST_LIMIT = boundedInt(
  process.env.PACKAGE_TOPOLOGY_MANIFEST_LIMIT,
  100,
  { min: 1, max: 500 },
);
const TOPOLOGY_STALE_DAYS = boundedInt(
  process.env.PACKAGE_TOPOLOGY_STALE_DAYS,
  DEFAULT_TOPOLOGY_STALE_DAYS,
  { min: 1, max: 365 },
);

function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
    }
  };
  const workers = Array.from(
    { length: Math.min(limit, Math.max(items.length, 1)) },
    worker,
  );
  return Promise.all(workers).then(() => results);
}

function failedTopologyScan(repo, reason) {
  return {
    repositoryId: String(repo.id),
    repo: repo.full_name,
    defaultBranch: repo.default_branch,
    topicPresent: Array.isArray(repo.topics) ? repo.topics.includes('dsh-plugin') : null,
    complete: false,
    incompleteReasons: [reason],
    treeTruncated: false,
    candidateManifestCount: 0,
    manifestsExamined: 0,
    manifests: [],
    stats: { apiRequests: 0, rawFetches: 0 },
  };
}

async function updatePackageTopology({ eligible, token, generatedAt }) {
  const previousState = fs.existsSync(PACKAGE_TOPOLOGY_STATE_FILE)
    ? JSON.parse(fs.readFileSync(PACKAGE_TOPOLOGY_STATE_FILE, 'utf8'))
    : { schemaVersion: PACKAGE_TOPOLOGY_STATE_SCHEMA_VERSION, repositories: [] };
  const selection = selectTopologyScanTargets(eligible, previousState, {
    limit: TOPOLOGY_SCAN_LIMIT,
    staleDays: TOPOLOGY_STALE_DAYS,
    now: Date.parse(generatedAt),
  });
  const scans = [];
  console.log(
    `dsh-hub: package topology ${selection.selected.length}/${eligible.length} selected `
    + `(limit=${TOPOLOGY_SCAN_LIMIT}, pending=${selection.diagnostics.currentInventoryPending})`,
  );
  for (let i = 0; i < selection.selected.length; i++) {
    const repo = selection.selected[i];
    try {
      const scan = await scanObservedRepository(repo, {
        token,
        manifestLimit: TOPOLOGY_MANIFEST_LIMIT,
      });
      scans.push(scan);
      const nested = scan.manifests.filter((manifest) => manifest.kind === 'bundle' && !manifest.root).length;
      process.stdout.write(
        `  topology [${i + 1}/${selection.selected.length}] ${repo.full_name}: `
        + `${scan.complete ? 'complete' : 'incomplete'} nestedBundles=${nested}\n`,
      );
    } catch (error) {
      console.warn(`  topology ${repo.full_name}: isolated failure (${error?.message || error})`);
      scans.push(failedTopologyScan(repo, 'scan-unhandled-transient'));
    }
  }
  const state = applyTopologyScanResults(previousState, selection.selected, scans, generatedAt);
  const diagnostics = summarizeTopologyState(
    state,
    eligible,
    scans,
    {
      ...selection.diagnostics,
      manifestLimitPerRepository: TOPOLOGY_MANIFEST_LIMIT,
      staleRevalidationDays: TOPOLOGY_STALE_DAYS,
    },
  );
  return { state, diagnostics };
}

async function main() {
  const token = process.env.GITHUB_TOKEN || '';
  const generatedAt = new Date().toISOString();
  const previous = fs.existsSync(REGISTRY_FILE)
    ? JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8')) : [];
  const previousByRepo = new Map(previous.map((e) => [e.repo.toLowerCase(), e]));
  const previousById = new Map(previous.filter((e) => e.githubRepoId != null).map((e) => [String(e.githubRepoId), e]));
  const counts = {
    fetched: 0,
    archived: 0,
    fork: 0,
    noBranch: 0,
    manifestMissing: 0,
    fetchFailed: 0,
    rawFetches: 0,
    apiFallbacks: 0,
    fallbackRecovered: 0,
    admitted: 0,
  };

  console.log('dsh-hub: fetching topic repos…');
  const candidates = await searchTopicRepos({
    queries: SEARCH_QUERIES,
    sorts: SEARCH_SORTS,
    token,
    onPage: ({ query, page, total }) =>
      console.log(`  [${query}] page ${page} (total ${total})`),
  });
  counts.fetched = candidates.length;
  console.log(`dsh-hub: ${candidates.length} unique repos found`);

  const discoveryState = fs.existsSync(DISCOVERY_STATE_FILE)
    ? JSON.parse(fs.readFileSync(DISCOVERY_STATE_FILE, 'utf8'))
    : { schemaVersion: 1, repositories: [] };
  const discovery = await reconcileDiscovery({
    previous,
    state: discoveryState,
    observed: candidates,
    observedAt: generatedAt,
    confirm: (candidate) => verifyRepositoryAdmission(candidate, { token }),
  });

  const observedConfirmedRemovalIds = new Set();
  const eligible = candidates.filter((r) => {
    const wasListed = previousById.has(String(r.id)) || previousByRepo.has(r.full_name.toLowerCase());
    if (r.archived) { counts.archived++; if (wasListed) observedConfirmedRemovalIds.add(String(r.id)); return false; }
    if (r.fork) { counts.fork++; if (wasListed) observedConfirmedRemovalIds.add(String(r.id)); return false; }
    if (!r.default_branch) { counts.noBranch++; if (wasListed) observedConfirmedRemovalIds.add(String(r.id)); return false; }
    return true;
  });

  // Package topology is shadow evidence only. It is bounded and any unexpected
  // scanner failure is isolated so it cannot freeze the public Registry v2
  // refresh. The persistent state lets the initial backfill converge over
  // multiple hourly runs instead of full-rescanning the ecosystem every hour.
  let topologyState = fs.existsSync(PACKAGE_TOPOLOGY_STATE_FILE)
    ? JSON.parse(fs.readFileSync(PACKAGE_TOPOLOGY_STATE_FILE, 'utf8'))
    : { schemaVersion: PACKAGE_TOPOLOGY_STATE_SCHEMA_VERSION, repositories: [] };
  let topologyDiagnostics;
  try {
    const topology = await updatePackageTopology({ eligible, token, generatedAt });
    topologyState = topology.state;
    topologyDiagnostics = topology.diagnostics;
  } catch (error) {
    console.warn(`dsh-hub: package topology isolated failure: ${error?.message || error}`);
    topologyDiagnostics = {
      schemaVersion: PACKAGE_TOPOLOGY_STATE_SCHEMA_VERSION,
      semantics: 'incremental-shadow-package-topology',
      status: 'isolated-failure',
      error: String(error?.message || error).slice(0, 500),
      scanLimit: TOPOLOGY_SCAN_LIMIT,
      manifestLimitPerRepository: TOPOLOGY_MANIFEST_LIMIT,
      staleRevalidationDays: TOPOLOGY_STALE_DAYS,
      completeCoverageClaimed: false,
    };
  }

  console.log(`dsh-hub: checking package.json manifests (${eligible.length} repos)…`);
  const rawTexts = await mapLimit(eligible, 12, (r) =>
    fetchRawPackageJsonResult(r.owner, r.name, r.default_branch, { token }),
  );

  const entries = [...discovery.retainedPrevious];
  eligible.forEach((r, i) => {
    const result = rawTexts[i];
    counts.rawFetches += result.rawFetches || 0;
    counts.apiFallbacks += result.apiFallbacks || 0;
    if (result.fallbackRecovered) counts.fallbackRecovered++;
    if (result.kind === 'transient-failure') {
      counts.fetchFailed++;
      const prior = previousById.get(String(r.id)) || previousByRepo.get(r.full_name.toLowerCase());
      preserveTransientEntry(result, r.full_name, new Map([[r.full_name.toLowerCase(), prior]].filter(([, value]) => value)), entries);
      return;
    }
    const text = result.kind === 'success' ? result.text : null;
    if (!hasBundlePatch(text)) {
      counts.manifestMissing++;
      if (result.kind === 'confirmed-missing' || result.kind === 'success') {
        const prior = previousById.get(String(r.id)) || previousByRepo.get(r.full_name.toLowerCase());
        if (prior) observedConfirmedRemovalIds.add(String(r.id));
      }
      return;
    }
    const prior = previousById.get(String(r.id)) || previousByRepo.get(r.full_name.toLowerCase());
    const manifest = packageMetadata(text);
    entries.push(preserveLifecycle({
      name: r.name,
      githubRepoId: r.id,
      repo: r.full_name,
      defaultBranch: r.default_branch,
      packageName: manifest.packageName,
      packageVersion: manifest.packageVersion,
      repoPushedAt: r.pushed_at,
      lastManifestCheckedAt: generatedAt,
      discoverySource: 'github-topic:dsh-plugin',
      ...(prior?.installProbe ? { installProbe: prior.installProbe } : {}),
      url: r.html_url,
      description: (r.description || '').trim(),
      stars: r.stars,
      license: r.license || 'UNKNOWN',
      categories: classify(r),
      activity: activityLevel(r.pushed_at),
      installCommand: `${INSTALL_PREFIX}${r.full_name}`,
      updatedAt: generatedAt,
    }, prior, generatedAt));
  });
  counts.admitted = entries.length;

  const overrides = loadOverrides(ROOT);
  const finalEntries = applyOverrides(entries, overrides)
    .sort((a, b) => b.stars - a.stars);
  counts.admitted = finalEntries.length;

  const ledger = fs.existsSync(EVENTS_FILE)
    ? JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8')) : { schemaVersion: 1, events: [] };
  const confirmedRemovalIds = new Set([...discovery.confirmedRemovalIds, ...observedConfirmedRemovalIds]);
  const events = appendEvents(
    annotateLegacyRemovalEvents(ledger),
    generateEvents(previous, finalEntries, generatedAt, { confirmedRemovalIds }),
  );

  // Self-healing: drop cross-file references whose repo is no longer in the
  // registry, so a renamed or vanished plugin degrades gracefully instead of
  // failing the consistency check and freezing the registry for days (the
  // 11-day stall of 2026-08 was caused by exactly this kind of stale entry).
  const registryRepos = finalEntries.map((e) => e.repo);
  const compatFile = path.join(ROOT, 'registry', 'compatibility.json');
  let prunedCompat = 0;
  if (fs.existsSync(compatFile)) {
    const compat = JSON.parse(fs.readFileSync(compatFile, 'utf8'));
    const { compat: pruned, removed } = pruneCompatResults(compat, registryRepos);
    prunedCompat = removed.length;
    if (removed.length > 0) {
      fs.writeFileSync(compatFile, `${JSON.stringify(pruned, null, 2)}\n`);
      console.log(`dsh-hub: pruned stale compat entries (${removed.join(', ')})`);
    }
  }
  const overridesFile = path.join(ROOT, 'data', 'overrides.json');
  let prunedOverrides = 0;
  if (fs.existsSync(overridesFile)) {
    const overridesRaw = JSON.parse(fs.readFileSync(overridesFile, 'utf8'));
    const removed = pruneOverrides(overridesRaw, registryRepos);
    prunedOverrides = removed.length;
    if (removed.length > 0) {
      fs.writeFileSync(overridesFile, `${JSON.stringify(overridesRaw, null, 2)}\n`);
      console.log(`dsh-hub: pruned stale override entries (${removed.join(', ')})`);
    }
  }

  const prevMeta = fs.existsSync(META_FILE)
    ? JSON.parse(fs.readFileSync(META_FILE, 'utf8'))
    : null;

  fs.mkdirSync(path.dirname(REGISTRY_FILE), { recursive: true });
  fs.writeFileSync(REGISTRY_FILE, `${JSON.stringify(finalEntries, null, 2)}\n`);
  fs.writeFileSync(
    META_FILE,
    `${JSON.stringify(
      {
        schemaVersion: REGISTRY_VERSION,
        generatedAt,
        pluginCount: finalEntries.length,
        monitoredRepos: counts.fetched,
        totalStars: finalEntries.reduce((acc, e) => acc + e.stars, 0),
        compatDshVersion: prevMeta?.compatDshVersion || null,
        skipped: {
          archived: counts.archived,
          fork: counts.fork,
          noDefaultBranch: counts.noBranch,
          manifestMissing: counts.manifestMissing,
          fetchFailed: counts.fetchFailed,
        },
        manifestFetch: {
          rawFetches: counts.rawFetches,
          apiFallbacks: counts.apiFallbacks,
          fallbackRecovered: counts.fallbackRecovered,
          transientFailures: counts.fetchFailed,
        },
        discovery: {
          ...discovery.diagnostics,
          configuredSegments: candidates.diagnostics?.configuredSegments || SEARCH_QUERIES.length,
          resolvedSegments: candidates.diagnostics?.resolvedSegments || 0,
          segmentsAttempted: candidates.diagnostics?.segmentsAttempted || 0,
          resolvedLeaves: candidates.diagnostics?.resolvedLeaves || 0,
          resolvedLeafTotalCount: candidates.diagnostics?.resolvedLeafTotalCount || 0,
          totalCountObservations: candidates.diagnostics?.totalCountObservations || 0,
          pagesFetched: candidates.diagnostics?.pagesFetched || 0,
          uniqueRepositories: candidates.diagnostics?.uniqueRepositories || candidates.length,
          capped: Boolean(candidates.diagnostics?.capped),
          subdivided: Boolean(candidates.diagnostics?.subdivided),
          unresolvedCappedSegments: candidates.diagnostics?.unresolvedCappedSegments || [],
          completeCoverageClaimed: Boolean(candidates.diagnostics?.completeCoverageClaimed),
        },
        packageTopology: topologyDiagnostics,
        queries: SEARCH_QUERIES.map((q, i) => `${q}&sort=${SEARCH_SORTS[i]}`),
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(EVENTS_FILE, `${JSON.stringify(events, null, 2)}\n`);
  fs.writeFileSync(DISCOVERY_STATE_FILE, `${JSON.stringify(discovery.state, null, 2)}\n`);
  fs.writeFileSync(PACKAGE_TOPOLOGY_STATE_FILE, `${JSON.stringify(topologyState, null, 2)}\n`);

  // Changelog + last-run snapshot feed the weekly digest.
  const lastRunFile = path.join(ROOT, 'registry', 'last-run.json');
  const changelogFile = path.join(ROOT, 'registry', 'changelog.json');
  const prev = fs.existsSync(lastRunFile)
    ? JSON.parse(fs.readFileSync(lastRunFile, 'utf8'))
    : null;
  const prevRepos = new Set(
    (prev?.repos || []).map((r) => (typeof r === 'string' ? r : r.repo)),
  );
  let changelog = fs.existsSync(changelogFile)
    ? JSON.parse(fs.readFileSync(changelogFile, 'utf8'))
    : [];
  if (prev) {
    const added = finalEntries
      .filter((e) => !prevRepos.has(e.repo))
      .map((e) => ({
        repo: e.repo,
        addedAt: generatedAt,
        stars: e.stars,
        description: (e.description || '').slice(0, 200),
        url: e.url,
      }));
    changelog = [...changelog, ...added];
  }
  const changelogCutoff = Date.now() - 14 * 86_400_000;
  changelog = changelog
    .filter((e) => Date.parse(e.addedAt) >= changelogCutoff)
    .slice(-1000);
  fs.writeFileSync(
    lastRunFile,
    `${JSON.stringify(
      {
        generatedAt,
        repos: finalEntries.map((e) => ({ repo: e.repo, stars: e.stars })),
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(changelogFile, `${JSON.stringify(changelog, null, 2)}\n`);

  console.log(
    `dsh-hub: done. admitted=${counts.admitted} `
    + `skipped={archived:${counts.archived}, fork:${counts.fork}, noBranch:${counts.noBranch}, manifestMissing:${counts.manifestMissing}, fetchFailed:${counts.fetchFailed}} `
    + `manifestFetch={raw:${counts.rawFetches}, apiFallbacks:${counts.apiFallbacks}, recovered:${counts.fallbackRecovered}, transient:${counts.fetchFailed}} `
    + `topology={scanned:${topologyDiagnostics?.scannedThisRun || 0}, currentComplete:${topologyDiagnostics?.currentInventoryComplete || 0}, pending:${topologyDiagnostics?.currentInventoryPending ?? 'unknown'}, api:${topologyDiagnostics?.apiRequestsThisRun || 0}} `
    + `pruned={compat:${prunedCompat}, overrides:${prunedOverrides}}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
