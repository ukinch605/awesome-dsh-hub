import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkCatalog,
  checkReadme,
  validateMeta,
  validateRegistry,
  validateCompatibilityFile,
  weeklyFreshnessWarnings,
} from '../lib/validate.js';
import { INSTALL_PREFIX } from '../lib/constants.js';

const goodEntry = (repo = 'owner/name') => ({
  name: 'name',
  repo,
  url: `https://github.com/${repo}`,
  description: 'A plugin',
  stars: 10,
  license: 'MIT',
  categories: ['agent'],
  activity: 'active',
  installCommand: `${INSTALL_PREFIX}${repo}`,
  updatedAt: '2026-08-14T00:00:00.000Z',
});

test('validateRegistry: accepts a valid registry', () => {
  assert.deepEqual(validateRegistry([goodEntry()]), []);
});

test('validateRegistry: rejects duplicates', () => {
  const errors = validateRegistry([goodEntry('a/b'), goodEntry('A/B')]);
  assert.ok(errors.some((e) => e.includes('duplicate')));
});

test('validateRegistry: rejects bad install command', () => {
  const e = goodEntry();
  e.installCommand = 'pip install x';
  const errors = validateRegistry([e]);
  assert.ok(errors.some((err) => err.includes('installCommand')));
});

test('validateRegistry: rejects unknown category and bad activity', () => {
  const e = goodEntry();
  e.categories = ['nope'];
  e.activity = 'unknown';
  const errors = validateRegistry([e]);
  assert.ok(errors.some((err) => err.includes('unknown category')));
  assert.ok(errors.some((err) => err.includes('invalid activity')));
});

test('validateRegistry: rejects missing fields and empty registry', () => {
  assert.equal(validateRegistry([])[0], 'registry is empty');
  const errors = validateRegistry([{ repo: 'a/b' }]);
  assert.ok(errors.some((e) => e.includes('missing name')));
});

test('validateMeta: checks generatedAt and counts', () => {
  const registry = [goodEntry()];
  assert.deepEqual(
    validateMeta({ generatedAt: '2026-08-14T00:00:00Z', pluginCount: 1, monitoredRepos: 5, totalStars: 10 }, registry),
    [],
  );
  const errors = validateMeta({ generatedAt: 'bad', pluginCount: 9, monitoredRepos: 1, totalStars: 0 }, registry);
  assert.ok(errors.length >= 3);
});

test('checkReadme: passes when count and date are present', () => {
  const registry = [goodEntry()];
  const meta = { generatedAt: '2026-08-15T00:00:00Z' };
  const text = '**1** plugins 2026-08-15';
  assert.deepEqual(checkReadme(text, registry, meta, 'README.en.md'), []);
});

test('checkReadme: fails on missing count or date, with label', () => {
  const registry = [goodEntry()];
  const meta = { generatedAt: '2026-08-15T00:00:00Z' };
  const errors = checkReadme('no numbers here', registry, meta, 'README.en.md');
  assert.ok(errors.some((e) => e.includes('README.en.md: missing plugin count')));
  assert.ok(errors.some((e) => e.includes('README.en.md: missing last-updated date')));
});

test('checkCatalog: fails when a registry url is missing', () => {
  const registry = [goodEntry()];
  const errors = checkCatalog('no links', registry, 'catalog.en.md');
  assert.ok(errors.some((e) => e.includes('catalog.en.md: missing https://github.com/owner/name')));
});

test('validateRegistry: accepts and rejects compatibility field', () => {
  const ok = goodEntry();
  ok.compatibility = { dshVersion: '0.1.0-rc.6', status: 'verified', lastCheckedAt: '2026-08-15T00:00:00Z' };
  assert.deepEqual(validateRegistry([ok]), []);
  const bad = goodEntry();
  bad.compatibility = { dshVersion: 'x', status: 'nope', lastCheckedAt: 'bad' };
  const errors = validateRegistry([bad]);
  assert.ok(errors.some((e) => e.includes('invalid compatibility status')));
});

test('validateCompatibilityFile: checks version, statuses and repo existence', () => {
  const registry = [goodEntry('owner/name')];
  const compat = {
    dshVersion: '0.1.0-rc.6',
    results: [
      { repo: 'owner/name', status: 'verified', checkedAt: '2026-08-15T00:00:00Z' },
      { repo: 'ghost/repo', status: 'nope', checkedAt: 'bad' },
    ],
  };
  const errors = validateCompatibilityFile(compat, registry);
  assert.ok(errors.some((e) => e.includes('ghost/repo')));
  assert.ok(errors.length >= 3);
});

test('weeklyFreshnessWarnings: warns on missing or stale weekly files', () => {
  const stale = `<!-- WEEK_END: ${new Date(Date.now() - 20 * 86_400_000).toISOString().slice(0, 10)} -->`;
  const warnings = weeklyFreshnessWarnings([
    { name: 'WEEKLY.zh.md', exists: false, content: '' },
    { name: 'WEEKLY.en.md', exists: true, content: stale },
  ]);
  assert.ok(warnings.some((w) => w.includes('missing')));
  assert.ok(warnings.some((w) => w.includes('stale')));
  assert.deepEqual(
    weeklyFreshnessWarnings([
      { name: 'WEEKLY.en.md', exists: true, content: `<!-- WEEK_END: ${new Date().toISOString().slice(0, 10)} -->` },
    ]),
    [],
  );
});
