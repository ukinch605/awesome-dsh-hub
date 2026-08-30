export const DISCOVERY_STATE_VERSION = 1;
export const DEFAULT_REMOVAL_MISSES = 2;

const keyFor = (value) => value.githubRepoId != null || value.repositoryId != null
  ? `id:${value.githubRepoId ?? value.repositoryId}`
  : `repo:${value.repo.toLowerCase()}`;

export function observeDiscovery(previous, candidates, state, observedAt, missThreshold = DEFAULT_REMOVAL_MISSES) {
  const records = new Map((state?.records || []).map((record) => [keyFor(record), { ...record }]));
  const observedKeys = new Set();
  for (const candidate of candidates) {
    const key = keyFor({ githubRepoId: candidate.id, repo: candidate.full_name });
    observedKeys.add(key);
    observedKeys.add(`repo:${candidate.full_name.toLowerCase()}`);
    records.delete(`repo:${candidate.full_name.toLowerCase()}`);
    records.set(key, {
      repositoryId: candidate.id ?? null,
      repo: candidate.full_name,
      lastDiscoveredAt: observedAt,
      consecutiveDiscoveryMisses: 0,
    });
  }

  const preserved = [];
  const confirmationCandidates = [];
  for (const entry of previous) {
    const key = keyFor(entry);
    if (observedKeys.has(key)) continue;
    const old = records.get(key);
    const record = {
      repositoryId: entry.githubRepoId ?? old?.repositoryId ?? null,
      repo: entry.repo,
      lastDiscoveredAt: old?.lastDiscoveredAt ?? null,
      consecutiveDiscoveryMisses: (old?.consecutiveDiscoveryMisses || 0) + 1,
    };
    records.set(key, record);
    if (record.consecutiveDiscoveryMisses >= missThreshold) confirmationCandidates.push(entry);
    else preserved.push(entry);
  }
  return {
    state: { schemaVersion: DISCOVERY_STATE_VERSION, records: [...records.values()] },
    preserved,
    confirmationCandidates,
  };
}

export function markConfirmationPreserved(state, entry) {
  const key = keyFor(entry);
  return {
    ...state,
    records: state.records.map((record) => keyFor(record) === key
      ? { ...record, consecutiveDiscoveryMisses: 0 }
      : record),
  };
}

export function removeDiscoveryRecord(state, entry) {
  const key = keyFor(entry);
  return { ...state, records: state.records.filter((record) => keyFor(record) !== key) };
}

export async function confirmRemovalCandidates(candidates, verify) {
  const confirmed = [];
  const preserved = [];
  for (const entry of candidates) {
    const result = await verify(entry);
    if (result.kind === 'confirmed-ineligible') confirmed.push({ entry, reason: result.reason });
    else preserved.push({ entry, result });
  }
  return { confirmed, preserved };
}
