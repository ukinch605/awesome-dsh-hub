import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateStageCShadow } from './lib/registry-v3-stage-c.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = path.join(ROOT, 'registry');
const DATA = path.join(ROOT, 'data');

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const generatedAt = new Date().toISOString();
  const shadowRegistry = readJson(path.join(REGISTRY, 'plugins-v3-shadow.json'), null);
  const previousEventState = readJson(path.join(REGISTRY, 'registry-v3-event-state.json'), {
    schemaVersion: 1,
    entries: [],
  });
  const shadowEventLedger = readJson(path.join(REGISTRY, 'events-v3-shadow.json'), {
    schemaVersion: 1,
    semantics: 'shadow-package-events-v3',
    authoritative: false,
    events: [],
  });
  const v2EventLedger = readJson(path.join(REGISTRY, 'events.json'), { schemaVersion: 1, events: [] });
  const compatibility = readJson(path.join(REGISTRY, 'compatibility.json'), { results: [] });
  const overrides = readJson(path.join(DATA, 'overrides.json'), {});

  const result = generateStageCShadow({
    shadowRegistry,
    previousEventState,
    shadowEventLedger,
    v2EventLedger,
    compatibility,
    overrides,
    generatedAt,
  });

  writeJson(path.join(REGISTRY, 'events-v3-shadow.json'), result.eventLedger);
  writeJson(path.join(REGISTRY, 'registry-v3-event-state.json'), result.eventState);
  writeJson(path.join(REGISTRY, 'registry-v3-dependent-state.json'), result.dependentState);
  writeJson(path.join(REGISTRY, 'registry-v3-stage-c-report.json'), result.report);

  console.log(
    `dsh-hub: stage-c shadow eventsGenerated=${result.report.packageEventsGenerated} `
    + `totalEvents=${result.report.totalShadowPackageEvents} `
    + `legacyRefs=${result.report.legacyV2EventsReferenced} `
    + `dependent=${result.report.dependentEntries} `
    + `cutoverReady=${result.report.publicCutoverReady}`,
  );
}

main();
