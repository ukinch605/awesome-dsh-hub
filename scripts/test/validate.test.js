import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMeta, validateRegistry } from '../lib/validate.js';
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
