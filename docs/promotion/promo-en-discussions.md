# GitHub Discussions Post (draft)

> Update the numbers before posting.

## Title

awesome-dsh-hub: an auto-updating directory of every DeepSeek Harness plugin (+ daily compatibility matrix)

## Body

Hi everyone! I built [awesome-dsh-hub](https://github.com/ukinch605/awesome-dsh-hub) — an auto-maintained, machine-readable directory of the DeepSeek Harness plugin ecosystem.

What it does:

- Scans the whole `dsh-plugin` topic (2,600+ repos) using star-range segments to bypass GitHub's 1,000-result search cap
- Admits any repo that declares `dsh.bundle.patch` in its root `package.json` — currently 1,600+ plugins
- Refreshes every hour, so new plugins show up automatically
- Exposes a stable JSON registry (`registry/plugins.json`) for tools and agents
- Ships a searchable bilingual site with install commands
- Runs a daily compatibility matrix that actually installs the top 100 plugins against a pinned dsh version in CI, producing `verified` / `failed` badges
- Publishes a weekly digest (new plugins, star gainers, category changes)

Site: https://ukinch605.github.io/awesome-dsh-hub/

Plugin authors: add the `dsh-plugin` topic + declare `dsh.bundle.patch`, get listed within the hour, and embed our listing badge in your README.

Feedback and contributions welcome!
