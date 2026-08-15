# 🐋 awesome-dsh-hub

![GitHub stars](https://img.shields.io/github/stars/ukinch605/awesome-dsh-hub)
![License](https://img.shields.io/github/license/ukinch605/awesome-dsh-hub)
![Plugins](https://img.shields.io/badge/plugins-1974-4dabf7)
![Last updated](https://img.shields.io/badge/last%20updated-2026--08--15-orange)

> 自动维护的 DeepSeek Harness（`dsh`）插件精品目录：机器可读 Registry、中英双语目录与可检索站点。Everything is a Plugin. 🐋
> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋
>
> 本仓库已参与 LINUX DO 开源推广：完整开源、无未开源部分、接受社区监督。

## 生态统计 / Ecosystem Stats

| 指标 / Metric | 数值 / Value |
| --- | ---: |
| 收录插件 / Plugins | **1974** |
| 监测仓库 / Monitored repos | 3203 |
| 累计 Star / Total stars | 14,993 |
| 最近更新 / Last updated | 2026-08-15 10:49:23.194 UTC |

### 分类构成 / Categories

Web UI 增强 270 · Agent 能力 778 · 编码开发 174 · 消息通讯 75 · 视觉与多模态 184 · 浏览器与网络 101 · 皮肤与娱乐 61 · 文件与数据 248 · 开发工具与教程 45 · 合集与发行版 21 · 生态项目 17

### Top 10 插件 / Top Plugins

| # | 插件 / Plugin | Stars | 类型 / Type | 说明 / Description |
| --- | --- | ---: | --- | --- |
| 1 | [liustack/modlens](https://github.com/liustack/modlens) | 1,603 | 视觉与多模态 | The first vision plugin for DeepSeek Harness, and the visio… |
| 2 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 1,085 | 编码开发 | 解决DSH 官方尚无终端 TUI 痛点的补位之作，献给偏爱cli的各位极客：Claude Code 风格全屏交互终端插… |
| 3 | [GanyuanRan/Aegis](https://github.com/GanyuanRan/Aegis) | 1,015 | 编码开发 | Make AI coding agents architecture-aware: baseline-first, e… |
| 4 | [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 960 | Web UI 增强 | 一个侧边栏的完整工作台，支持三方拓展注册新侧边栏页面。内置文件渲染编辑/终端/Git/子代理 |
| 5 | [sandbaseai/sandbase-harness](https://github.com/sandbaseai/sandbase-harness) | 583 | Agent 能力 | Open-source CMA-compatible agent runtime for any model, wit… |
| 6 | [adoresever/graph-memory](https://github.com/adoresever/graph-memory) | 515 | 文件与数据 | Openclaw记忆插件Knowledge Graph + Memory；Knowledge Graph Contex… |
| 7 | [mnemon-dev/mnemon](https://github.com/mnemon-dev/mnemon) | 444 | 文件与数据 | LLM-supervised persistent memory for AI agents — graph-base… |
| 8 | [superdesigndev/treg](https://github.com/superdesigndev/treg) | 412 | 消息通讯 | OpenRouter for agent tools. Join community here: https://di… |
| 9 | [superdesigndev/superdesign-skill](https://github.com/superdesigndev/superdesign-skill) | 411 | 编码开发 | The design skill for Claude Code, Cursor and any coding age… |
| 10 | [Anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | 398 | 视觉与多模态 | 让纯文本模型更好地做视觉任务的DeepSeek Harness插件：带意图的图片问答、长截图 OCR、UI 还原等｜D… |

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

## 收录徽章 / Listing Badge

插件作者可把下面的徽章贴到自己的 README，为你的插件增加曝光：
Plugin authors can embed this badge in their README to gain exposure:

[![Listed on awesome-dsh-hub](https://img.shields.io/badge/Listed%20on-awesome_dsh_hub-4dabf7)](https://github.com/ukinch605/awesome-dsh-hub)

    [![Listed on awesome-dsh-hub](https://img.shields.io/badge/Listed%20on-awesome_dsh_hub-4dabf7)](https://github.com/ukinch605/awesome-dsh-hub)

## License

MIT © awesome-dsh-hub contributors
