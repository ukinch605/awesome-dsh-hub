import fs from 'node:fs';
import path from 'node:path';
import { CATEGORY_IDS } from './constants.js';

export function loadOverrides(rootDir) {
  const file = path.join(rootDir, 'data', 'overrides.json');
  if (!fs.existsSync(file)) return {};
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = {};
  for (const key of ['exclude', 'categories', 'descriptions']) {
    if (Array.isArray(raw[key])) out[key] = [...raw[key]];
    else if (raw[key] && typeof raw[key] === 'object') out[key] = { ...raw[key] };
    else out[key] = key === 'exclude' ? [] : {};
  }
  return out;
}

export function applyOverrides(entries, overrides = {}) {
  const exclude = new Set((overrides.exclude || []).map((s) => s.toLowerCase()));
  const categories = overrides.categories || {};
  const descriptions = overrides.descriptions || {};

  return entries
    .filter((e) => !exclude.has(e.repo.toLowerCase()))
    .map((e) => {
      const fixedCategories = categories[e.repo];
      if (Array.isArray(fixedCategories)) {
        e.categories = fixedCategories.filter((c) => CATEGORY_IDS.has(c));
        if (e.categories.length === 0) e.categories = ['agent'];
      }
      if (typeof descriptions[e.repo] === 'string') {
        e.description = descriptions[e.repo];
      }
      return e;
    });
}

/**
 * Remove override entries whose repo is no longer in the registry, so a
 * renamed or vanished repo can never deadlock the refresh (the 11-day stall
 * of 2026-08 was caused by exactly this kind of stale cross-reference).
 * Operates on the raw parsed file object in place so `_comment` and
 * `exclude` (intent that may apply again later) survive. Returns the list of
 * removed `key: repo` entries.
 */
export function pruneOverrides(overrides, registryRepos) {
  const repos = new Set((registryRepos || []).map((r) => r.toLowerCase()));
  const removed = [];
  for (const key of ['categories', 'descriptions']) {
    const map = overrides[key];
    if (!map || typeof map !== 'object') continue;
    for (const repo of Object.keys(map)) {
      if (!repos.has(repo.toLowerCase())) {
        delete map[repo];
        removed.push(`${key}: ${repo}`);
      }
    }
  }
  return removed;
}
