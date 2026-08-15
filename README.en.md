# 🐋 awesome-dsh-hub

![GitHub stars](https://img.shields.io/github/stars/ukinch605/awesome-dsh-hub)
![License](https://img.shields.io/github/license/ukinch605/awesome-dsh-hub)
![Plugins](https://img.shields.io/badge/plugins-2017-4dabf7)
![Last updated](https://img.shields.io/badge/last%20updated-2026--08--15-orange)

> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋
>
> Participating in LINUX DO open-source promotion: fully open source, no closed parts, open to community supervision.

## Ecosystem Stats

| Metric | Value |
| --- | ---: |
| Plugins | **2017** |
| Monitored repos | 3262 |
| Total stars | 15,234 |
| Last updated | 2026-08-15 11:39:40.429 UTC |

### Categories

Web UI 281 · Agent Capabilities 801 · Coding & Engineering 175 · Messaging & Notifications 75 · Vision & Multimodal 188 · Browser & Web 101 · Skins & Fun 62 · Files & Data 247 · Dev Tools & Tutorials 47 · Bundles & Distros 23 · Ecosystem Projects 17

### Top 10 Plugins

| # | Plugin | Stars | Type | Description |
| --- | --- | ---: | --- | --- |
| 1 | [liustack/modlens](https://github.com/liustack/modlens) | 1,636 | Vision & Multimodal | The first vision plugin for DeepSeek Harness, and the visio… |
| 2 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 1,107 | Coding & Engineering | 解决DSH 官方尚无终端 TUI 痛点的补位之作，献给偏爱cli的各位极客：Claude Code 风格全屏交互终端插… |
| 3 | [GanyuanRan/Aegis](https://github.com/GanyuanRan/Aegis) | 1,016 | Coding & Engineering | Make AI coding agents architecture-aware: baseline-first, e… |
| 4 | [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 974 | Web UI | 一个侧边栏的完整工作台，支持三方拓展注册新侧边栏页面。内置文件渲染编辑/终端/Git/子代理 |
| 5 | [sandbaseai/sandbase-harness](https://github.com/sandbaseai/sandbase-harness) | 584 | Agent Capabilities | Open-source CMA-compatible agent runtime for any model, wit… |
| 6 | [adoresever/graph-memory](https://github.com/adoresever/graph-memory) | 516 | Files & Data | Openclaw记忆插件Knowledge Graph + Memory；Knowledge Graph Contex… |
| 7 | [mnemon-dev/mnemon](https://github.com/mnemon-dev/mnemon) | 445 | Files & Data | LLM-supervised persistent memory for AI agents — graph-base… |
| 8 | [superdesigndev/treg](https://github.com/superdesigndev/treg) | 413 | Messaging & Notifications | OpenRouter for agent tools. Join community here: https://di… |
| 9 | [superdesigndev/superdesign-skill](https://github.com/superdesigndev/superdesign-skill) | 412 | Coding & Engineering | The design skill for Claude Code, Cursor and any coding age… |
| 10 | [Anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | 400 | Vision & Multimodal | 让纯文本模型更好地做视觉任务的DeepSeek Harness插件：带意图的图片问答、长截图 OCR、UI 还原等｜D… |

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

## Listing Badge

Plugin authors can embed this badge in their README to gain exposure:

[![Listed on awesome-dsh-hub](https://img.shields.io/badge/Listed%20on-awesome_dsh_hub-4dabf7)](https://github.com/ukinch605/awesome-dsh-hub)

    [![Listed on awesome-dsh-hub](https://img.shields.io/badge/Listed%20on-awesome_dsh_hub-4dabf7)](https://github.com/ukinch605/awesome-dsh-hub)

## License

MIT © awesome-dsh-hub contributors
