import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkCatalog,
  checkOverrides,
  checkReadme,
  validateMeta,
  validateRegistry,
} from './lib/validate.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

function main() {
  const errors = [];
  const registry = JSON.parse(read('registry/plugins.json'));
  const meta = exists('registry/meta.json') ? JSON.parse(read('registry/meta.json')) : null;
  const overrides = exists('data/overrides.json')
    ? JSON.parse(read('data/overrides.json'))
    : {};

  errors.push(...validateRegistry(registry));
  errors.push(...validateMeta(meta, registry));

  for (const file of ['README.md', 'README.en.md']) {
    if (exists(file)) errors.push(...checkReadme(read(file), registry, meta, file));
    else errors.push(`${file}: missing`);
  }
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
