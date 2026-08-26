// Opens a GitHub issue when a pipeline workflow fails, and closes it once a
// later run succeeds. Called from GitHub Actions only; a no-op without the
// Actions token/context. Dependency-free: talks to api.github.com via fetch.
//
// Usage: node scripts/notify-failure.js open | close
const MARKER = '[dsh-hub]';

const repo = process.env.GITHUB_REPOSITORY || '';
const token = process.env.GITHUB_TOKEN || '';
const runId = process.env.GITHUB_RUN_ID || '';
const runNumber = process.env.GITHUB_RUN_NUMBER || '';
const workflow = process.env.GITHUB_WORKFLOW || 'pipeline';
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';

async function gh(url, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.github.com${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`github api ${method} ${url}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function openAlerts() {
  const issues = await gh(`/repos/${repo}/issues?state=open&per_page=100`);
  return issues.filter((i) => (i.title || '').includes(MARKER));
}

function alertBody() {
  return [
    `**${workflow}** run #${runNumber} failed — the registry could not refresh.`,
    '',
    `- Run: ${serverUrl}/${repo}/actions/runs/${runId}`,
    `- Time: ${new Date().toISOString()}`,
    '',
    'Pipeline: update → generate → check → commit. A check failure means nothing is committed, so the registry stays on the last good snapshot.',
    '',
    'Usual cause: a plugin repo was renamed or disappeared, leaving a stale cross-file reference (compatibility.json / data/overrides.json). The refresh pipeline now prunes such entries automatically; if this alert reappears, inspect the run log for the exact validation errors.',
    '',
    'This issue is closed automatically once a later run succeeds.',
  ].join('\n');
}

async function openAlert() {
  const existing = await openAlerts();
  if (existing.length > 0) {
    // Keep a single live issue; refresh its body with the latest run.
    await gh(`/repos/${repo}/issues/${existing[0].number}`, {
      method: 'PATCH',
      body: { body: alertBody() },
    });
  } else {
    await gh(`/repos/${repo}/issues`, {
      method: 'POST',
      body: {
        title: `${MARKER} ${workflow} failing — registry refresh stalled`,
        body: alertBody(),
      },
    });
  }
}

async function closeAlerts() {
  const existing = await openAlerts();
  for (const issue of existing) {
    await gh(`/repos/${repo}/issues/${issue.number}/comments`, {
      method: 'POST',
      body: { body: `✅ ${workflow} run #${runNumber} succeeded — closing automatically.` },
    });
    await gh(`/repos/${repo}/issues/${issue.number}`, {
      method: 'PATCH',
      body: { state: 'closed' },
    });
  }
}

const action = process.argv[2];
if (!repo || !token || !runId) {
  console.log('notify-failure: not running inside GitHub Actions, skipping');
  process.exit(0);
}
try {
  if (action === 'open') await openAlert();
  else if (action === 'close') await closeAlerts();
  else throw new Error(`unknown action: ${action}`);
  console.log(`notify-failure: ${action} done`);
} catch (err) {
  console.error(`notify-failure: ${err.message}`);
  process.exit(1);
}
