import { createHash } from 'node:crypto';

export const REGISTRY_VERSION = 2;
export const EVENT_TYPES = new Set([
  'plugin_added', 'plugin_removed', 'repo_renamed',
  'package_version_changed', 'activity_changed', 'install_probe_changed',
]);

export function migrateInstallProbeStatus(status, reason = '') {
  if (status !== 'failed') {
    return { verified: 'installed', unknown: 'not-tested', pending: 'not-tested' }[status] || status;
  }
  if (/allowBuilds|approve-builds|ignored build scripts/i.test(String(reason))) return 'blocked';
  if (/^timeout$|timed?\s*out|time limit exceeded|exceeded (?:the )?time limit/i.test(String(reason).trim())) return 'timeout';
  return 'failed';
}

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

export function generateEvents(previous, current, occurredAt, { suppressMigration = true, confirmedRemovalIds = new Set() } = {}) {
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
  for (const [id, old] of before) {
    if (!after.has(id) && confirmedRemovalIds.has(id)) emit('plugin_removed', id, { repo: old.repo, confirmation: 'direct-verification' });
  }
  return events;
}

export function annotateLegacyRemovalEvents(ledger) {
  return {
    ...ledger,
    // `changes` participates in the historical event hash. Keep that hashed
    // body byte-for-byte equivalent and attach migration context separately.
    events: (ledger.events || []).map((event) => event.type === 'plugin_removed' && !event.confirmation
      ? { ...event, confirmation: 'unconfirmed-discovery-derived' }
      : event),
  };
}

export function appendEvents(ledger, generated) {
  const seen = new Set((ledger.events || []).map((e) => e.id));
  return {
    schemaVersion: 1,
    events: [...(ledger.events || []), ...generated.filter((e) => !seen.has(e.id))],
  };
}

/** Compare a completed probe snapshot with the states embedded in the registry. */
export function recordInstallProbeEvents(registry, results, ledger, occurredAt) {
  const byRepo = new Map((results || []).map((result) => [result.repo.toLowerCase(), result]));
  const latestRecorded = new Map();
  for (const event of ledger.events || []) {
    if (event.type === 'install_probe_changed') latestRecorded.set(String(event.repositoryId), event.changes?.to);
  }
  const baseline = registry.map((entry) => {
    const recordedStatus = latestRecorded.get(String(entry.githubRepoId));
    return recordedStatus === undefined
      ? entry
      : { ...entry, installProbe: { ...(entry.installProbe || {}), status: recordedStatus } };
  });
  const current = baseline.map((entry) => {
    const result = byRepo.get(entry.repo.toLowerCase());
    if (!result) return entry;
    return {
      ...entry,
      installProbe: {
        status: migrateInstallProbeStatus(result.status, result.reason),
      },
    };
  });
  return appendEvents(ledger, generateEvents(baseline, current, occurredAt));
}
