import {
  ACTIVITY_IDS,
  CATEGORY_IDS,
  INSTALL_PREFIX,
  REPO_PATTERN,
} from './constants.js';

export function validateEntry(entry, errors, seen) {
  if (!entry || typeof entry !== 'object') {
    errors.push('entry is not an object');
    return;
  }
  const { name, repo, url, description, stars, license, categories, activity, installCommand, updatedAt } = entry;
  if (typeof name !== 'string' || !name) errors.push(`${repo || '?'}: missing name`);
  if (typeof repo !== 'string' || !REPO_PATTERN.test(repo)) errors.push(`${repo || '?'}: invalid repo`);
  if (typeof url !== 'string' || !url.startsWith('https://github.com/')) errors.push(`${repo || '?'}: invalid url`);
  if (repo && url && url !== `https://github.com/${repo}`) errors.push(`${repo}: url mismatch`);
  if (typeof description !== 'string') errors.push(`${repo}: description must be a string`);
  if (!Number.isInteger(stars) || stars < 0) errors.push(`${repo}: invalid stars`);
  if (typeof license !== 'string' || !license) errors.push(`${repo}: missing license`);
  if (!Array.isArray(categories) || categories.length === 0) {
    errors.push(`${repo}: categories must be a non-empty array`);
  } else {
    for (const c of categories) if (!CATEGORY_IDS.has(c)) errors.push(`${repo}: unknown category ${c}`);
    if (new Set(categories).size !== categories.length) errors.push(`${repo}: duplicate categories`);
  }
  if (!ACTIVITY_IDS.has(activity)) errors.push(`${repo}: invalid activity ${activity}`);
  if (installCommand !== `${INSTALL_PREFIX}${repo}`) errors.push(`${repo}: invalid installCommand`);
  if (!updatedAt || Number.isNaN(Date.parse(updatedAt))) errors.push(`${repo}: invalid updatedAt`);
  if (entry.compatibility !== undefined) {
    const c = entry.compatibility;
    if (!['verified', 'failed', 'unknown', 'pending'].includes(c?.status)) {
      errors.push(`${repo}: invalid compatibility status`);
    }
    if (c?.dshVersion !== null && typeof c?.dshVersion !== 'string') {
      errors.push(`${repo}: invalid compatibility dshVersion`);
    }
    if (c?.lastCheckedAt !== null && (typeof c?.lastCheckedAt !== 'string' || Number.isNaN(Date.parse(c.lastCheckedAt)))) {
      errors.push(`${repo}: invalid compatibility lastCheckedAt`);
    }
  }
  if (entry.installProbe !== undefined) {
    const p = entry.installProbe;
    if (!['installed', 'blocked', 'failed', 'timeout', 'not-tested'].includes(p?.status)) errors.push(`${repo}: invalid installProbe status`);
    if (p?.dshVersion !== null && typeof p?.dshVersion !== 'string') errors.push(`${repo}: invalid installProbe dshVersion`);
    if (p?.checkedAt !== null && (!p?.checkedAt || Number.isNaN(Date.parse(p.checkedAt)))) errors.push(`${repo}: invalid installProbe checkedAt`);
    if (p?.scope?.kind !== 'top-by-stars' || !Number.isInteger(p?.scope?.limit)) errors.push(`${repo}: invalid installProbe scope`);
  }
  if (entry.githubRepoId !== undefined) {
    if (!Number.isInteger(entry.githubRepoId) || entry.githubRepoId <= 0) errors.push(`${repo}: invalid githubRepoId`);
    for (const field of ['defaultBranch', 'repoPushedAt', 'lastSeenAt', 'lastManifestCheckedAt', 'discoverySource']) {
      if (typeof entry[field] !== 'string' || !entry[field]) errors.push(`${repo}: missing ${field}`);
    }
    if (entry.firstSeenAt !== null && (!entry.firstSeenAt || Number.isNaN(Date.parse(entry.firstSeenAt)))) errors.push(`${repo}: invalid firstSeenAt`);
    if (entry.packageName !== null && typeof entry.packageName !== 'string') errors.push(`${repo}: invalid packageName`);
    if (entry.packageVersion !== null && typeof entry.packageVersion !== 'string') errors.push(`${repo}: invalid packageVersion`);
  }
  if (repo) {
    const key = repo.toLowerCase();
    if (seen.has(key)) errors.push(`${repo}: duplicate repo`);
    seen.add(key);
  }
}

