# 🐋 dsh-hub

![Last updated](https://img.shields.io/badge/last%20updated-2026--08--14-orange)

> 汇聚 DeepSeek Harness（`dsh`）生态插件，构建自动维护、机器可读的聚合目录。Everything is a Plugin. 🐋
> A community-maintained, machine-readable directory of the DeepSeek Harness (`dsh`) plugin ecosystem. Everything is a Plugin. 🐋

## 生态统计 / Ecosystem Stats

| 指标 / Metric | 数值 / Value |
| --- | ---: |
| 收录插件 / Plugins | **891** |
| 监测仓库 / Monitored repos | 1500 |
| 累计 Star / Total stars | 7,821 |
| 最近更新 / Last updated | 2026-08-14 13:46:39.652 UTC |

### 分类构成 / Categories

Web UI 增强 122 · Agent 能力 355 · 编码开发 72 · 消息通讯 36 · 视觉与多模态 82 · 浏览器与网络 39 · 皮肤与娱乐 35 · 文件与数据 115 · 开发工具与教程 19 · 合集与发行版 7 · 生态项目 9

### Top 10 插件 / Top Plugins

| # | 插件 / Plugin | Stars | 类型 / Type | 说明 / Description |
| --- | --- | ---: | --- | --- |
| 1 | [liustack/modlens](https://github.com/liustack/modlens) | 1,148 | 视觉与多模态 | The first vision plugin for DeepSeek Harness, and the visio… |
| 2 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 792 | 编码开发 | 解决DSH 官方尚无终端 TUI 痛点的补位之作，献给偏爱cli的各位极客：Claude Code 风格全屏交互终端插… |
| 3 | [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 682 | Web UI 增强 | 一个侧边栏的完整工作台，支持三方拓展注册新Tab页面，内置文件渲染编辑/终端/Git/子代理 |
| 4 | [sandbaseai/sandbase-harness](https://github.com/sandbaseai/sandbase-harness) | 573 | Agent 能力 | Open-source CMA-compatible agent runtime for any model, wit… |
| 5 | [mnemon-dev/mnemon](https://github.com/mnemon-dev/mnemon) | 430 | 文件与数据 | LLM-supervised persistent memory for AI agents — graph-base… |
| 6 | [Nagi-ovo/dsh-ads](https://github.com/Nagi-ovo/dsh-ads) | 306 | 皮肤与娱乐 | 是兄弟就来蹬我！DSH Web UI 广告：2005 年中文站点风格的侧栏广告 / 对话内信息流 / 角落弹窗 + 一… |
| 7 | [Anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | 301 | 视觉与多模态 | 让纯文本模型更好地做视觉任务的DeepSeek Harness插件：带意图的图片问答、长截图 OCR、UI 还原等｜D… |
| 8 | [NanmiCoder/dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | 222 | Agent 能力 | AgentTeams plugin for DeepSeek Harness |
| 9 | [hust-open-atom-club/oh-dsh](https://github.com/hust-open-atom-club/oh-dsh) | 158 | 编码开发 | 一站式 DeepSeek Harness 社区发行版：TUI、桌面端与 Web UI 三种形态统一体验，支持分层安装、… |
| 10 | [huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | 125 | 编码开发 | dsh-tianshu-tui — DeepSeek Harness terminal UI +harness wor… |

## 快速使用 / Quick Start

```sh
npx @deepseek-ai/dsh web
```

安装目录中的任一插件（如 / Install any listed plugin, e.g.）：

```sh
npx @deepseek-ai/dsh plugin --profile web add github:owner/repo
```

## 数据与产物 / Data & Artifacts

- [`registry/plugins.json`](./registry/plugins.json) — 机器可读 Registry（JSON API）/ machine-readable registry
- [`registry/meta.json`](./registry/meta.json) — 抓取元信息 / fetch metadata
- [`docs/catalog.zh.md`](./docs/catalog.zh.md) · [`docs/catalog.en.md`](./docs/catalog.en.md) — 分类目录 / categorized catalogs
- [`site/`](./site/) — GitHub Pages 检索站点 / searchable static site

## 收录规则 / Admission Rules

收录自动完成，无需人工申请 / Listing is automatic, no application needed：

1. 仓库添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 话题 / add the topic
2. 根目录 `package.json` 声明 `dsh.bundle.patch` / declare `dsh.bundle.patch` in the root `package.json`

Registry 每小时自动刷新；符合规则的项目将在下一次运行后自动出现。
The registry refreshes every hour; compliant repos appear after the next run.

> [!CAUTION]
> 收录不代表兼容性或安全认证。安装第三方插件前，请自行核验源码、许可证与权限范围。
> Listing does not imply compatibility or security. Review source, license and permissions before installing.

## 参与贡献 / Contributing

- 修正分类、描述或排除镜像仓库：编辑 [`data/overrides.json`](./data/overrides.json) 并提交 PR
- Fix categories, descriptions or exclude mirrors via `data/overrides.json` PRs
- 详见 / See [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## 致谢 / Credits

- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — dsh 本体 / the harness itself
- [like-study1/Oh-My-DSH](https://github.com/like-study1/Oh-My-DSH) · [wangshunnn/oh-my-dsh](https://github.com/wangshunnn/oh-my-dsh) — 生态目录参考 / ecosystem catalogs (reference)

## License

MIT © dsh-hub contributors
