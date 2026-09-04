import { createHash } from 'node:crypto';

export const REGISTRY_V3_EVENT_LEDGER_SCHEMA_VERSION = 1;
export const REGISTRY_V3_EVENT_STATE_SCHEMA_VERSION = 1;
export const REGISTRY_V3_DEPENDENT_STATE_SCHEMA_VERSION = 1;

const PACKAGE_EVENT_TYPES = new Set([
  'plugin_first_observed',
  'package_path_changed',
  'package_name_changed',
  'package_version_changed',
  'repo_renamed',
  'activity_changed',
  'install_probe_changed',
]);

function eventId(body) {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 24);
}

function repoId(entry) {
  return entry?.githubRepoId == null ? null : String(entry.githubRepoId);
}

function isAmbiguous(entry) {
  return entry?.identityStatus === 'ambiguous-surface';
}

function probeStatus(entry) {
  return entry?.installProbe?.status ?? 'not-tested';
}

function snapshotEntry(entry) {
  return {
    pluginId: entry.pluginId,
    githubRepoId: repoId(entry),
    repo: entry.repo ?? null,
    packagePath: entry.packagePath ?? null,
    packageName: entry.packageName ?? null,
    packageVersion: entry.packageVersion ?? null,
    identityStatus: entry.identityStatus ?? null,
    activity: entry.activity ?? null,
    installProbeStatus: probeStatus(entry),
    observationSemantics: entry.observationSemantics ?? null,
  };
}

function emitEvent(events, type, entry, occurredAt, changes = {}) {
  if (!PACKAGE_EVENT_TYPES.has(type)) throw new Error(`Unsupported v3 event type: ${type}`);
  const body = {
    type,
    pluginId: entry.pluginId,
    repositoryId: repoId(entry),
    occurredAt,
    package: {
      path: entry.packagePath ?? null,
      name: entry.packageName ?? null,
    },
    changes,
  };
  events.push({ id: eventId(body), ...body });
}

/**
 * Generate only package/pluginId-scoped shadow events. Historical v2 events
 * are never passed through this function and therefore cannot be rehashed.
 */
export function generatePackageEvents(previousState, currentEntries, occurredAt) {
  const priorEntries = Array.isArray(previousState?.entries) ? previousState.entries : [];
  const initial = priorEntries.length === 0;
  const before = new Map(priorEntries.filter((e) => e?.pluginId).map((e) => [e.pluginId, e]));
  const events = [];

  for (const now of currentEntries || []) {
    if (!now?.pluginId) continue;
    const old = before.get(now.pluginId);
    if (!old) {
      // On the first Stage C baseline, root v2 entries already have legacy
      // observation history. Only topology-discovered package surfaces need a
      // package-level first-observed event. Later genuinely new pluginIds do.
      if (!initial || now.observationSemantics === 'plugin_first_observed') {
        emitEvent(events, 'plugin_first_observed', now, occurredAt, {
          semantics: 'registry-package-observation',
          backfill: initial,
        });
      }
      continue;
    }

    const continuityAmbiguous = isAmbiguous(old) || isAmbiguous(now);
    if (!continuityAmbiguous && old.packagePath !== now.packagePath) {
      emitEvent(events, 'package_path_changed', now, occurredAt, {
        from: old.packagePath ?? null,
        to: now.packagePath ?? null,
      });
    }
    if (!continuityAmbiguous && old.packageName !== now.packageName) {
      emitEvent(events, 'package_name_changed', now, occurredAt, {
        from: old.packageName ?? null,
        to: now.packageName ?? null,
      });
    }
    if (!continuityAmbiguous
      && old.packageVersion != null
      && now.packageVersion != null
      && old.packageVersion !== now.packageVersion) {
      emitEvent(events, 'package_version_changed', now, occurredAt, {
        from: old.packageVersion,
        to: now.packageVersion,
      });
    }
    if (old.githubRepoId === repoId(now) && old.repo !== now.repo) {
      emitEvent(events, 'repo_renamed', now, occurredAt, {
        from: old.repo ?? null,
        to: now.repo ?? null,
      });
    }
    if (old.activity !== now.activity) {
      emitEvent(events, 'activity_changed', now, occurredAt, {
        from: old.activity ?? null,
        to: now.activity ?? null,
      });
    }
    const oldProbe = old.installProbeStatus ?? 'not-tested';
    const newProbe = probeStatus(now);
    if (now.packagePath === 'package.json' && oldProbe !== newProbe) {
      emitEvent(events, 'install_probe_changed', now, occurredAt, {
        from: oldProbe,
        to: newProbe,
      });
    }
  }
  return events;
}