export function validateCompatibilityFile(compat, registry) {
  const errors = [];
  const statuses = compat?.schemaVersion === 2
    ? new Set(['installed', 'blocked', 'failed', 'timeout', 'not-tested'])
    : new Set(['verified', 'failed', 'unknown', 'pending']);
  if (!compat || typeof compat !== 'object') return ['compatibility.json is missing or invalid'];
  if (typeof compat.dshVersion !== 'string' || !compat.dshVersion) errors.push('compatibility: missing dshVersion');
  const repos = new Set(registry.map((e) => e.repo.toLowerCase()));
  for (const r of compat.results || []) {
    if (!repos.has(r.repo.toLowerCase())) errors.push(`compatibility: unknown repo ${r.repo}`);
    if (!statuses.has(r.status)) errors.push(`compatibility: ${r.repo} invalid status`);
    if (!r.checkedAt || Number.isNaN(Date.parse(r.checkedAt))) errors.push(`compatibility: ${r.repo} invalid checkedAt`);
    if (compat.schemaVersion === 2 && (r.scope?.kind !== 'top-by-stars' || !Number.isInteger(r.scope?.limit))) errors.push(`compatibility: ${r.repo} invalid scope`);
  }
  return errors;
}

/**
 * Drop compatibility results whose repo is no longer in the registry. Called
 * from the refresh pipeline so a renamed repo degrades gracefully instead of
 * failing `validateCompatibilityFile` and freezing the registry (the 11-day
 * stall of 2026-08). `check` still rejects unknown repos — the prune runs
 * first, keeping the check strict as a backstop.
 */
export function pruneCompatResults(compat, registryRepos) {
  if (!compat || typeof compat !== 'object') return { compat, removed: [] };
  const repos = new Set((registryRepos || []).map((r) => r.toLowerCase()));
  const removed = [];
  const kept = [];
  for (const r of compat.results || []) {
    if (r && typeof r.repo === 'string' && !repos.has(r.repo.toLowerCase())) {
      removed.push(r.repo);
    } else {
      kept.push(r);
    }
  }
  if (removed.length === 0) return { compat, removed: [] };
  return { compat: { ...compat, results: kept }, removed };
}

export function weeklyFreshnessWarnings(weekFiles, now = Date.now()) {
  const warnings = [];
  for (const file of weekFiles) {
    if (!file.exists) {
      warnings.push(`${file.name}: missing (expected after first weekly run)`);
      continue;
    }
    const m = file.content.match(/<!-- WEEK_END:\s*(\d{4}-\d{2}-\d{2})\s*-->/);
    if (!m) {
      warnings.push(`${file.name}: missing WEEK_END marker`);
      continue;
    }
    const days = Math.floor((now - Date.parse(m[1])) / 86_400_000);
    if (days > 8) warnings.push(`${file.name}: stale (${days} days old)`);
  }
  return warnings;
}

export function validateRegistry(registry) {
  const errors = [];
  const seen = new Set();
  if (!Array.isArray(registry)) return ['registry is not an array'];
  if (registry.length === 0) return ['registry is empty'];
  for (const entry of registry) validateEntry(entry, errors, seen);
  return errors;
}

export function validateMeta(meta, registry) {
  const errors = [];
  if (!meta || typeof meta !== 'object') return ['meta.json is missing'];
  if (!meta.generatedAt || Number.isNaN(Date.parse(meta.generatedAt))) errors.push('meta: invalid generatedAt');
  if (meta.pluginCount !== registry.length) errors.push(`meta: pluginCount ${meta.pluginCount} != registry ${registry.length}`);
  if (!Number.isInteger(meta.monitoredRepos) || meta.monitoredRepos < meta.pluginCount) errors.push('meta: invalid monitoredRepos');
  const sum = registry.reduce((acc, e) => acc + e.stars, 0);
  if (meta.totalStars !== sum) errors.push(`meta: totalStars ${meta.totalStars} != computed ${sum}`);
  return errors;
}

