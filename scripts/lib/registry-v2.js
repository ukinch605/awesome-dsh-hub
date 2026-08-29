import { createHash } from 'node:crypto';

export const REGISTRY_VERSION = 2;
export const EVENT_TYPES = new Set([
  'plugin_added', 'plugin_removed', 'repo_renamed',
  'package_version_changed', 'activity_changed', 'install_probe_changed',
]);

const identity = (entry) => entry.githubRepoId == null ? null : String(entry.githubRepoId);

/** Add the v2 contract without inventing history for a v1 snapshot. */
export function migrateV1Entry(entry) {
  return {
    ...entry,
    githubRepoId: entry.githubRepoId ?? null,
    defaultBranch: entry.defaultBranch ?? null,
    packageName: entry.packageName ?? null,
    packageVersion: entry.packageVersion ?? null,
    repoPushedAt: entry.repoPushedAt ?? null,
    firstSeenAt: entry.firstSeenAt ?? null,
    lastSeenAt: entry.lastSeenAt ?? null,
    lastManifestCheckedAt: entry.lastManifestCheckedAt ?? null,
    discoverySource: entry.discoverySource ?? null,
  };
}

export function preserveLifecycle(next, previous, observedAt) {
  if (!previous) return { ...next, firstSeenAt: observedAt, lastSeenAt: observedAt };
  return {
    ...next,
    firstSeenAt: previous.firstSeenAt ?? null,
    lastSeenAt: observedAt,
  };
}

function eventId(event) {
  return createHash('sha256').update(JSON.stringify(event)).digest('hex').slice(0, 24);
}

export function generateEvents(previous, current, occurredAt, { suppressMigration = true } = {}) {
  // The checked-in v1 state has no stable IDs and cannot support evidence-based history.
  if (suppressMigration && previous.length > 0 && previous.every((e) => identity(e) === null)) return [];
  const before = new Map(previous.map((e) => [identity(e), e]).filter(([id]) => id !== null));
  const after = new Map(current.map((e) => [identity(e), e]).filter(([id]) => id !== null));
  const events = [];
  const emit = (type, repositoryId, changes) => {
    const body = { type, repositoryId, occurredAt, changes };
    events.push({ id: eventId(body), ...body });
  };
  for (const [id, now] of after) {
    const old = before.get(id);
    if (!old) { emit('plugin_added', id, { repo: now.repo }); continue; }
    if (old.repo !== now.repo) emit('repo_renamed', id, { from: old.repo, to: now.repo });
    if (old.packageVersion != null && now.packageVersion != null && old.packageVersion !== now.packageVersion) emit('package_version_changed', id, { from: old.packageVersion, to: now.packageVersion });
    if (old.activity !== now.activity) emit('activity_changed', id, { from: old.activity, to: now.activity });
    const oldProbe = old.installProbe?.status;
    const newProbe = now.installProbe?.status;
    if (oldProbe !== newProbe && (oldProbe !== undefined || newProbe !== undefined)) emit('install_probe_changed', id, { from: oldProbe ?? 'not-tested', to: newProbe ?? 'not-tested' });
  }
  for (const [id, old] of before) if (!after.has(id)) emit('plugin_removed', id, { repo: old.repo });
  return events;
}

export function appendEvents(ledger, generated) {
  const seen = new Set((ledger.events || []).map((e) => e.id));
  return {
    schemaVersion: 1,
    events: [...(ledger.events || []), ...generated.filter((e) => !seen.has(e.id))],
  };
}
