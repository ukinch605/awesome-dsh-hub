# LINUX DO 开源推广帖（草稿）

> 发帖前把标题与正文里的数字更新为最新统计，并在标题/正文补上你的 GitHub 链接与"开源推广"标签。

## 标题建议

我扒完了 2600+ 个 DeepSeek Harness 插件，做了一个每小时自动更新的全量目录

## 正文

大家好，给大家安利一个刚建好的开源项目：**awesome-dsh-hub**。

DeepSeek Harness（dsh）是 DeepSeek 开源的 Agent 框架，核心理念"一切皆插件"。最近插件生态爆发式增长，但找插件全靠翻 GitHub topic，非常费劲。所以我做了一个自动维护的全量插件目录：

- **全量覆盖**：监测 2600+ 个 `dsh-plugin` 话题仓库，收录 1600+ 个真实声明 `dsh.bundle.patch` 的插件（不靠人工筛选，避免遗漏）
- **每小时自动刷新**：新插件发布后最多 1 小时自动收录，无需人工申请
- **机器可读**：`registry/plugins.json` 提供标准 JSON API，工具和 Agent 可以直接消费
- **中英双语**：README、目录、站点全部双语文档
- **可检索站点**：支持关键词搜索、分类/许可证/活跃度/兼容性筛选，一键复制安装命令
- **兼容性实测矩阵**：每天在 GitHub Actions 里用固定版本 dsh 对 Top 100 插件做真实安装冒烟，输出 verified/failed 徽章
- **每周趋势周报**：自动生成新增插件、Star 飙升榜、分类变化

地址：https://github.com/ukinch605/awesome-dsh-hub
站点：https://ukinch605.github.io/awesome-dsh-hub/

**插件作者看过来**：你的仓库加上 `dsh-plugin` 话题、在 `package.json` 声明 `dsh.bundle.patch`，1 小时内自动收录，还可以把"Listed on awesome-dsh-hub"徽章贴到自己 README 增加曝光。

这个目录还处在早期，欢迎提 Issue / PR 一起完善（分类修正、描述改进、兼容矩阵、场景包都在路线图上）。

---

本帖为开源项目推广，已完整开源、无未开源部分，接受社区监督。
