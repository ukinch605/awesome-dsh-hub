import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORY_IDS } from './lib/constants.js';
import { validateMeta, validateRegistry } from './lib/validate.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

function checkReadme(readme, registry, meta) {
  const errors = [];
  if (!readme.includes(`**${registry.length}**`)) {
    errors.push(`README: missing plugin count **${registry.length}**`);
  }
  const date = meta.generatedAt.slice(0, 10);
  if (!readme.includes(date)) errors.push(`README: missing last-updated date ${date}`);
  return errors;
}

function checkCatalog(text, registry, label) {
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

function checkOverrides(overrides, registry) {
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

function main() {
  const errors = [];
  const registry = JSON.parse(read('registry/plugins.json'));
  const meta = exists('registry/meta.json') ? JSON.parse(read('registry/meta.json')) : null;
  const overrides = exists('data/overrides.json')
    ? JSON.parse(read('data/overrides.json'))
    : {};

  errors.push(...validateRegistry(registry));
  errors.push(...validateMeta(meta, registry));

  const readme = read('README.md');
  errors.push(...checkReadme(readme, registry, meta));
  for (const [file, label] of [
    ['docs/catalog.zh.md', 'catalog.zh.md'],
    ['docs/catalog.en.md', 'catalog.en.md'],
  ]) {
    if (exists(file)) errors.push(...checkCatalog(read(file), registry, label));
    else errors.push(`${label}: missing`);
  }

  const sitePlugins = exists('site/plugins.json')
    ? JSON.parse(read('site/plugins.json'))
    : null;
  if (!sitePlugins) errors.push('site/plugins.json: missing');
  else if (JSON.stringify(sitePlugins) !== JSON.stringify(registry)) {
    errors.push('site/plugins.json: out of sync with registry');
  }

  errors.push(...checkOverrides(overrides, registry));

  if (errors.length > 0) {
    console.error(`dsh-hub check failed (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(
    `dsh-hub check OK: ${registry.length} plugins, ${meta?.monitoredRepos ?? '?'} monitored, generated ${meta?.generatedAt ?? '?'}`,
  );
}

main();
