export const INSTALL_PREFIX =
  'npx @deepseek-ai/dsh plugin --profile web add github:';

export const CATEGORIES = [
  { id: 'web-ui', zh: 'Web UI 增强', en: 'Web UI' },
  { id: 'agent', zh: 'Agent 能力', en: 'Agent Capabilities' },
  { id: 'coding', zh: '编码开发', en: 'Coding & Engineering' },
  { id: 'messaging', zh: '消息通讯', en: 'Messaging & Notifications' },
  { id: 'vision', zh: '视觉与多模态', en: 'Vision & Multimodal' },
  { id: 'browser', zh: '浏览器与网络', en: 'Browser & Web' },
  { id: 'fun', zh: '皮肤与娱乐', en: 'Skins & Fun' },
  { id: 'data', zh: '文件与数据', en: 'Files & Data' },
  { id: 'devtools', zh: '开发工具与教程', en: 'Dev Tools & Tutorials' },
  { id: 'bundle', zh: '合集与发行版', en: 'Bundles & Distros' },
  { id: 'ecosystem', zh: '生态项目', en: 'Ecosystem Projects' },
];

export const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

export function categoryLabel(id, lang) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c[lang] : id;
}

export const ACTIVITY_LEVELS = [
  { id: 'active', zh: '活跃', en: 'Active', maxDays: 30 },
  { id: 'watching', zh: '关注', en: 'Watching', maxDays: 90 },
  { id: 'slowing', zh: '放缓', en: 'Slowing', maxDays: 365 },
  { id: 'stale', zh: '停更', en: 'Stale', maxDays: Infinity },
];

export const ACTIVITY_IDS = new Set(ACTIVITY_LEVELS.map((a) => a.id));

// GitHub's search API caps a single query at 1000 results, so the topic is
// split into disjoint star-range segments; each segment stays under the cap
// and together they cover the whole topic.
export const STAR_SEGMENTS = [
  'stars:>=1000',
  'stars:500..999',
  'stars:100..499',
  'stars:10..99',
  'stars:7..9',
  'stars:4..6',
  'stars:3',
  'stars:2',
  'stars:1',
  'stars:0',
];

// Zero-star repositories are deterministically split by creation year. This
// avoids relying on a single query that is already beyond Search's 1000-result
// window while keeping the request count bounded.
export function buildSearchQueries(currentYear = new Date().getUTCFullYear()) {
  const nonzero = STAR_SEGMENTS.filter((segment) => segment !== 'stars:0')
    .map((segment) => `topic:dsh-plugin ${segment}`);
  const zeroStar = [];
  for (let year = 2008; year <= currentYear; year++) {
    zeroStar.push(`topic:dsh-plugin stars:0 created:${year}-01-01..${year}-12-31`);
  }
  return [...nonzero, ...zeroStar];
}

export const SEARCH_QUERIES = buildSearchQueries();
export const SEARCH_SORTS = SEARCH_QUERIES.map(() => 'stars');

export const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
