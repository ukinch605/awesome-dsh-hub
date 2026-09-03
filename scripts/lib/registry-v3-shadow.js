import crypto from 'node:crypto';

export const REGISTRY_V3_SHADOW_SCHEMA_VERSION = 3;
export const REGISTRY_V3_IDENTITY_STATE_SCHEMA_VERSION = 1;

function repoId(value) {
  const raw = value?.githubRepoId ?? value?.repositoryId ?? value?.id;
  return raw == null ? null : String(raw);
}

function surfaceKey(repositoryId, packagePath) {
  return `${String(repositoryId)}\u0000${packagePath}`;
}

function pluginIdSeed(repositoryId, packagePath) {
  const digest = crypto
    .createHash('sha256')
    .update(`awesome-dsh-hub:v3:${repositoryId}:${packagePath}`)
    .digest('hex')
    .slice(0, 20);
  return `dshp_${digest}`;
}

export function isPlaceholderPackageName(name) {
  if (typeof name !== 'string' || name.trim() === '') return false;
  return /\{\{|\}\}|<[^>]+>|\$\{|__[^_]+__|PLACEHOLDER/i.test(name);
}

function observedRepoMap(observed) {
  return new Map((observed || [])
    .filter((repo) => repoId(repo) != null)
    .map((repo) => [repoId(repo), repo]));
}

function topologyMap(topologyState) {
  return new Map((topologyState?.repositories || [])
    .filter((record) => record?.repositoryId != null)
    .map((record) => [String(record.repositoryId), record]));
}

function identityMap(identityState) {
  return new Map((identityState?.identities || [])
    .filter((identity) => identity?.githubRepoId != null && identity?.packagePath)
    .map((identity) => [surfaceKey(identity.githubRepoId, identity.packagePath), identity]));
}

function activeSurfaceMap(identityState) {
  const map = new Map();
  for (const identity of identityState?.identities || []) {
    const id = String(identity?.githubRepoId ?? '');
    if (!id || !identity?.pluginId) continue;
    const list = map.get(id) || [];
    list.push(identity);
    map.set(id, list);
  }
  return map;
}

function currentSurfacePaths(topologyState) {
  const map = new Map();
  for (const record of topologyState?.repositories || []) {
    if (!record?.repositoryId || !record?.lastCompleteScanAt) continue;
    map.set(String(record.repositoryId), new Set((record.bundleSurfaces || []).map((surface) => surface.path)));
  }
  return map;
}

function identityForSurface({
  repositoryId,
  surface,
  identityBySurface,
  priorByRepo,
  currentPaths,
  generatedAt,
  allowPathMove = true,
}) {
  const key = surfaceKey(repositoryId, surface.path);
  const exact = identityBySurface.get(key);
  if (exact) {
    return { identity: { ...exact, lastObservedAt: generatedAt, lastPackageName: surface.packageName ?? null }, reconciledFrom: null };
  }

  const packageName = surface.packageName;
  if (allowPathMove && packageName && !isPlaceholderPackageName(packageName)) {
    const candidates = (priorByRepo.get(String(repositoryId)) || []).filter((identity) =>
      identity.lastPackageName === packageName
      && !currentPaths.get(String(repositoryId))?.has(identity.packagePath));
    if (candidates.length === 1) {
      const prior = candidates[0];
      return {
        identity: {
          ...prior,
          packagePath: surface.path,
          lastObservedAt: generatedAt,
          lastPackageName: packageName,
        },
        reconciledFrom: prior.packagePath,
      };
    }
  }

  return {
    identity: {
      pluginId: pluginIdSeed(repositoryId, surface.path),
      githubRepoId: String(repositoryId),
      packagePath: surface.path,
      firstObservedAt: generatedAt,
      lastObservedAt: generatedAt,
      firstObservedPackageName: surface.packageName ?? null,
      lastPackageName: surface.packageName ?? null,
    },
    reconciledFrom: null,
  };
}

function repoMetadata(repo, rootEntry, topology) {
  return {
    repo: rootEntry?.repo ?? repo?.full_name ?? repo?.repo ?? topology?.repo ?? null,
    defaultBranch: rootEntry?.defaultBranch
      ?? repo?.default_branch ?? repo?.defaultBranch ?? topology?.defaultBranch ?? null,
    repoPushedAt: rootEntry?.repoPushedAt
      ?? repo?.pushed_at ?? repo?.repoPushedAt ?? topology?.repoPushedAt ?? null,
    url: rootEntry?.url ?? repo?.html_url ?? null,
    description: rootEntry?.description ?? (repo?.description || '').trim(),
    stars: rootEntry?.stars ?? repo?.stars ?? null,
    license: rootEntry?.license ?? repo?.license ?? 'UNKNOWN',
    categories: rootEntry?.categories ?? [],
    activity: rootEntry?.activity ?? null,
  };
}

function ambiguityKeys(surfaces) {
  const counts = new Map();
  for (const surface of surfaces) {
    if (!surface.packageName || isPlaceholderPackageName(surface.packageName)) continue;
    counts.set(surface.packageName, (counts.get(surface.packageName) || 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name));
}

export function generateShadowRegistryV3({
  v2Entries = [],
  topologyState = { schemaVersion: 1, repositories: [] },
  observed = [],
  identityState = { schemaVersion: REGISTRY_V3_IDENTITY_STATE_SCHEMA_VERSION, identities: [] },
  generatedAt,
} = {}) {
  const observedById = observedRepoMap(observed);
  const topologyById = topologyMap(topologyState);
  const rootById = new Map(v2Entries
    .filter((entry) => repoId(entry) != null)
    .map((entry) => [repoId(entry), entry]));
  const identityBySurface = identityMap(identityState);
  const priorByRepo = activeSurfaceMap(identityState);
  const currentPaths = currentSurfacePaths(topologyState);
  const identities = new Map((identityState?.identities || []).map((identity) => [identity.pluginId, identity]));
  const entries = [];
  const migration = {
    schemaVersion: 1,
    generatedAt,
    v2Entries: v2Entries.length,
    v2RootEntriesCarried: 0,
    topologyRepositoriesComplete: 0,
    nestedCandidates: 0,
    nestedOnlyCandidates: 0,
    duplicatePackageNameSurfaces: 0,
    placeholderPackageNames: 0,
    ambiguousIdentities: 0,
    pathMovesReconciled: 0,
    topologyIncompleteRepositories: 0,
  };

  const repositoryIds = new Set([...rootById.keys(), ...topologyById.keys()]);
  for (const repositoryId of repositoryIds) {
    const rootEntry = rootById.get(repositoryId) || null;
    const topology = topologyById.get(repositoryId) || null;
    const repo = observedById.get(repositoryId) || null;
    const complete = Boolean(topology?.lastCompleteScanAt);
    if (complete) migration.topologyRepositoriesComplete++;
    if (topology && !complete) migration.topologyIncompleteRepositories++;

    let surfaces = complete ? [...(topology.bundleSurfaces || [])] : [];
    if (rootEntry && !surfaces.some((surface) => surface.path === 'package.json')) {
      surfaces.unshift({
        path: 'package.json',
        root: true,
        packageName: rootEntry.packageName ?? null,
        packageVersion: rootEntry.packageVersion ?? null,
        bundlePatch: null,
        packagePrivate: null,
        repositoryDirectory: null,
        evidenceSource: 'registry-v2-root',
      });
    }
    if (!rootEntry && surfaces.length === 0) continue;

    const ambiguousNames = ambiguityKeys(surfaces);
    migration.duplicatePackageNameSurfaces += surfaces.filter((surface) =>
      surface.packageName && ambiguousNames.has(surface.packageName)).length;

    for (const surface of surfaces) {
      const ambiguous = Boolean(surface.packageName && ambiguousNames.has(surface.packageName));
      const { identity, reconciledFrom } = identityForSurface({
        repositoryId,
        surface,
        identityBySurface,
        priorByRepo,
        currentPaths,
        generatedAt,
        allowPathMove: !ambiguous,
      });
      identities.set(identity.pluginId, identity);
      const isRoot = surface.path === 'package.json';
      const placeholder = isPlaceholderPackageName(surface.packageName);
      if (placeholder) migration.placeholderPackageNames++;
      if (ambiguous) migration.ambiguousIdentities++;
      if (reconciledFrom) migration.pathMovesReconciled++;
      if (isRoot && rootEntry) migration.v2RootEntriesCarried++;
      if (!isRoot) {
        migration.nestedCandidates++;
        if (!rootEntry) migration.nestedOnlyCandidates++;
      }

      const metadata = repoMetadata(repo, rootEntry, topology);
      entries.push({
        schemaVersion: REGISTRY_V3_SHADOW_SCHEMA_VERSION,
        pluginId: identity.pluginId,
        githubRepoId: String(repositoryId),
        ...metadata,
        packagePath: surface.path,
        packageName: surface.packageName ?? null,
        packageVersion: surface.packageVersion ?? null,
        bundlePatch: surface.bundlePatch ?? null,
        packagePrivate: surface.packagePrivate ?? null,
        repositoryDirectory: surface.repositoryDirectory ?? null,
        firstObservedAt: identity.firstObservedAt,
        lastObservedAt: generatedAt,
        ...(isRoot && rootEntry ? {
          firstSeenAt: rootEntry.firstSeenAt ?? null,
          lastSeenAt: rootEntry.lastSeenAt ?? null,
        } : {}),
        lastManifestCheckedAt: isRoot && rootEntry
          ? rootEntry.lastManifestCheckedAt ?? topology?.lastCompleteScanAt ?? generatedAt
          : topology?.lastCompleteScanAt ?? generatedAt,
        discoverySource: isRoot && rootEntry
          ? rootEntry.discoverySource ?? 'registry-v2-root'
          : 'package-topology-shadow',
        observationSemantics: isRoot && rootEntry ? 'v2-carried-forward' : 'plugin_first_observed',
        identityStatus: ambiguous ? 'ambiguous-surface' : 'observed-surface',
        ...(reconciledFrom ? { previousPackagePath: reconciledFrom } : {}),
        distribution: isRoot && rootEntry?.installCommand
          ? { status: 'verified-repo-install', installCommand: rootEntry.installCommand }
          : { status: 'unknown', installCommand: null },
        ...(isRoot && rootEntry?.installProbe ? { installProbe: rootEntry.installProbe } : {}),
      });
    }
  }

  entries.sort((a, b) => a.pluginId.localeCompare(b.pluginId));
  const nextIdentityState = {
    schemaVersion: REGISTRY_V3_IDENTITY_STATE_SCHEMA_VERSION,
    identities: [...identities.values()].sort((a, b) => a.pluginId.localeCompare(b.pluginId)),
  };
  return {
    registry: {
      schemaVersion: REGISTRY_V3_SHADOW_SCHEMA_VERSION,
      generatedAt,
      semantics: 'shadow-package-registry-v3',
      authoritative: false,
      entries,
    },
    identityState: nextIdentityState,
    migrationReport: {
      ...migration,
      shadowEntries: entries.length,
      identityRecords: nextIdentityState.identities.length,
      publicCutoverReady: false,
    },
  };
}
