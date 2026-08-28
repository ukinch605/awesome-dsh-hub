import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOverrides, pruneOverrides } from '../lib/overrides.js';

const entry = (repo, categories, description) => ({
  name: repo.split('/')[1],
  repo,
  description,
  categories: [...categories],
});

test('applyOverrides: exclude removes repos', () => {
  const entries = [entry('a/x', ['agent'], 'a'), entry('b/y', ['agent'], 'b')];
  const out = applyOverrides(entries, { exclude: ['A/X'] });
  assert.deepEqual(out.map((e) => e.repo), ['b/y']);
});

test('applyOverrides: categories replace auto-classification', () => {
  const entries = [entry('a/x', ['agent'], 'a')];
  const out = applyOverrides(entries, { categories: { 'a/x': ['coding', 'devtools'] } });
  assert.deepEqual(out[0].categories, ['coding', 'devtools']);
});

test('applyOverrides: invalid category ids are dropped, falls back to agent', () => {
  const entries = [entry('a/x', ['agent'], 'a')];
  const out = applyOverrides(entries, { categories: { 'a/x': ['nope'] } });
  assert.deepEqual(out[0].categories, ['agent']);
});

test('applyOverrides: descriptions override', () => {
  const entries = [entry('a/x', ['agent'], 'old')];
  const out = applyOverrides(entries, { descriptions: { 'a/x': 'new text' } });
  assert.equal(out[0].description, 'new text');
});

test('pruneOverrides: drops stale repos, keeps comment and exclude intent', () => {
  const overrides = {
    _comment: 'keep me',
    exclude: ['ghost/old'],
    categories: { 'a/x': ['coding'], 'renamed/y': ['web-ui'] },
    descriptions: { 'a/x': 'ok', 'gone/z': 'stale' },
  };
  const removed = pruneOverrides(overrides, ['a/x']);
  assert.deepEqual(removed.sort(), ['categories: renamed/y', 'descriptions: gone/z']);
  assert.equal(overrides._comment, 'keep me');
  assert.deepEqual(overrides.exclude, ['ghost/old']);
  assert.deepEqual(overrides.categories, { 'a/x': ['coding'] });
  assert.deepEqual(overrides.descriptions, { 'a/x': 'ok' });
});
