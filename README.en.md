# 🐋 awesome-dsh-hub

![Last updated](https://img.shields.io/badge/last%20updated-2026--08--14-orange)

> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋

## Ecosystem Stats

| Metric | Value |
| --- | ---: |
| Plugins | **1468** |
| Monitored repos | 2442 |
| Total stars | 9,513 |
| Last updated | 2026-08-14 22:52:48.716 UTC |

### Categories

Web UI 186 · Agent Capabilities 590 · Coding & Engineering 129 · Messaging & Notifications 56 · Vision & Multimodal 137 · Browser & Web 77 · Skins & Fun 46 · Files & Data 189 · Dev Tools & Tutorials 28 · Bundles & Distros 16 · Ecosystem Projects 14

### Top 10 Plugins

| # | Plugin | Stars | Type | Description |
| --- | --- | ---: | --- | --- |
| 1 | [liustack/modlens](https://github.com/liustack/modlens) | 1,286 | Vision & Multimodal | The first vision plugin for DeepSeek Harness, and the visio… |
| 2 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 891 | Coding & Engineering | 解决DSH 官方尚无终端 TUI 痛点的补位之作，献给偏爱cli的各位极客：Claude Code 风格全屏交互终端插… |
| 3 | [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 767 | Web UI | 一个侧边栏的完整工作台，支持三方拓展注册新侧边栏页面。内置文件渲染编辑/终端/Git/子代理 |
| 4 | [sandbaseai/sandbase-harness](https://github.com/sandbaseai/sandbase-harness) | 574 | Agent Capabilities | Open-source CMA-compatible agent runtime for any model, wit… |
| 5 | [mnemon-dev/mnemon](https://github.com/mnemon-dev/mnemon) | 435 | Files & Data | LLM-supervised persistent memory for AI agents — graph-base… |
| 6 | [Nagi-ovo/dsh-ads](https://github.com/Nagi-ovo/dsh-ads) | 335 | Skins & Fun | 把 DSH 变成 2005 年门户网站｜Parody ads, fake games, and popups for … |
| 7 | [Anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | 329 | Vision & Multimodal | 让纯文本模型更好地做视觉任务的DeepSeek Harness插件：带意图的图片问答、长截图 OCR、UI 还原等｜D… |
| 8 | [NanmiCoder/dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | 246 | Agent Capabilities | AgentTeams plugin for DeepSeek Harness |
| 9 | [hust-open-atom-club/oh-dsh](https://github.com/hust-open-atom-club/oh-dsh) | 166 | Coding & Engineering | 一站式 DeepSeek Harness 社区发行版：TUI、桌面端与 Web UI 三种形态统一体验，支持分层安装、… |
| 10 | [huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | 133 | Coding & Engineering | dsh-tianshu-tui — DeepSeek Harness terminal UI +harness wor… |

## Quick Start

```sh
npx @deepseek-ai/dsh web
```

Install any listed plugin, e.g.:

```sh
npx @deepseek-ai/dsh plugin --profile web add github:owner/repo
```

## Data & Artifacts

- [`registry/plugins.json`](./registry/plugins.json) — machine-readable registry (JSON API)
- [`registry/meta.json`](./registry/meta.json) — fetch metadata
- [`docs/catalog.zh.md`](./docs/catalog.zh.md) · [`docs/catalog.en.md`](./docs/catalog.en.md) — categorized catalogs
- [`site/`](./site/) — searchable static site (GitHub Pages)

## Admission Rules

Listing is automatic — no application needed:

1. Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic
2. Declare `dsh.bundle.patch` in the root `package.json`

The registry refreshes every hour; compliant repos appear after the next run.

> [!CAUTION]
> Listing does not imply compatibility or security. Review source, license and permissions before installing.

## Contributing

- Fix categories, descriptions or exclude mirrors via `data/overrides.json` PRs
- See [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## License

MIT © awesome-dsh-hub contributors
