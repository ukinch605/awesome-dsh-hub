# 🐋 awesome-dsh-hub

![GitHub stars](https://img.shields.io/github/stars/ukinch605/awesome-dsh-hub)
![License](https://img.shields.io/github/license/ukinch605/awesome-dsh-hub)
![Plugins](https://img.shields.io/badge/plugins-4374-4dabf7)
![Last updated](https://img.shields.io/badge/last%20updated-2026--08--27-orange)

> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋
>
> Participating in LINUX DO open-source promotion: fully open source, no closed parts, open to community supervision.

## Ecosystem Stats

| Metric | Value |
| --- | ---: |
| Plugins | **4374** |
| Monitored repos | 5990 |
| Total stars | 57,997 |
| Last updated | 2026-08-27 23:15:42.862 UTC |

### Categories

Web UI 610 · Agent Capabilities 1787 · Coding & Engineering 352 · Messaging & Notifications 179 · Vision & Multimodal 343 · Browser & Web 232 · Skins & Fun 129 · Files & Data 528 · Dev Tools & Tutorials 107 · Bundles & Distros 64 · Ecosystem Projects 43

### Top 10 Plugins

| # | Plugin | Stars | Type | Description |
| --- | --- | ---: | --- | --- |
| 1 | [liustack/modlens](https://github.com/liustack/modlens) | 3,725 | Vision & Multimodal | The first vision plugin for DeepSeek Harness, and the visio… |
| 2 | [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 3,018 | Web UI | 开放的侧边栏底座，支持三方拓展注册新侧边栏页面。内置文件渲染编辑/终端/侧边对话/Git/子代理页面 ｜ Open s… |
| 3 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 2,630 | Messaging & Notifications | DSH 官方公众号收录的 TUI 补位插件：Claude Code 风，鲸鱼顶栏/实时状态/流式思考/双击 Esc 回… |
| 4 | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 2,612 | Agent Capabilities | The plugin market inside DeepSeek Harness — browse, search,… |
| 5 | [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | 1,174 | Web UI | DeepSeek Harness（DSH）一只住在 DSH 界面右下角的小鲸鱼娘，帮你盯着DeepSeek账户余额。Q… |
| 6 | [GanyuanRan/Aegis](https://github.com/GanyuanRan/Aegis) | 1,136 | Coding & Engineering | Make AI coding agents architecture-aware: baseline-first, e… |
| 7 | [NanmiCoder/dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | 1,123 | Agent Capabilities | AgentTeams plugin for DeepSeek Harness |
| 8 | [bowenliang123/dsh-context](https://github.com/bowenliang123/dsh-context) | 1,111 | Browser & Web | The best DeepSeek Harness plugin for context insight and ma… |
| 9 | [ysr666/dsh-vision-router](https://github.com/ysr666/dsh-vision-router) | 1,007 | Vision & Multimodal | Eyes for text-only DeepSeek Harness agents: built-in free v… |
| 10 | [xmanrui/dsh-im](https://github.com/xmanrui/dsh-im) | 912 | Messaging & Notifications | 通过扫码或机器人凭据把IM机器人接入DeepSeek Harness（支持飞书、微信、钉钉、企业微信、QQ、Slack… |

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
