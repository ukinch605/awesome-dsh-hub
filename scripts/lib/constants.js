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

export const SEARCH_QUERIES = ['topic:dsh-plugin', 'topic:dsh-plugin'];
export const SEARCH_SORTS = ['stars', 'updated'];

export const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
