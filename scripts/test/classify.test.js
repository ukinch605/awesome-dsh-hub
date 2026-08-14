import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../lib/classify.js';

const repo = (name, description = '', topics = []) => ({ name, description, topics });

test('classify: vision keyword in topics', () => {
  const c = classify(repo('dsh-vision-toolkit', '', ['vision', 'ocr']));
  assert.ok(c.includes('vision'));
});

test('classify: Chinese description for messaging', () => {
  const c = classify(repo('dsh-feishu-bot', '飞书机器人通知', []));
  assert.ok(c.includes('messaging'));
});

test('classify: coding keywords in name', () => {
  const c = classify(repo('dsh-gitflow', 'Git 提交与分支工具', []));
  assert.ok(c.includes('coding'));
});

test('classify: fun keywords', () => {
  const c = classify(repo('whale-girl', '桌面宠物，可拖拽投喂', []));
  assert.ok(c.includes('fun'));
});

test('classify: web-ui keywords', () => {
  const c = classify(repo('dsh-sidebar', 'Web UI 侧边栏增强', []));
  assert.ok(c.includes('web-ui'));
});

test('classify: data keywords (zotero)', () => {
  const c = classify(repo('zotero-harvest', 'Zotero 文献库接入', []));
  assert.ok(c.includes('data'));
});

test('classify: defaults to agent when no keywords match', () => {
  assert.deepEqual(classify(repo('mystery-x', 'zzz qqq', [])), ['agent']);
});

test('classify: returns at most 2 categories and no duplicates', () => {
  const c = classify(repo('dsh-web-ui-kit', 'Web UI 面板与皮肤', []));
  assert.ok(c.length >= 1 && c.length <= 2);
  assert.equal(new Set(c).size, c.length);
});