export function appendShadowEvents(ledger, generated) {
  const existing = Array.isArray(ledger?.events) ? ledger.events : [];
  const seen = new Set(existing.map((event) => event.id));
  return {
    schemaVersion: REGISTRY_V3_EVENT_LEDGER_SCHEMA_VERSION,
    semantics: 'shadow-package-events-v3',
    authoritative: false,
    legacyV2EventsPreservedSeparately: true,
    events: [...existing, ...(generated || []).filter((event) => !seen.has(event.id))],
  };
}

export function nextEventState(currentEntries, generatedAt) {
  return {
    schemaVersion: REGISTRY_V3_EVENT_STATE_SCHEMA_VERSION,
    generatedAt,
    entries: (currentEntries || []).filter((e) => e?.pluginId).map(snapshotEntry),
  };
}

function explicitPluginOverride(entry, overrides) {
  const value = overrides?.pluginIds?.[entry.pluginId];
  return value && typeof value === 'object' ? value : null;
}

function repoFallbackOverride(entry, overrides) {
  if (entry.packagePath !== 'package.json' || !entry.repo) return null;
  const excluded = (overrides?.exclude || []).some((repo) => String(repo).toLowerCase() === entry.repo.toLowerCase());
  const categories = overrides?.categories?.[entry.repo];
  const description = overrides?.descriptions?.[entry.repo];
  if (!excluded && !Array.isArray(categories) && typeof description !== 'string') return null;
  return {
    ...(excluded ? { excluded: true } : {}),
    ...(Array.isArray(categories) ? { categories: [...categories] } : {}),
    ...(typeof description === 'string' ? { description } : {}),
  };
}

/**
 * Resolve v3 override semantics without changing public v2 behavior.
 * Explicit pluginId overrides may target any package. Legacy repo overrides
 * are intentionally root-only so they cannot leak onto nested packages.
 */
export function resolvePluginOverride(entry, overrides = {}) {
  const explicit = explicitPluginOverride(entry, overrides);
  if (explicit) return { scope: 'pluginId', value: explicit };
  const fallback = repoFallbackOverride(entry, overrides);
  return fallback ? { scope: 'legacy-repo-root-fallback', value: fallback } : null;
}

export function buildDependentState(shadowEntries, compatibility = {}, overrides = {}, generatedAt) {
  const compatByRepo = new Map((compatibility?.results || [])
    .filter((result) => result?.repo)
    .map((result) => [result.repo.toLowerCase(), result]));
  return {
    schemaVersion: REGISTRY_V3_DEPENDENT_STATE_SCHEMA_VERSION,
    generatedAt,
    semantics: 'shadow-plugin-dependent-data-v3',
    authoritative: false,
    compatibilitySemantics: 'legacy-repo-install-probe-root-only',
    entries: (shadowEntries || []).map((entry) => {
      const isRoot = entry.packagePath === 'package.json';
      const compat = isRoot && entry.repo ? compatByRepo.get(entry.repo.toLowerCase()) : null;
      return {
        pluginId: entry.pluginId,
        githubRepoId: repoId(entry),
        packagePath: entry.packagePath,
        override: resolvePluginOverride(entry, overrides),
        compatibility: compat ? {
          status: compat.status,
          reason: compat.reason ?? null,
          dshVersion: compat.dshVersion ?? null,
          checkedAt: compat.checkedAt ?? null,
          sourceScope: 'legacy-repo-root-only',
        } : null,
      };
    }),
  };
}

export function legacyEventReferences(v2Ledger = {}) {
  return (v2Ledger.events || []).map((event) => ({
    id: event.id,
    type: event.type,
    scope: 'legacy-repository-v2',
  }));
}

export function generateStageCShadow({
  shadowRegistry,
  previousEventState,
  shadowEventLedger,
  v2EventLedger,
  compatibility,
  overrides,
  generatedAt,
}) {
  if (shadowRegistry?.schemaVersion !== 3 || !Array.isArray(shadowRegistry?.entries)) {
    throw new Error('Stage C requires a valid shadow Registry v3');
  }
  const generated = generatePackageEvents(previousEventState, shadowRegistry.entries, generatedAt);
  return {
    eventLedger: {
      ...appendShadowEvents(shadowEventLedger, generated),
      generatedAt,
      legacyEventReferences: legacyEventReferences(v2EventLedger),
    },
    eventState: nextEventState(shadowRegistry.entries, generatedAt),
    dependentState: buildDependentState(shadowRegistry.entries, compatibility, overrides, generatedAt),
    report: {
      schemaVersion: 1,
      generatedAt,
      packageEventsGenerated: generated.length,
      totalShadowPackageEvents: (shadowEventLedger?.events?.length || 0) + generated.length,
      legacyV2EventsReferenced: v2EventLedger?.events?.length || 0,
      dependentEntries: shadowRegistry.entries.length,
      publicV2Mutated: false,
      publicCutoverReady: false,
    },
  };
}
