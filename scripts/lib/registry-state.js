export function preserveTransientEntry(result, repo, previousByRepo, entries) {
  if (result.kind !== 'transient-failure') return false;
  const previous = previousByRepo.get(repo.toLowerCase());
  if (previous) entries.push(previous);
  return true;
}

export function pruneConfirmedStale(records, currentRepos) {
  const repos = new Set(currentRepos.map((r) => r.toLowerCase()));
  return records.filter((r) => repos.has(r.repo.toLowerCase()));
}

/**
 * A GitHub Search snapshot may contain different repository IDs for the same
 * owner/name (stale search-index hits or name reuse). Never infer identity
 * from owner/name when both sides have distinct stable IDs.
 *
 * Repository-ID verification is deliberately bounded to collisions. If the
 * incumbent cannot be checked, retain it and defer the new candidate rather
 * than silently removing an unconfirmed v2 identity.
 */
export async function resolveRepoNameCollisions({ previous = [], observed = [], verify }) {
  const groups = new Map();
  for (const item of observed) {
    const key = item.full_name.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const checked = new Map();
  const check = async (id) => {
    const key = String(id);
    if (!checked.has(key)) {
      checked.set(key, Promise.resolve()
        .then(() => verify({ repositoryId: key }))
        .catch(() => ({ kind: 'transient-failure' })));
    }
    return checked.get(key);
  };
  const candidates = [];
  const unresolvedNames = new Set();
  let verifiedSearchCollisions = 0;
  for (const [name, group] of groups) {
    if (group.length === 1) {
      candidates.push(group[0]);
      continue;
    }
    verifiedSearchCollisions++;
    // Canonical repository metadata, not Search's potentially stale name,
    // decides which ID owns the name now.
    const verified = await Promise.all(group.map(async (item) => {
      const result = await check(item.id);
      return result?.kind === 'eligible' && String(result.repository?.id) === String(item.id)
        ? result.repository : null;
    }));
    const owners = verified.filter(Boolean);
    const names = new Set(owners.map((item) => item.full_name.toLowerCase()));
    if (owners.length > 0 && names.size === owners.length) {
      candidates.push(...owners);
    } else {
      // Never pick one ID arbitrarily when the live authority is unresolved.
      unresolvedNames.add(name);
    }
  }
  const confirmedRemovalIds = new Set();
  const deferredCandidateIds = new Set();
  const byName = () => new Map(candidates.map((item) => [item.full_name.toLowerCase(), item]));
  for (const old of previous) {
    if (old.githubRepoId == null) continue;
    const candidate = byName().get(old.repo.toLowerCase());
    if (!candidate || String(candidate.id) === String(old.githubRepoId)) continue;
    if (candidates.some((item) => String(item.id) === String(old.githubRepoId))) continue;
    const result = await check(old.githubRepoId);
    if (result?.kind === 'confirmed-removed') {
      confirmedRemovalIds.add(String(old.githubRepoId));
      continue;
    }
    const moved = result?.kind === 'eligible' && result.repository
      && String(result.repository.id) === String(old.githubRepoId)
      && result.repository.full_name.toLowerCase() !== old.repo.toLowerCase();
    if (moved && !byName().has(result.repository.full_name.toLowerCase())) {
      // The prior ID is still eligible under its verified renamed locator.
      // It can be refreshed normally; v2 will record repo_renamed, not removal.
      candidates.push(result.repository);
      continue;
    }
    // Transient/ambiguous identity: keep the unconfirmed incumbent visible
    // and defer the new name claimant until verification succeeds.
    deferredCandidateIds.add(String(candidate.id));
    unresolvedNames.add(old.repo.toLowerCase());
  }
  const afterDeferral = candidates.filter((item) => !deferredCandidateIds.has(String(item.id)));
  // A verified rename can coincide with another Search observation. If names
  // still collide, defer every claimant, preserving any prior via M3 retention.
  const finalGroups = new Map();
  for (const item of afterDeferral) {
    const name = item.full_name.toLowerCase();
    if (!finalGroups.has(name)) finalGroups.set(name, []);
    finalGroups.get(name).push(item);
  }
  const resolved = [];
  for (const [name, items] of finalGroups) {
    if (items.length === 1) resolved.push(items[0]);
    else unresolvedNames.add(name);
  }
  return {
    candidates: resolved,
    confirmedRemovalIds,
    diagnostics: {
      verifiedSearchCollisions,
      deferredNameClaimants: deferredCandidateIds.size,
      unresolvedRepoNames: [...unresolvedNames].sort(),
    },
  };
}

/** Repo-name fallback is only valid for pre-ID migration records. */
export function previousEntryForCandidate(candidate, previousById, previousByRepo) {
  const byId = candidate.id == null ? null : previousById.get(String(candidate.id));
  if (byId) return byId;
  const named = previousByRepo.get(candidate.full_name.toLowerCase());
  if (!named) return null;
  if (named.githubRepoId != null && candidate.id != null
    && String(named.githubRepoId) !== String(candidate.id)) return null;
  return named;
}
