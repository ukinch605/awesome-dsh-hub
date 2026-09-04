# 🐋 awesome-dsh-hub

![GitHub stars](https://img.shields.io/github/stars/ukinch605/awesome-dsh-hub)
![License](https://img.shields.io/github/license/ukinch605/awesome-dsh-hub)
![Plugins](https://img.shields.io/badge/plugins-10086-4dabf7)
![Last updated](https://img.shields.io/badge/last%20updated-2026--09--04-orange)

> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋
>
> Participating in LINUX DO open-source promotion: fully open source, no closed parts, open to community supervision.

## Ecosystem Stats

| Metric | Value |
| --- | ---: |
| Plugins | **10086** |
| Monitored repos | 13559 |
| Total stars | 87,435 |
| Last updated | 2026-09-04 18:35:48.483 UTC |

### Categories

Web UI 1242 · Agent Capabilities 4600 · Coding & Engineering 771 · Messaging & Notifications 365 · Vision & Multimodal 733 · Browser & Web 505 · Skins & Fun 251 · Files & Data 1137 · Dev Tools & Tutorials 234 · Bundles & Distros 152 · Ecosystem Projects 96

### Top 10 Plugins

| # | Plugin | Stars | Type | Description |
| --- | --- | ---: | --- | --- |
| 1 | [yjh051108/dsh-routing-suite](https://github.com/yjh051108/dsh-routing-suite) | 7,073 | Agent Capabilities | dsh-routing-suite — injector + router-standard kit: install… |
| 2 | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web) | 6,860 | Dev Tools & Tutorials | DeepSeek Harness (DSH) Web Plugin Aggregation Ecosystem · E… |
| 3 | [liustack/modlens](https://github.com/liustack/modlens) | 3,864 | Vision & Multimodal | The first vision plugin for DeepSeek Harness, and the visio… |
| 4 | [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 3,330 | Web UI | 开放的侧边栏底座，支持三方拓展注册新侧边栏页面。内置文件渲染编辑/终端/侧边对话/Git/子代理页面 ｜ Open s… |
| 5 | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 3,178 | Agent Capabilities | The plugin market inside DeepSeek Harness — browse, search,… |
| 6 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 2,833 | Messaging & Notifications | DSH 官方公众号收录的 TUI 补位插件：Claude Code 风，鲸鱼顶栏/实时状态/流式思考/双击 Esc 回… |
| 7 | [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | 1,723 | Web UI | DeepSeek Harness（DSH）一只住在 DSH 界面右下角的小鲸鱼娘，帮你盯着DeepSeek账户余额。Q… |
| 8 | [NanmiCoder/dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | 1,367 | Agent Capabilities | AgentTeams plugin for DeepSeek Harness |
| 9 | [bowenliang123/dsh-context](https://github.com/bowenliang123/dsh-context) | 1,281 | Browser & Web | The best DeepSeek Harness plugin for context insight and ma… |
| 10 | [superdesigndev/treg](https://github.com/superdesigndev/treg) | 1,182 | Messaging & Notifications | OpenRouter for agent tools. Join community here: https://di… |

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
