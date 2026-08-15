import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOP_N = Number(process.env.COMPAT_TOP_N || 100);
const CONCURRENCY = Number(process.env.COMPAT_CONCURRENCY || 2);
const PER_TIMEOUT_MS = Number(process.env.COMPAT_TIMEOUT_MS || 150_000);
const DSH_VERSION = process.env.DSH_VERSION || '';

export function classifyCompatRun({ exitCode, timedOut, output }) {
  if (timedOut) return { status: 'failed', reason: 'timeout' };
  if (exitCode === 0) return { status: 'verified' };
  const tail = String(output || '')
    .trim()
    .split('\n')
    .slice(-3)
    .join(' ')
    .slice(0, 300);
  return { status: 'failed', reason: tail || `exit ${exitCode}` };
}

export function validateCompatResults(results) {
  const errors = [];
  const statuses = new Set(['verified', 'failed', 'unknown', 'pending']);
  for (const r of results || []) {
    if (!r || typeof r.repo !== 'string' || !r.repo.includes('/')) {
      errors.push('compat: result missing valid repo');
      continue;
    }
    if (!statuses.has(r.status)) errors.push(`compat: ${r.repo} invalid status ${r.status}`);
    if (typeof r.dshVersion !== 'string' || !r.dshVersion) errors.push(`compat: ${r.repo} missing dshVersion`);
    if (!r.checkedAt || Number.isNaN(Date.parse(r.checkedAt))) errors.push(`compat: ${r.repo} invalid checkedAt`);
  }
  return errors;
}

async function resolveLatestDshVersion() {
  const res = await fetch('https://registry.npmjs.org/@deepseek-ai/dsh/latest');
  const data = await res.json();
  return data.version;
}

function runCmd(cmd, args, { timeoutMs, env }) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch { /* already gone */ }
    }, timeoutMs);
    child.stdout.on('data', (d) => { output += d.toString(); });
    child.stderr.on('data', (d) => { output += d.toString(); });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ exitCode: -1, timedOut, output: output + String(err) });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? -1, timedOut, output });
    });
  });
}

async function main() {
  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'registry', 'plugins.json'), 'utf8'),
  );
  const metaFile = path.join(ROOT, 'registry', 'meta.json');
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const dshVersion =
    DSH_VERSION || meta.compatDshVersion || (await resolveLatestDshVersion());
  meta.compatDshVersion = dshVersion;
  fs.writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`);

  const targets = [...registry].sort((a, b) => b.stars - a.stars).slice(0, TOP_N);
  const homeDir = path.join(ROOT, '.compat-home');
  fs.mkdirSync(homeDir, { recursive: true });
  console.log(`compat: checking ${targets.length} plugins against dsh ${dshVersion}`);

  const results = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < targets.length) {
      const idx = cursor++;
      const e = targets[idx];
      const t0 = Date.now();
      const profile = `compat-${idx}`;
      const run = await runCmd(
        'dsh',
        ['plugin', '--profile', profile, 'add', `github:${e.repo}`],
        { timeoutMs: PER_TIMEOUT_MS, env: { DSH_HOME: homeDir, CI: 'true', NO_COLOR: '1' } },
      );
      const cls = classifyCompatRun(run);
      results.push({
        repo: e.repo,
        status: cls.status,
        reason: cls.reason || null,
        dshVersion,
        durationMs: Date.now() - t0,
        checkedAt: new Date().toISOString(),
      });
      process.stdout.write(
        `  ${e.repo}: ${cls.status}${cls.reason ? ` — ${cls.reason.slice(0, 80)}` : ''}\n`,
      );
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, Math.max(targets.length, 1)) }, worker),
  );

  const compatErrors = validateCompatResults(results);
  if (compatErrors.length > 0) {
    for (const err of compatErrors) console.error(`  ${err}`);
    throw new Error('compat: invalid results');
  }

  fs.writeFileSync(
    path.join(ROOT, 'registry', 'compatibility.json'),
    `${JSON.stringify(
      { checkedAt: new Date().toISOString(), dshVersion, results },
      null,
      2,
    )}\n`,
  );
  const counts = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  console.log(`compat: done ${JSON.stringify(counts)} (${results.length} plugins, dsh ${dshVersion})`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
