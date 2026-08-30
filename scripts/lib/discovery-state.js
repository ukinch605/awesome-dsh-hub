export const DISCOVERY_STATE_VERSION = 1;

const idOf = (value) => value?.repositoryId ?? value?.githubRepoId ?? value?.id;

export async function reconcileDiscovery({
  previous = [],
  state = { repositories: [] },
  observed = [],
  observedAt,
  confirm,
  confirmationLimit = 100,
}) {
  const priorState = new Map((state.repositories || []).map((item) => [String(item.repositoryId), item]));
  const observedById = new Map(observed.filter((item) => idOf(item) != null).map((item) => [String(idOf(item)), item]));
  const previousById = new Map(previous.filter((item) => idOf(item) != null).map((item) => [String(idOf(item)), item]));
  const next = new Map();
  let temporarilyMissed = 0;
  const candidates = [];

  for (const [id, repo] of observedById) {
    next.set(id, {
      repositoryId: id,
      repo: repo.full_name ?? repo.repo,
      lastDiscoveredAt: observedAt,
      consecutiveDiscoveryMisses: 0,
    });
  }
  for (const [id, plugin] of previousById) {
    if (observedById.has(id)) continue;
    temporarilyMissed++;
    const old = priorState.get(id);
    const item = {
      repositoryId: id,
      repo: plugin.repo,
      lastDiscoveredAt: old?.lastDiscoveredAt ?? null,
      consecutiveDiscoveryMisses: (old?.consecutiveDiscoveryMisses || 0) + 1,
    };
    next.set(id, item);
    if (item.consecutiveDiscoveryMisses >= 2) candidates.push(item);
  }

  const confirmedRemovalIds = new Set();
  const confirmationResults = new Map();
  for (const candidate of candidates.slice(0, confirmationLimit)) {
    const result = await confirm(candidate);
    confirmationResults.set(candidate.repositoryId, result);
    if (result?.kind === 'confirmed-removed') {
      confirmedRemovalIds.add(candidate.repositoryId);
      next.delete(candidate.repositoryId);
    }
  }
  const retainedPrevious = previous.filter((plugin) => {
    const id = idOf(plugin);
    return id != null && !observedById.has(String(id)) && !confirmedRemovalIds.has(String(id));
  });
  return {
    retainedPrevious,
    confirmedRemovalIds,
    confirmationResults,
    state: {
      schemaVersion: DISCOVERY_STATE_VERSION,
      repositories: [...next.values()].sort((a, b) => a.repositoryId.localeCompare(b.repositoryId)),
    },
    diagnostics: {
      observedRepositories: observedById.size,
      temporarilyMissed,
      confirmationChecks: Math.min(candidates.length, confirmationLimit),
      confirmedRemovals: confirmedRemovalIds.size,
      confirmationCandidatesDeferred: Math.max(0, candidates.length - confirmationLimit),
    },
  };
}
