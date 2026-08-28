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