export function validateEventLedger(ledger) {
  if (!ledger || ledger.schemaVersion !== 1 || !Array.isArray(ledger.events)) return ['events: invalid ledger'];
  const errors = [];
  const ids = new Set();
  const types = new Set(['plugin_added', 'plugin_removed', 'repo_renamed', 'package_version_changed', 'activity_changed', 'install_probe_changed']);
  for (const event of ledger.events) {
    if (typeof event.id !== 'string' || !event.id) errors.push('events: missing id');
    else if (ids.has(event.id)) errors.push(`events: duplicate id ${event.id}`);
    else ids.add(event.id);
    if (!types.has(event.type)) errors.push(`events: invalid type ${event.type}`);
    if (typeof event.repositoryId !== 'string' || !event.repositoryId) errors.push(`events: ${event.id || '?'} missing repositoryId`);
    if (!event.occurredAt || Number.isNaN(Date.parse(event.occurredAt))) errors.push(`events: ${event.id || '?'} invalid occurredAt`);
  }
  return errors;
}

export function validateDiscoveryState(state) {
  if (!state || state.schemaVersion !== 1 || !Array.isArray(state.records)) return ['discovery-state: invalid state'];
  const errors = [];
  const keys = new Set();
  for (const record of state.records) {
    if (record.repositoryId !== null && (!Number.isInteger(record.repositoryId) || record.repositoryId <= 0)) errors.push(`${record.repo || '?'}: invalid discovery repositoryId`);
    if (typeof record.repo !== 'string' || !REPO_PATTERN.test(record.repo)) errors.push(`${record.repo || '?'}: invalid discovery repo`);
    if (record.lastDiscoveredAt !== null && (!record.lastDiscoveredAt || Number.isNaN(Date.parse(record.lastDiscoveredAt)))) errors.push(`${record.repo}: invalid lastDiscoveredAt`);
    if (!Number.isInteger(record.consecutiveDiscoveryMisses) || record.consecutiveDiscoveryMisses < 0) errors.push(`${record.repo}: invalid consecutiveDiscoveryMisses`);
    const key = record.repositoryId === null ? `repo:${record.repo?.toLowerCase()}` : `id:${record.repositoryId}`;
    if (keys.has(key)) errors.push(`${record.repo}: duplicate discovery record`);
    keys.add(key);
  }
  return errors;
}

export function checkReadme(text, registry, meta, label = 'README') {
  const errors = [];
  if (!text.includes(`**${registry.length}**`)) {
    errors.push(`${label}: missing plugin count **${registry.length}**`);
  }
  const date = meta.generatedAt.slice(0, 10);
  if (!text.includes(date)) errors.push(`${label}: missing last-updated date ${date}`);
  return errors;
}

export function checkCatalog(text, registry, label) {
  const errors = [];
  if (!text.includes(`**${registry.length}**`) && !text.includes(`${registry.length} plugins`)) {
    errors.push(`${label}: missing plugin count ${registry.length}`);
  }
  for (const e of registry) {
    if (!text.includes(e.url)) {
      errors.push(`${label}: missing ${e.url}`);
      break;
    }
  }
  return errors;
}

export function checkOverrides(overrides, registry) {
  const errors = [];
  const repos = new Set(registry.map((e) => e.repo.toLowerCase()));
  for (const [repo, cats] of Object.entries(overrides.categories || {})) {
    if (!repos.has(repo.toLowerCase())) {
      errors.push(`overrides: category entry ${repo} not in registry`);
    }
    for (const c of cats) {
      if (!CATEGORY_IDS.has(c)) errors.push(`overrides: unknown category ${c} for ${repo}`);
    }
  }
  for (const repo of Object.keys(overrides.descriptions || {})) {
    if (!repos.has(repo.toLowerCase())) {
      errors.push(`overrides: description entry ${repo} not in registry`);
    }
  }
  return errors;
}
