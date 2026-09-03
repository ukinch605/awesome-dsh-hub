import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTopologySnapshot,
  scanRepository,
  selectRepositories,
} from './lib/package-topology.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DISCOVERY_STATE_FILE = path.join(ROOT, 'registry', 'discovery-state.json');
const META_FILE = path.join(ROOT, 'registry', 'meta.json');
const OUTPUT_FILE = path.join(ROOT, 'registry', 'package-topology.json');

function boundedInt(value, fallback, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

async function main() {
  const token = process.env.GITHUB_TOKEN || '';
  const repoLimit = boundedInt(process.env.PACKAGE_TOPOLOGY_REPO_LIMIT, 150, 300);
  const manifestLimit = boundedInt(process.env.PACKAGE_TOPOLOGY_MANIFEST_LIMIT, 100, 200);
  const includeRepos = String(process.env.PACKAGE_TOPOLOGY_INCLUDE || 'Neplich/dsh_plugin')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!fs.existsSync(DISCOVERY_STATE_FILE) || !fs.existsSync(META_FILE)) {
    throw new Error('package-topology: registry discovery state/meta is missing');
  }

  const state = JSON.parse(fs.readFileSync(DISCOVERY_STATE_FILE, 'utf8'));
  const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  const currentObserved = (state.repositories || []).filter(
    (item) => item?.lastDiscoveredAt === meta.generatedAt,
  );
  if (currentObserved.length === 0) {
    throw new Error('package-topology: no repositories match the current discovery observation');
  }

  const selected = selectRepositories(currentObserved, { limit: repoLimit, includeRepos });
  console.log(
    `package-topology: scanning ${selected.length}/${currentObserved.length} current observed repositories ` +
    `(repoLimit=${repoLimit}, manifestLimit=${manifestLimit})`,
  );

  const records = [];
  for (let index = 0; index < selected.length; index++) {
    const item = selected[index];
    process.stdout.write(`  [${index + 1}/${selected.length}] ${item.repo} ... `);
    const result = await scanRepository(item, { token, manifestLimit });
    records.push(result);
    const nested = result.manifests.filter((manifest) => manifest.kind === 'bundle' && !manifest.root).length;
    console.log(`${result.complete ? 'complete' : 'incomplete'} nestedBundles=${nested}`);
  }

  const generatedAt = new Date().toISOString();
  const snapshot = buildTopologySnapshot({
    generatedAt,
    observedRepositories: currentObserved.length,
    selectedRepositories: selected,
    records,
    repoLimit,
    manifestLimit,
    includeRepos,
  });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`package-topology: wrote ${path.relative(ROOT, OUTPUT_FILE)}`);
  console.log(`package-topology: ${JSON.stringify(snapshot.summary)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
