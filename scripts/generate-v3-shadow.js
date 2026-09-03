import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateShadowRegistryV3,
  REGISTRY_V3_IDENTITY_STATE_SCHEMA_VERSION,
} from './lib/registry-v3-shadow.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_DIR = path.join(ROOT, 'registry');
const V2_FILE = path.join(REGISTRY_DIR, 'plugins.json');
const TOPOLOGY_FILE = path.join(REGISTRY_DIR, 'package-topology-state.json');
const IDENTITY_FILE = path.join(REGISTRY_DIR, 'registry-v3-identity-state.json');
const SHADOW_FILE = path.join(REGISTRY_DIR, 'plugins-v3-shadow.json');
const REPORT_FILE = path.join(REGISTRY_DIR, 'registry-v3-migration-report.json');

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function main() {
  const generatedAt = new Date().toISOString();
  const v2Entries = readJson(V2_FILE, []);
  const topologyState = readJson(TOPOLOGY_FILE, { schemaVersion: 1, repositories: [] });
  const identityState = readJson(IDENTITY_FILE, {
    schemaVersion: REGISTRY_V3_IDENTITY_STATE_SCHEMA_VERSION,
    identities: [],
  });
  if (!Array.isArray(v2Entries)) throw new Error('Registry v2 must be an array');
  if (!Array.isArray(topologyState?.repositories)) throw new Error('Package topology state is invalid');
  if (identityState?.schemaVersion !== REGISTRY_V3_IDENTITY_STATE_SCHEMA_VERSION
    || !Array.isArray(identityState?.identities)) {
    throw new Error('Registry v3 identity state is invalid');
  }

  const result = generateShadowRegistryV3({
    v2Entries,
    topologyState,
    identityState,
    generatedAt,
  });
  fs.writeFileSync(SHADOW_FILE, `${JSON.stringify(result.registry, null, 2)}\n`);
  fs.writeFileSync(IDENTITY_FILE, `${JSON.stringify(result.identityState, null, 2)}\n`);
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(result.migrationReport, null, 2)}\n`);

  console.log(
    `dsh-hub: shadow v3 entries=${result.registry.entries.length} `
    + `v2Carried=${result.migrationReport.v2RootEntriesCarried} `
    + `nested=${result.migrationReport.nestedCandidates} `
    + `ambiguous=${result.migrationReport.ambiguousIdentities} `
    + `placeholders=${result.migrationReport.placeholderPackageNames} `
    + `cutoverReady=${result.migrationReport.publicCutoverReady}`,
  );
}

main();
