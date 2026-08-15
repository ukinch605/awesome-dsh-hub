# Reddit / Hacker News Post (draft)

> Update the numbers before posting.

## Suggested title

I scraped every DeepSeek Harness plugin (2,600+ repos) and built an auto-updating directory with a compatibility matrix

## Body

DeepSeek Harness (`dsh`) — DeepSeek's open-source agent framework where "everything is a plugin" — exploded in the last week (100k+ GitHub stars). The plugin ecosystem is growing so fast that discovery became a real problem: the official `dsh-plugin` topic already has 2,600+ repos and no one can keep a curated list fresh.

So I built [awesome-dsh-hub](https://github.com/ukinch605/awesome-dsh-hub):

- **Full coverage, not curated-by-hand**: we scan the whole topic in star-range segments (working around GitHub's 1,000-result search cap) and admit every repo that genuinely declares `dsh.bundle.patch` in its root `package.json` — currently 1,600+ plugins from 2,600+ repos
- **Refreshes every hour**: new plugins appear automatically within an hour, no application needed
- **Machine-readable**: `registry/plugins.json` is a stable JSON API for tools and agents
- **Bilingual + searchable site**: keyword search, filters by category/license/activity/compatibility, one-click install command copy
- **Compatibility matrix (daily)**: we actually install the top 100 plugins against a pinned dsh version in CI and emit `verified` / `failed` badges — no other directory does real verification yet
- **Weekly digest**: auto-generated summary of new plugins, star gainers, and category shifts

Live site: https://ukinch605.github.io/awesome-dsh-hub/

Plugin authors: add the `dsh-plugin` topic and declare `dsh.bundle.patch` — you're listed within the hour, and you can grab a "Listed on awesome-dsh-hub" badge for your README.

This is early-stage and iterating fast. Issues and PRs welcome (better categorization, compat matrix expansion, scenario packs are all on the roadmap).
