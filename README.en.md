# 🐋 awesome-dsh-hub

![GitHub stars](https://img.shields.io/github/stars/ukinch605/awesome-dsh-hub)
![License](https://img.shields.io/github/license/ukinch605/awesome-dsh-hub)
![Plugins](https://img.shields.io/badge/plugins-23448-4dabf7)
![Last updated](https://img.shields.io/badge/last%20updated-2026--11--09-orange)

> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋
>
> Participating in LINUX DO open-source promotion: fully open source, no closed parts, open to community supervision.

## Ecosystem Stats

| Metric | Value |
| --- | ---: |
| Plugins | **23448** |
| Monitored repos | 28609 |
| Total stars | 379,053 |
| Last updated | 2026-11-09 00:10:39.042 UTC |

### Categories

Web UI 3622 · Agent Capabilities 9203 · Coding & Engineering 1745 · Messaging & Notifications 982 · Vision & Multimodal 1645 · Browser & Web 1190 · Skins & Fun 628 · Files & Data 3088 · Dev Tools & Tutorials 536 · Bundles & Distros 597 · Ecosystem Projects 212

### Top 10 Plugins

| # | Plugin | Stars | Type | Description |
| --- | --- | ---: | --- | --- |
| 1 | [Ebony-Vinyl/dsh-our-free-model](https://github.com/Ebony-Vinyl/dsh-our-free-model) | 66,157 | Agent Capabilities | 在 dsh 里装上这个插件即可，无需登录、注册或填 API Key，就能使用包括 DeepSeek V4.1 Flas… |
| 2 | [alchaincyf/nuwa-skill](https://github.com/alchaincyf/nuwa-skill) | 37,813 | Coding & Engineering | 你想蒸馏的下一个员工，何必是同事。蒸馏任何人的思维方式——心智模型、决策启发式、表达DNA。Distill how a… |
| 3 | [alchaincyf/huashu-design](https://github.com/alchaincyf/huashu-design) | 28,980 | Browser & Web | Huashu Design 3.0 · 在 agent 里打一句话，拿回能交付的设计：网页 / App 原型 / 可编… |
| 4 | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 11,496 | Agent Capabilities | The plugin market inside DeepSeek Harness — browse, search,… |
| 5 | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web) | 10,237 | Dev Tools & Tutorials | DeepSeek Harness (DSH) Web 插件聚合生态 · 万物皆插件，通过创意工坊分发｜｜DeepSee… |
| 6 | [superdesigndev/treg](https://github.com/superdesigndev/treg) | 7,654 | Messaging & Notifications | OpenRouter for agent tools. Join community here: https://di… |
| 7 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 7,234 | Coding & Engineering | DSH's officially top-recommended TUI plugin — high performa… |
| 8 | [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | 7,040 | Web UI | DeepSeek Harness（DSH）一只住在 DSH 界面右下角的小鲸鱼娘，帮你盯着DeepSeek账户余额。Q… |
| 9 | [yjh051108/dsh-routing-suite](https://github.com/yjh051108/dsh-routing-suite) | 7,011 | Agent Capabilities | dsh-routing-suite — injector + router-standard kit: install… |
| 10 | [QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html) | 6,058 | Coding & Engineering | Answer me with HTML — an agent skill that answers hard ques… |

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
