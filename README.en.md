# 🐋 awesome-dsh-hub

![GitHub stars](https://img.shields.io/github/stars/ukinch605/awesome-dsh-hub)
![License](https://img.shields.io/github/license/ukinch605/awesome-dsh-hub)
![Plugins](https://img.shields.io/badge/plugins-17817-4dabf7)
![Last updated](https://img.shields.io/badge/last%20updated-2026--10--23-orange)

> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋
>
> Participating in LINUX DO open-source promotion: fully open source, no closed parts, open to community supervision.

## Ecosystem Stats

| Metric | Value |
| --- | ---: |
| Plugins | **17817** |
| Monitored repos | 21282 |
| Total stars | 220,419 |
| Last updated | 2026-10-23 23:40:56.095 UTC |

### Categories

Web UI 2594 · Agent Capabilities 7359 · Coding & Engineering 1372 · Messaging & Notifications 687 · Vision & Multimodal 1250 · Browser & Web 930 · Skins & Fun 452 · Files & Data 2177 · Dev Tools & Tutorials 419 · Bundles & Distros 408 · Ecosystem Projects 169

### Top 10 Plugins

| # | Plugin | Stars | Type | Description |
| --- | --- | ---: | --- | --- |
| 1 | [Ebony-Vinyl/dsh-our-free-model](https://github.com/Ebony-Vinyl/dsh-our-free-model) | 39,087 | Agent Capabilities | 在 dsh 里装上这个插件即可，无需登录、注册或填 API Key，就能使用包括 DeepSeek V4.1 Flas… |
| 2 | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web) | 9,385 | Dev Tools & Tutorials | DeepSeek Harness (DSH) Web 插件聚合生态 · 万物皆插件，通过创意工坊分发｜｜DeepSee… |
| 3 | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 8,472 | Agent Capabilities | The plugin market inside DeepSeek Harness — browse, search,… |
| 4 | [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) | 7,174 | Agent Capabilities | DeepSeek Harness 破甲：让所有模型都能破甲，不同模型可换不同提示词；默认提示词面向国模「小码酱」。Ja… |
| 5 | [yjh051108/dsh-routing-suite](https://github.com/yjh051108/dsh-routing-suite) | 6,995 | Agent Capabilities | dsh-routing-suite — injector + router-standard kit: install… |
| 6 | [superdesigndev/treg](https://github.com/superdesigndev/treg) | 6,013 | Messaging & Notifications | OpenRouter for agent tools. Join community here: https://di… |
| 7 | [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | 5,889 | Web UI | DeepSeek Harness（DSH）一只住在 DSH 界面右下角的小鲸鱼娘，帮你盯着DeepSeek账户余额。Q… |
| 8 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 5,489 | Coding & Engineering | DSH's officially top-recommended TUI plugin — high performa… |
| 9 | [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 4,480 | Web UI | 开放的侧边栏底座，支持三方拓展注册新侧边栏页面。内置文件渲染编辑/终端/侧边对话/Git/子代理页面 ｜ Open s… |
| 10 | [liustack/modlens](https://github.com/liustack/modlens) | 4,430 | Vision & Multimodal | The first vision plugin for DeepSeek Harness, and the visio… |

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
