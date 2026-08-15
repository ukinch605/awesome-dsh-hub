import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { filterChangelogSince, renderWeekly, weekWindow } from '../weekly.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const zhTemplate = fs.readFileSync(path.join(ROOT, 'data', 'weekly.template.zh.md'), 'utf8');
const enTemplate = fs.readFileSync(path.join(ROOT, 'data', 'weekly.template.en.md'), 'utf8');

const entry = (repo, stars, categories) => ({
  name: repo.split('/')[1],
  repo,
  url: `https://github.com/${repo}`,
  description: 'desc',
  stars,
  license: 'MIT',
  categories,
  activity: 'active',
  installCommand: `npx @deepseek-ai/dsh plugin --profile web add github:${repo}`,
  updatedAt: '2026-08-15T00:00:00.000Z',
});

const registry = [
  entry('a/one', 500, ['vision']),
  entry('b/two', 300, ['coding']),
  entry('c/three', 100, ['agent']),
];

const now = Date.parse('2026-08-15T00:00:00Z');

test('weekWindow: covers the last 7 days', () => {
  const w = weekWindow(now);
  assert.equal(w.end, '2026-08-15');
  assert.equal(w.start, '2026-08-08');
});

test('filterChangelogSince: keeps only recent additions', () => {
  const changelog = [
    { repo: 'a/new', addedAt: '2026-08-14T00:00:00Z' },
    { repo: 'b/old', addedAt: '2026-08-01T00:00:00Z' },
  ];
  const out = filterChangelogSince(changelog, weekWindow(now).start);
  assert.deepEqual(out.map((e) => e.repo), ['a/new']);
});

test('renderWeekly: zh renders issue 1 with new plugins, no placeholders', () => {
  const out = renderWeekly({
    registry,
    changelog: [{ repo: 'a/one', addedAt: '2026-08-14T00:00:00Z', stars: 500, description: 'desc', url: 'https://github.com/a/one' }],
    baseline: null,
    template: zhTemplate,
    lang: 'zh',
    now,
  });
  assert.ok(out.includes('周报 #1'));
  assert.ok(out.includes('**1**'));
  assert.ok(out.includes('| [a/one](https://github.com/a/one) | 500 | desc |'));
  assert.ok(out.includes('WEEK_END: 2026-08-15'));
  assert.ok(!out.includes('{{'));
});

test('renderWeekly: en renders English labels and baseline note on first run', () => {
  const out = renderWeekly({
    registry,
    changelog: [],
    baseline: null,
    template: enTemplate,
    lang: 'en',
    now,
  });
  assert.ok(out.includes('Weekly #1'));
  assert.ok(out.includes('Baseline established'));
  assert.ok(out.includes('**0**'));
  assert.ok(!out.includes('{{'));
});

test('renderWeekly: with baseline, surge and top10 changes appear', () => {
  const baseline = {
    issue: 1,
    entries: registry.map((e) => ({ repo: e.repo, stars: e.stars - 10, categories: e.categories })),
  };
  const out = renderWeekly({
    registry,
    changelog: [],
    baseline,
    template: zhTemplate,
    lang: 'zh',
    now,
  });
  assert.ok(out.includes('周报 #2'));
  assert.ok(out.includes('+10'));
  assert.ok(!out.includes('首期基线已建立'));
});
