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
  if (repo) {
    const key = repo.toLowerCase();
    if (seen.has(key)) errors.push(`${repo}: duplicate repo`);
    seen.add(key);
  }
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
