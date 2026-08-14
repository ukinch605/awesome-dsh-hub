// Keyword rules in priority order. The first matched category becomes the
// primary one; a second distinct match becomes the secondary category.
const RULES = [
  {
    id: 'vision',
    keywords: [
      'vision', '视觉', '多模态', 'multimodal', 'vlm', 'ocr', 'image',
      '图片', '识图', 'screenshot', '截图', 'visual',
    ],
  },
  {
    id: 'messaging',
    keywords: [
      'feishu', '飞书', 'wechat', '微信', 'dingtalk', '钉钉', 'telegram',
      'slack', 'discord', 'bot', '机器人', 'rss', 'news', '新闻', 'notify',
      '通知', 'channel', '群', 'briefing', '简报',
    ],
  },
  {
    id: 'browser',
    keywords: [
      'browser', '浏览器', 'playwright', 'chrome', '网页', 'web search',
      '搜索', 'scraping', '爬虫', 'web novel', '网文',
    ],
  },
  {
    id: 'data',
    keywords: [
      'file', '文件', 'office', 'docx', 'pdf', 'csv', 'excel', 'database',
      '数据库', 'sql', 'storage', '存储', 'note', '笔记', 'zotero', '文献',
      'knowledge', '知识库', 'rag', 'memory', '记忆', 'attachment', '附件',
      'spreadsheet', '表格', 'markdown', 'kb', 'sieve',
    ],
  },
  {
    id: 'coding',
    keywords: [
      'git', 'gitflow', 'git diff', 'vscode', 'lsp', 'diff', 'pr',
      'commit', '提交', 'tui', 'terminal', 'shell', 'cli', 'debug', '调试',
      'coding', '编码', '测试', 'build', '构建', 'branch', '分支',
    ],
  },
  {
    id: 'devtools',
    keywords: [
      'tutorial', '教程', 'handbook', '手册', 'template', '模板', 'sdk',
      'workshop', '文档', 'registry', 'catalog', '目录', 'awesome',
      '清单', 'plugin dev', 'plugin development', '插件开发', 'guide', '指南',
      'starter', '脚手架',
    ],
  },
  {
    id: 'web-ui',
    keywords: [
      'web ui', 'webui', 'ui', 'sidebar', '侧边栏', 'panel', '面板',
      'theme', '主题', 'widget', '徽章', 'badge', 'hud', 'dashboard',
      '仪表', 'composer', '输入框', '皮肤中心', '换肤', 'timeline', '时间轴',
    ],
  },
  {
    id: 'fun',
    keywords: [
      'skin', '皮肤', 'pet', '宠物', 'whale', '鲸鱼', 'game', '游戏',
      'gomoku', 'meme', '表情', 'fun', '娱乐', 'sticker', '贴纸', '壁纸',
      'wallpaper', 'ads',
    ],
  },
  {
    id: 'agent',
    keywords: [
      'agent', '智能体', 'skill', '技能', 'workflow', 'deep research',
      'research', '研究', 'planner', 'plan', 'subagent', '子代理', 'mcp',
      'orchestration', '编排', 'tool', '工具', 'loop', 'trajectory',
      '轨迹', 'memory-evolve', 'engram',
    ],
  },
  {
    id: 'bundle',
    keywords: [
      'bundle', '合集', 'distribution', '发行版', 'desktop', '桌面',
      'electron', '整合', 'release', '发行', 'distro', 'pack', '组合包',
    ],
  },
  {
    id: 'ecosystem',
    keywords: [
      'ecosystem', '生态', 'community', '社区', 'hub', 'platform', '平台',
      'runtime', 'cli 客户端',
    ],
  },
];

const SHORT_KEYWORDS = new Set([
  'ui', 'pdf', 'sql', 'pr', 'rag', 'ocr', 'lsp', 'mcp', 'bot', 'git',
  'doc', 'api', 'sdk', 'tui', 'cli', 'rss', 'kb', 'kb', 'csv', 'tts',
]);

function matches(haystack, keyword) {
  if (keyword.length < 4 && SHORT_KEYWORDS.has(keyword)) {
    return new RegExp(`(^|[^a-z0-9])${keyword}([^a-z0-9]|$)`).test(haystack);
  }
  return haystack.includes(keyword);
}

export function classify(repo) {
  const haystack =
    `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`
      .toLowerCase();
  const matched = [];
  for (const rule of RULES) {
    if (matched.includes(rule.id)) continue;
    if (rule.keywords.some((kw) => matches(haystack, kw))) {
      matched.push(rule.id);
      if (matched.length >= 2) break;
    }
  }
  return matched.length > 0 ? matched : ['agent'];
}
