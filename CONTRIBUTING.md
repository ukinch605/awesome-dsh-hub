# Contributing / 参与贡献

## 收录（自动） / Being listed (automatic)

只要你的仓库满足以下两条，下一次自动刷新（每小时）后就会出现在目录中：

1. 添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 话题；
2. 根目录 `package.json` 声明 `dsh.bundle.patch`。

收录不代表兼容性或安全认证。

## 人工策展（PR） / Manual curation (via PR)

修改 [`data/overrides.json`](./data/overrides.json) 并提交 Pull Request：

- `exclude`：排除镜像仓库、废弃重复项目（使用 `owner/repo` 形式）；
- `categories`：修正自动分类，合法值见下方列表；
- `descriptions`：覆盖 GitHub 简介（用于目录展示）。

合法分类 / Valid categories：`web-ui`、`agent`、`coding`、`messaging`、`vision`、`browser`、`fun`、`data`、`devtools`、`bundle`、`ecosystem`。

提交前请本地验证：

```sh
npm install
npm test
npm run check
```

## 收录后如何宣传 / Promote your listing

你的插件被收录后，可以把下面的徽章贴到自己的 README，为你的插件增加曝光，同时也让更多用户发现本目录：

    [![Listed on awesome-dsh-hub](https://img.shields.io/badge/Listed%20on-awesome_dsh_hub-4dabf7)](https://github.com/ukinch605/awesome-dsh-hub)

如需中英文推广文案模板（LINUX DO 帖、掘金文章、Reddit/HN 帖、GitHub Discussions），见 [`docs/promotion/`](./docs/promotion/)。

## 其他改动 / Other changes

- 脚本与站点：`scripts/`、`site/`，需附带测试；
- 安全相关：见 [`SECURITY.md`](./SECURITY.md)。
