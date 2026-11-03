# 🐋 awesome-dsh-hub

![GitHub stars](https://img.shields.io/github/stars/ukinch605/awesome-dsh-hub)
![License](https://img.shields.io/github/license/ukinch605/awesome-dsh-hub)
![Plugins](https://img.shields.io/badge/plugins-21573-4dabf7)
![Last updated](https://img.shields.io/badge/last%20updated-2026--11--03-orange)

> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋
>
> Participating in LINUX DO open-source promotion: fully open source, no closed parts, open to community supervision.

## Ecosystem Stats

| Metric | Value |
| --- | ---: |
| Plugins | **21573** |
| Monitored repos | 25411 |
| Total stars | 335,125 |
| Last updated | 2026-11-03 18:06:29.203 UTC |

### Categories

Web UI 3277 · Agent Capabilities 8590 · Coding & Engineering 1610 · Messaging & Notifications 890 · Vision & Multimodal 1511 · Browser & Web 1115 · Skins & Fun 584 · Files & Data 2774 · Dev Tools & Tutorials 490 · Bundles & Distros 528 · Ecosystem Projects 204

### Top 10 Plugins

| # | Plugin | Stars | Type | Description |
| --- | --- | ---: | --- | --- |
| 1 | [Ebony-Vinyl/dsh-our-free-model](https://github.com/Ebony-Vinyl/dsh-our-free-model) | 58,866 | Agent Capabilities | 在 dsh 里装上这个插件即可，无需登录、注册或填 API Key，就能使用包括 DeepSeek V4.1 Flas… |
| 2 | [alchaincyf/nuwa-skill](https://github.com/alchaincyf/nuwa-skill) | 37,352 | Agent Capabilities | 你想蒸馏的下一个员工，何必是同事。蒸馏任何人的思维方式——心智模型、决策启发式、表达DNA。Distill how a… |
| 3 | [HunYiSage/dsh-purge](https://github.com/HunYiSage/dsh-purge) | 17,003 | Agent Capabilities | DeepSeek Harness 破甲：让所有模型都能破甲，不同模型可换不同提示词；默认提示词面向国模「小码酱」。Ja… |
| 4 | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 10,505 | Agent Capabilities | The plugin market inside DeepSeek Harness — browse, search,… |
| 5 | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web) | 10,017 | Dev Tools & Tutorials | DeepSeek Harness (DSH) Web 插件聚合生态 · 万物皆插件，通过创意工坊分发｜｜DeepSee… |
| 6 | [superdesigndev/treg](https://github.com/superdesigndev/treg) | 7,096 | Messaging & Notifications | OpenRouter for agent tools. Join community here: https://di… |
| 7 | [yjh051108/dsh-routing-suite](https://github.com/yjh051108/dsh-routing-suite) | 7,001 | Agent Capabilities | dsh-routing-suite — injector + router-standard kit: install… |
| 8 | [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | 6,818 | Web UI | DeepSeek Harness（DSH）一只住在 DSH 界面右下角的小鲸鱼娘，帮你盯着DeepSeek账户余额。Q… |
| 9 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 6,713 | Coding & Engineering | DSH's officially top-recommended TUI plugin — high performa… |
| 10 | [QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html) | 5,196 | Coding & Engineering | Answer me with HTML — an agent skill that answers hard ques… |

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
