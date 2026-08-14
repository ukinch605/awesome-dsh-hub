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
