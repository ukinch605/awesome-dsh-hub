# 🐋 dsh-hub

![Last updated]({{UPDATED_BADGE}})

> 汇聚 DeepSeek Harness（`dsh`）生态插件，构建自动维护、机器可读的聚合目录。Everything is a Plugin. 🐋
> A community-maintained, machine-readable directory of the DeepSeek Harness (`dsh`) plugin ecosystem. Everything is a Plugin. 🐋

## 生态统计 / Ecosystem Stats

| 指标 / Metric | 数值 / Value |
| --- | ---: |
| 收录插件 / Plugins | **{{TOTAL}}** |
| 监测仓库 / Monitored repos | {{MONITORED}} |
| 累计 Star / Total stars | {{SUM_STARS}} |
| 最近更新 / Last updated | {{LAST_UPDATED}} |

### 分类构成 / Categories

{{CATEGORY_COUNTS}}

### Top 10 插件 / Top Plugins

| # | 插件 / Plugin | Stars | 类型 / Type | 说明 / Description |
| --- | --- | ---: | --- | --- |
{{TOP10_TABLE}}

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

Registry 每 8 小时自动刷新；符合规则的项目将在下一次运行后自动出现。
The registry refreshes every 8 hours; compliant repos appear after the next run.

> [!CAUTION]
> 收录不代表兼容性或安全认证。安装第三方插件前，请自行核验源码、许可证与权限范围。
> Listing does not imply compatibility or security. Review source, license and permissions before installing.

## 参与贡献 / Contributing

- 修正分类、描述或排除镜像仓库：编辑 [`data/overrides.json`](./data/overrides.json) 并提交 PR
- Fix categories, descriptions or exclude mirrors via `data/overrides.json` PRs
- 详见 / See [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## 致谢 / Credits

- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — dsh 本体 / the harness itself
- [like-study1/Oh-My-DSH](https://github.com/like-study1/Oh-My-DSH) · [wangshunnn/oh-my-dsh](https://github.com/wangshunnn/oh-my-dsh) — 生态目录参考 / ecosystem catalogs (reference)

## License

MIT © dsh-hub contributors
