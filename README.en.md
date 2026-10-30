# 🐋 awesome-dsh-hub

![GitHub stars](https://img.shields.io/github/stars/ukinch605/awesome-dsh-hub)
![License](https://img.shields.io/github/license/ukinch605/awesome-dsh-hub)
![Plugins](https://img.shields.io/badge/plugins-20056-4dabf7)
![Last updated](https://img.shields.io/badge/last%20updated-2026--10--30-orange)

> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋
>
> Participating in LINUX DO open-source promotion: fully open source, no closed parts, open to community supervision.

## Ecosystem Stats

| Metric | Value |
| --- | ---: |
| Plugins | **20056** |
| Monitored repos | 23769 |
| Total stars | 268,296 |
| Last updated | 2026-10-30 14:37:32.302 UTC |

### Categories

Web UI 3024 · Agent Capabilities 8056 · Coding & Engineering 1503 · Messaging & Notifications 817 · Vision & Multimodal 1409 · Browser & Web 1032 · Skins & Fun 536 · Files & Data 2545 · Dev Tools & Tutorials 457 · Bundles & Distros 485 · Ecosystem Projects 192

### Top 10 Plugins

| # | Plugin | Stars | Type | Description |
| --- | --- | ---: | --- | --- |
| 1 | [Ebony-Vinyl/dsh-our-free-model](https://github.com/Ebony-Vinyl/dsh-our-free-model) | 52,342 | Agent Capabilities | 在 dsh 里装上这个插件即可，无需登录、注册或填 API Key，就能使用包括 DeepSeek V4.1 Flas… |
| 2 | [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) | 13,687 | Agent Capabilities | DeepSeek Harness 破甲：让所有模型都能破甲，不同模型可换不同提示词；默认提示词面向国模「小码酱」。Ja… |
| 3 | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web) | 9,846 | Dev Tools & Tutorials | DeepSeek Harness (DSH) Web 插件聚合生态 · 万物皆插件，通过创意工坊分发｜｜DeepSee… |
| 4 | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 9,813 | Agent Capabilities | The plugin market inside DeepSeek Harness — browse, search,… |
| 5 | [yjh051108/dsh-routing-suite](https://github.com/yjh051108/dsh-routing-suite) | 7,000 | Agent Capabilities | dsh-routing-suite — injector + router-standard kit: install… |
| 6 | [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | 6,575 | Web UI | DeepSeek Harness（DSH）一只住在 DSH 界面右下角的小鲸鱼娘，帮你盯着DeepSeek账户余额。Q… |
| 7 | [superdesigndev/treg](https://github.com/superdesigndev/treg) | 6,547 | Messaging & Notifications | OpenRouter for agent tools. Join community here: https://di… |
| 8 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 6,297 | Coding & Engineering | DSH's officially top-recommended TUI plugin — high performa… |
| 9 | [QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html) | 4,867 | Coding & Engineering | Answer me with HTML — an agent skill that answers hard ques… |
| 10 | [T-Auto/dsh-ops](https://github.com/T-Auto/dsh-ops) | 4,844 | Agent Capabilities | A toolkit for low-level operations in DSH, designed to redu… |

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
