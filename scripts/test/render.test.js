import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INSTALL_PREFIX } from '../lib/constants.js';
import { registryStats, renderCatalog, renderReadme } from '../lib/render.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const zhTemplate = fs.readFileSync(path.join(ROOT, 'data', 'readme.template.zh.md'), 'utf8');
const enTemplate = fs.readFileSync(path.join(ROOT, 'data', 'readme.template.en.md'), 'utf8');

const entry = (repo, stars, categories, description) => ({
  name: repo.split('/')[1],
  repo,
  url: `https://github.com/${repo}`,
  description,
  stars,
  license: 'MIT',
  categories,
  activity: 'active',
  installCommand: `${INSTALL_PREFIX}${repo}`,
  updatedAt: '2026-08-15T00:00:00.000Z',
});

const registry = [
  entry('a/one', 500, ['vision'], 'A vision plugin'),
  entry('b/two', 100, ['coding'], 'A coding plugin'),
];
const meta = {
  generatedAt: '2026-08-15T01:02:03.000Z',
  monitoredRepos: 2,
  totalStars: 600,
  pluginCount: 2,
};

test('renderReadme: zh template fills placeholders and has no credits', () => {
  const out = renderReadme(registry, meta, zhTemplate, 'zh');
  assert.ok(out.includes('awesome-dsh-hub'));
  assert.ok(out.includes('**2**'));
  assert.ok(out.includes('2026-08-15'));
  assert.ok(out.includes('| 1 | [a/one](https://github.com/a/one) | 500 | 视觉与多模态'));
  assert.ok(!out.includes('{{'));
  assert.ok(!out.includes('致谢'));
  assert.ok(!out.includes('Credits'));
});

test('renderReadme: en template uses English labels and has no credits', () => {
  const out = renderReadme(registry, meta, enTemplate, 'en');
  assert.ok(out.includes('awesome-dsh-hub'));
  assert.ok(out.includes('**2**'));
  assert.ok(out.includes('Vision & Multimodal'));
  assert.ok(out.includes('Ecosystem Stats'));
  assert.ok(!out.includes('{{'));
  assert.ok(!out.includes('致谢'));
  assert.ok(!out.includes('Credits'));
});

test('renderReadme: category counts and top10 order are computed', () => {
  const out = renderReadme(registry, meta, zhTemplate, 'zh');
  assert.ok(out.includes('视觉与多模态 1 · 编码开发 1'));
  assert.ok(out.indexOf('a/one') < out.indexOf('b/two'));
});

test('renderCatalog: lists both repos and sections', () => {
  const zh = renderCatalog(registry, meta, 'zh');
  assert.ok(zh.includes('https://github.com/a/one'));
  assert.ok(zh.includes('https://github.com/b/two'));
  assert.ok(zh.includes('## 视觉与多模态'));
  const en = renderCatalog(registry, meta, 'en');
  assert.ok(en.includes('## Vision & Multimodal'));
});

test('registryStats: totals and per-category counts', () => {
  const s = registryStats(registry, meta);
  assert.equal(s.total, 2);
  assert.equal(s.totalStars, 600);
  assert.equal(s.perCategory.get('vision'), 1);
});
