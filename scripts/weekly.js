import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { categoryLabel, CATEGORIES } from './lib/constants.js';
import { registryStats } from './lib/render.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEEK_MS = 7 * 86_400_000;

export function weekWindow(now = Date.now()) {
  return {
    start: new Date(now - WEEK_MS).toISOString().slice(0, 10),
    end: new Date(now).toISOString().slice(0, 10),
  };
}

export function filterChangelogSince(changelog, sinceIso) {
  const cutoff = Date.parse(sinceIso);
  return (changelog || []).filter((e) => Date.parse(e.addedAt) >= cutoff);
}

function mdCell(text) {
  return (text || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function renderWeekly({
  registry,
  changelog,
  baseline,
  template,
  lang,
  now = Date.now(),
}) {
  const w = weekWindow(now);
  const s = registryStats(registry, { monitoredRepos: registry.length, totalStars: registry.reduce((a, e) => a + e.stars, 0) });
  const newPlugins = filterChangelogSince(changelog, w.start);
  const hasBaseline = Boolean(baseline?.entries);

  const newRows = newPlugins
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 20)
    .map(
      (e) =>
        `| [${mdCell(e.repo)}](${e.url}) | ${e.stars.toLocaleString()} | ${mdCell(e.description || '')} |`,
    )
    .join('\n');

  const surgeRows = [];
  if (hasBaseline) {
    const before = new Map(baseline.entries.map((e) => [e.repo, e.stars]));
    surgeRows.push(
      ...registry
        .filter((e) => before.has(e.repo))
        .map((e) => ({
          repo: e.repo,
          before: before.get(e.repo),
          after: e.stars,
          delta: e.stars - before.get(e.repo),
        }))
        .filter((x) => x.delta > 0)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 10)
        .map(
          (x) =>
            `| [${mdCell(x.repo)}](https://github.com/${x.repo}) | ${x.before.toLocaleString()} | ${x.after.toLocaleString()} | +${x.delta.toLocaleString()} |`,
        ),
    );
  }

  const categoryRows = [];
  if (hasBaseline) {
    const before = new Map(
      baseline.entries.map((e) => [e.repo, e.categories?.[0] || 'agent']),
    );
    const countBefore = (id) =>
      [...before.values()].filter((c) => c === id).length;
    const countAfter = (id) =>
      registry.filter((e) => e.categories[0] === id).length;
    for (const c of CATEGORIES) {
      const b = countBefore(c.id);
      const a = countAfter(c.id);
      if (b !== a) {
        categoryRows.push(
          `| ${c[lang]} | ${b} | ${a} | ${a > b ? `+${a - b}` : a - b} |`,
        );
      }
    }
  }

  const top10 = (list) =>
    [...list].sort((a, b) => b.stars - a.stars).slice(0, 10).map((e) => e.repo);
  const top10Changes = [];
  if (hasBaseline) {
    const beforeTop = new Set(top10(baseline.entries));
    const afterTop = top10(registry);
    for (const repo of afterTop) {
      if (!beforeTop.has(repo)) {
        const e = registry.find((x) => x.repo === repo);
        top10Changes.push(`- ${repo}（#${afterTop.indexOf(repo) + 1}，${e.stars.toLocaleString()}⭐）`);
      }
    }
  }

  const issue = baseline?.issue ? baseline.issue + 1 : 1;
  return template
    .replaceAll('{{ISSUE}}', issue)
    .replaceAll('{{WEEK_START}}', w.start)
    .replaceAll('{{WEEK_END}}', w.end)
    .replaceAll('{{TOTAL}}', s.total)
    .replaceAll('{{MONITORED}}', registry.length)
    .replaceAll('{{NEW_COUNT}}', newPlugins.length)
    .replaceAll('{{NEW_TABLE}}', newRows || '—')
    .replaceAll('{{SURGE_TABLE}}', surgeRows.join('\n') || '—')
    .replaceAll('{{CATEGORY_TABLE}}', categoryRows.join('\n') || '—')
    .replaceAll('{{TOP10_CHANGES}}', top10Changes.join('\n') || '—')
    .replaceAll(
      '{{BASELINE_NOTE}}',
      hasBaseline
        ? ''
        : lang === 'zh'
          ? '> 首期基线已建立，趋势对比自下一期开始。'
          : '> Baseline established; trend comparisons start next issue.',
    );
}

function main() {
  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'registry', 'plugins.json'), 'utf8'),
  );
  const changelog = fs.existsSync(path.join(ROOT, 'registry', 'changelog.json'))
    ? JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', 'changelog.json'), 'utf8'))
    : [];
  const baselineFile = path.join(ROOT, 'registry', 'weekly-baseline.json');
  const baseline = fs.existsSync(baselineFile)
    ? JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
    : null;

  const zhTemplate = fs.readFileSync(path.join(ROOT, 'data', 'weekly.template.zh.md'), 'utf8');
  const enTemplate = fs.readFileSync(path.join(ROOT, 'data', 'weekly.template.en.md'), 'utf8');
  const zh = renderWeekly({ registry, changelog, baseline, template: zhTemplate, lang: 'zh' });
  const en = renderWeekly({ registry, changelog, baseline, template: enTemplate, lang: 'en' });

  fs.writeFileSync(path.join(ROOT, 'WEEKLY.zh.md'), zh);
  fs.writeFileSync(path.join(ROOT, 'WEEKLY.en.md'), en);
  fs.mkdirSync(path.join(ROOT, 'docs', 'promotion'), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, 'docs', 'promotion', 'weekly-discussion.md'),
    `# 本周新增 N 个插件 · Weekly Plugins Update\n\n> 自动生成的周报草稿，发布到 GitHub Discussions 前可自行删改。\n\n${zh}\n`,
  );

  const nextBaseline = {
    issue: baseline?.issue ? baseline.issue + 1 : 1,
    generatedAt: new Date().toISOString(),
    entries: registry.map((e) => ({
      repo: e.repo,
      stars: e.stars,
      categories: e.categories,
    })),
  };
  fs.writeFileSync(baselineFile, `${JSON.stringify(nextBaseline, null, 2)}\n`);
  console.log(
    `weekly: issue ${nextBaseline.issue} generated (new=${changelog.length} tracked, ${new Date().toISOString()})`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
