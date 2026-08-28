# 🐋 awesome-dsh-hub

![GitHub stars](https://img.shields.io/github/stars/ukinch605/awesome-dsh-hub)
![License](https://img.shields.io/github/license/ukinch605/awesome-dsh-hub)
![Plugins](https://img.shields.io/badge/plugins-4408-4dabf7)
![Last updated](https://img.shields.io/badge/last%20updated-2026--08--28-orange)

> 自动维护的 DeepSeek Harness（`dsh`）插件精品目录：机器可读 Registry、中英双语目录与可检索站点。Everything is a Plugin. 🐋
> An auto-maintained, awesome-style directory of the DeepSeek Harness (`dsh`) plugin ecosystem: machine-readable registry, bilingual catalogs and a searchable site. Everything is a Plugin. 🐋
>
> 本仓库已参与 LINUX DO 开源推广：完整开源、无未开源部分、接受社区监督。

## 生态统计 / Ecosystem Stats

| 指标 / Metric | 数值 / Value |
| --- | ---: |
| 收录插件 / Plugins | **4408** |
| 监测仓库 / Monitored repos | 6011 |
| 累计 Star / Total stars | 58,584 |
| 最近更新 / Last updated | 2026-08-28 07:10:52.830 UTC |

### 分类构成 / Categories

Web UI 增强 621 · Agent 能力 1797 · 编码开发 360 · 消息通讯 184 · 视觉与多模态 337 · 浏览器与网络 236 · 皮肤与娱乐 132 · 文件与数据 527 · 开发工具与教程 106 · 合集与发行版 63 · 生态项目 45

### Top 10 插件 / Top Plugins

| # | 插件 / Plugin | Stars | 类型 / Type | 说明 / Description |
| --- | --- | ---: | --- | --- |
| 1 | [liustack/modlens](https://github.com/liustack/modlens) | 3,732 | 视觉与多模态 | The first vision plugin for DeepSeek Harness, and the visio… |
| 2 | [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 3,040 | Web UI 增强 | 开放的侧边栏底座，支持三方拓展注册新侧边栏页面。内置文件渲染编辑/终端/侧边对话/Git/子代理页面 ｜ Open s… |
| 3 | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 2,644 | 消息通讯 | DSH 官方公众号收录的 TUI 补位插件：Claude Code 风，鲸鱼顶栏/实时状态/流式思考/双击 Esc 回… |
| 4 | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 2,637 | Agent 能力 | The plugin market inside DeepSeek Harness — browse, search,… |
| 5 | [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | 1,201 | Web UI 增强 | DeepSeek Harness（DSH）一只住在 DSH 界面右下角的小鲸鱼娘，帮你盯着DeepSeek账户余额。Q… |
| 6 | [GanyuanRan/Aegis](https://github.com/GanyuanRan/Aegis) | 1,137 | 编码开发 | Make AI coding agents architecture-aware: baseline-first, e… |
| 7 | [NanmiCoder/dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | 1,135 | Agent 能力 | AgentTeams plugin for DeepSeek Harness |
| 8 | [bowenliang123/dsh-context](https://github.com/bowenliang123/dsh-context) | 1,126 | 浏览器与网络 | The best DeepSeek Harness plugin for context insight and ma… |
| 9 | [ysr666/dsh-vision-router](https://github.com/ysr666/dsh-vision-router) | 1,009 | 视觉与多模态 | Eyes for text-only DeepSeek Harness agents: built-in free v… |
| 10 | [xmanrui/dsh-im](https://github.com/xmanrui/dsh-im) | 924 | 消息通讯 | 通过扫码或机器人凭据把IM机器人接入DeepSeek Harness（支持飞书、微信、钉钉、企业微信、QQ、Slack… |

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
