import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyOverrides, loadOverrides } from './lib/overrides.js';
import { registryStats, renderCatalog, renderReadme } from './lib/render.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_FILE = path.join(ROOT, 'registry', 'plugins.json');
const META_FILE = path.join(ROOT, 'registry', 'meta.json');

function main() {
  // Re-apply manual overrides so curation edits take effect without re-fetching.
  const registry = applyOverrides(
    JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8')),
    loadOverrides(ROOT),
  ).sort((a, b) => b.stars - a.stars);
  const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  meta.pluginCount = registry.length;
  meta.totalStars = registry.reduce((acc, e) => acc + e.stars, 0);

  fs.writeFileSync(REGISTRY_FILE, `${JSON.stringify(registry, null, 2)}\n`);
  fs.writeFileSync(META_FILE, `${JSON.stringify(meta, null, 2)}\n`);

  const zhTemplate = fs.readFileSync(path.join(ROOT, 'data', 'readme.template.zh.md'), 'utf8');
  const enTemplate = fs.readFileSync(path.join(ROOT, 'data', 'readme.template.en.md'), 'utf8');

  fs.writeFileSync(path.join(ROOT, 'README.md'), renderReadme(registry, meta, zhTemplate, 'zh'));
  fs.writeFileSync(path.join(ROOT, 'README.en.md'), renderReadme(registry, meta, enTemplate, 'en'));
  fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs', 'catalog.zh.md'), renderCatalog(registry, meta, 'zh'));
  fs.writeFileSync(path.join(ROOT, 'docs', 'catalog.en.md'), renderCatalog(registry, meta, 'en'));

  fs.mkdirSync(path.join(ROOT, 'site'), { recursive: true });
  fs.copyFileSync(REGISTRY_FILE, path.join(ROOT, 'site', 'plugins.json'));

  const s = registryStats(registry, meta);
  console.log(`dsh-hub: generated README.md, README.en.md, docs/catalog.{zh,en}.md, site/plugins.json`);
  console.log(`  plugins=${s.total} monitored=${s.monitored} totalStars=${s.totalStars}`);
}

main();
