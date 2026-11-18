# 🐋 awesome-dsh-hub

![GitHub stars](https://img.shields.io/github/stars/ukinch605/awesome-dsh-hub)
![License](https://img.shields.io/github/license/ukinch605/awesome-dsh-hub)
![Plugins](https://img.shields.io/badge/plugins-26806-4dabf7)
![Last updated](https://img.shields.io/badge/last%20updated-2026--11--18-orange)

> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋
>
> Participating in LINUX DO open-source promotion: fully open source, no closed parts, open to community supervision.

## Ecosystem Stats

| Metric | Value |
| --- | ---: |
| Plugins | **26806** |
| Monitored repos | 32247 |
| Total stars | 428,910 |
| Last updated | 2026-11-18 01:23:10.857 UTC |

### Categories

Web UI 4219 · Agent Capabilities 10412 · Coding & Engineering 1973 · Messaging & Notifications 1161 · Vision & Multimodal 1877 · Browser & Web 1341 · Skins & Fun 719 · Files & Data 3582 · Dev Tools & Tutorials 604 · Bundles & Distros 672 · Ecosystem Projects 246

### Top 10 Plugins

| # | Plugin | Stars | Type | Description |
| --- | --- | ---: | --- | --- |
| 1 | [Ebony-Vinyl/dsh-our-free-model](https://github.com/Ebony-Vinyl/dsh-our-free-model) | 78,579 | Agent Capabilities | 在 dsh 里装上这个插件即可，无需登录、注册或填 API Key，就能使用包括 DeepSeek V4.1 Flas… |
| 2 | [alchaincyf/nuwa-skill](https://github.com/alchaincyf/nuwa-skill) | 38,508 | Coding & Engineering | 你想蒸馏的下一个员工，何必是同事。蒸馏任何人的思维方式——心智模型、决策启发式、表达DNA。Distill how a… |
| 3 | [alchaincyf/huashu-design](https://github.com/alchaincyf/huashu-design) | 29,735 | Browser & Web | Huashu Design 3.0 · 在 agent 里打一句话，拿回能交付的设计：网页 / App 原型 / 可编… |
| 4 | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 12,768 | Agent Capabilities | The plugin market inside DeepSeek Harness — browse, search,… |
| 5 | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web) | 10,489 | Dev Tools & Tutorials | DeepSeek Harness (DSH) Web 插件聚合生态 · 万物皆插件，通过创意工坊分发｜｜DeepSee… |
| 6 | [kingcharleslzy-ai/dsh-purge](https://github.com/kingcharleslzy-ai/dsh-purge) | 9,768 | Agent Capabilities | dsh-purge Community · DeepSeek Harness 社区维护版：宿主兼容、状态诊断、提示词管… |
| 7 | [superdesigndev/treg](https://github.com/superdesigndev/treg) | 8,304 | Messaging & Notifications | OpenRouter for agent tools. Join community here: https://di… |
| 8 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 7,866 | Coding & Engineering | DSH's officially top-recommended TUI plugin — high performa… |
| 9 | [elysia395/dsh-wallpaper-engine](https://github.com/elysia395/dsh-wallpaper-engine) | 7,349 | Browser & Web | 把本机 Wallpaper Engine 的壁纸搬进 DSH 网页界面：场景壁纸由内置 MIT 开源引擎 WebWal… |
| 10 | [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | 7,301 | Web UI | DeepSeek Harness（DSH）一只住在 DSH 界面右下角的小鲸鱼娘，帮你盯着DeepSeek账户余额。Q… |

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
