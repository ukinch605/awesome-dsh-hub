import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOverrides } from '../lib/overrides.js';

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
