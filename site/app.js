const I18N = {
  zh: {
    heroTitle: 'DeepSeek Harness 插件目录',
    heroSub: '自动维护、机器可读的 dsh 插件聚合目录 · Everything is a Plugin',
    statPlugins: '收录插件',
    statStars: '累计 Star',
    statUpdated: '最近更新',
    searchPlaceholder: '搜索名称、说明、仓库…',
    results: '个结果',
    colPlugin: '插件',
    colStars: 'Stars',
    colCategory: '分类',
    colLicense: '许可证',
    colActivity: '活跃度',
    colInstall: '安装命令',
    empty: '没有匹配的插件',
    disclaimer: '收录不代表兼容性或安全认证；安装第三方插件前请自行核验源码、许可证与权限范围。',
    copy: '复制',
    copied: '已复制',
    categoryAll: '全部分类',
    licenseAll: '全部许可证',
    activityAll: '全部活跃度',
    activityLabel: { active: '活跃', watching: '关注', slowing: '放缓', stale: '停更' },
    categoryLabel: {
      'web-ui': 'Web UI 增强', agent: 'Agent 能力', coding: '编码开发',
      messaging: '消息通讯', vision: '视觉与多模态', browser: '浏览器与网络',
      fun: '皮肤与娱乐', data: '文件与数据', devtools: '开发工具与教程',
      bundle: '合集与发行版', ecosystem: '生态项目',
    },
  },
  en: {
    heroTitle: 'DeepSeek Harness Plugin Directory',
    heroSub: 'Auto-maintained, machine-readable dsh plugin directory · Everything is a Plugin',
    statPlugins: 'Plugins',
    statStars: 'Total stars',
    statUpdated: 'Last updated',
    searchPlaceholder: 'Search name, description, repo…',
    results: ' results',
    colPlugin: 'Plugin',
    colStars: 'Stars',
    colCategory: 'Category',
    colLicense: 'License',
    colActivity: 'Activity',
    colInstall: 'Install',
    empty: 'No matching plugins',
    disclaimer: 'Listing does not imply compatibility or security. Review source, license and permissions before installing.',
    copy: 'Copy',
    copied: 'Copied',
    categoryAll: 'All categories',
    licenseAll: 'All licenses',
    activityAll: 'All activity',
    activityLabel: { active: 'Active', watching: 'Watching', slowing: 'Slowing', stale: 'Stale' },
    categoryLabel: {
      'web-ui': 'Web UI', agent: 'Agent Capabilities', coding: 'Coding & Engineering',
      messaging: 'Messaging & Notifications', vision: 'Vision & Multimodal',
      browser: 'Browser & Web', fun: 'Skins & Fun', data: 'Files & Data',
      devtools: 'Dev Tools & Tutorials', bundle: 'Bundles & Distros',
      ecosystem: 'Ecosystem Projects',
    },
  },
};

let lang = localStorage.getItem('dsh-hub-lang') || 'zh';
let plugins = [];
let state = { q: '', category: '', license: '', activity: '' };

const $ = (id) => document.getElementById(id);

function applyI18n() {
  const t = I18N[lang];
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t[el.dataset.i18n];
  }
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
    el.placeholder = t[el.dataset.i18nPlaceholder];
  }
  $('lang-zh').classList.toggle('active', lang === 'zh');
  $('lang-en').classList.toggle('active', lang === 'en');
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fillSelect(el, options, allLabel) {
  el.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>` +
    options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
}

function render() {
  const t = I18N[lang];
  const q = state.q.trim().toLowerCase();
  const rows = plugins.filter((p) => {
    if (state.category && !p.categories.includes(state.category)) return false;
    if (state.license && p.license !== state.license) return false;
    if (state.activity && p.activity !== state.activity) return false;
    if (!q) return true;
    return `${p.name} ${p.repo} ${p.description}`.toLowerCase().includes(q);
  });
  $('result-count').textContent = rows.length;
  $('empty').hidden = rows.length > 0;
  $('rows').innerHTML = rows
    .map((p) => {
      const cats = p.categories.map((c) => t.categoryLabel[c] || c).join(' / ');
      const act = t.activityLabel[p.activity] || p.activity;
      return `<tr>
        <td>
          <div class="plugin-name"><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.repo)}</a></div>
          <div class="plugin-desc">${escapeHtml((p.description || '').slice(0, 140))}</div>
        </td>
        <td class="num-col">${p.stars.toLocaleString()}</td>
        <td><span class="badge">${escapeHtml(cats)}</span></td>
        <td>${escapeHtml(p.license)}</td>
        <td><span class="badge ${escapeHtml(p.activity)}">${escapeHtml(act)}</span></td>
        <td>
          <div class="install">
            <code title="${escapeHtml(p.installCommand)}">github:${escapeHtml(p.repo)}</code>
            <button class="copy" data-cmd="${escapeHtml(p.installCommand)}">${t.copy}</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

function copyCommand(cmd, btn) {
  const done = () => {
    btn.textContent = I18N[lang].copied;
    btn.classList.add('done');
    setTimeout(() => { btn.textContent = I18N[lang].copy; btn.classList.remove('done'); }, 1200);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(cmd).then(done).catch(() => fallbackCopy(cmd, done));
  } else {
    fallbackCopy(cmd, done);
  }
}

function fallbackCopy(cmd, done) {
  const ta = document.createElement('textarea');
  ta.value = cmd;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* ignore */ }
  document.body.removeChild(ta);
  done();
}

async function init() {
  const res = await fetch('plugins.json');
  plugins = await res.json();
  const t = I18N[lang];
  $('stat-plugins').textContent = plugins.length.toLocaleString();
  $('stat-stars').textContent = plugins.reduce((a, p) => a + p.stars, 0).toLocaleString();
  $('stat-updated').textContent = plugins[0]?.updatedAt?.slice(0, 10) || '—';

  fillSelect($('filter-category'), [...new Set(plugins.flatMap((p) => p.categories))].map((c) => t.categoryLabel[c] || c), t.categoryAll);
  fillSelect($('filter-license'), [...new Set(plugins.map((p) => p.license))].sort(), t.licenseAll);
  fillSelect($('filter-activity'), [...new Set(plugins.map((p) => p.activity))].map((a) => t.activityLabel[a] || a), t.activityAll);

  $('search').addEventListener('input', (e) => { state.q = e.target.value; render(); });
  $('filter-category').addEventListener('change', (e) => {
    const label = e.target.value;
    const t2 = I18N[lang];
    state.category = Object.keys(t2.categoryLabel).find((k) => t2.categoryLabel[k] === label) || '';
    render();
  });
  $('filter-license').addEventListener('change', (e) => { state.license = e.target.value; render(); });
  $('filter-activity').addEventListener('change', (e) => {
    const label = e.target.value;
    const t2 = I18N[lang];
    state.activity = Object.keys(t2.activityLabel).find((k) => t2.activityLabel[k] === label) || '';
    render();
  });
  $('rows').addEventListener('click', (e) => {
    const btn = e.target.closest('.copy');
    if (btn) copyCommand(btn.dataset.cmd, btn);
  });
  $('lang-zh').addEventListener('click', () => { lang = 'zh'; localStorage.setItem('dsh-hub-lang', 'zh'); applyI18n(); render(); });
  $('lang-en').addEventListener('click', () => { lang = 'en'; localStorage.setItem('dsh-hub-lang', 'en'); applyI18n(); render(); });

  applyI18n();
  render();
}

init().catch((err) => {
  console.error(err);
  $('rows').innerHTML = `<tr><td colspan="6">Failed to load plugins.json</td></tr>`;
});
