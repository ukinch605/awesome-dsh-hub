# Registry v2 data contract

Registry v2 describes **listing**, lifecycle, and install-probe observations as
separate facts. Listing does not imply compatibility, maintenance, quality, or
security.

## Plugin records

The first normal `Update Registry` run after this migration adds these fields to
each observed record without making extra per-repository GitHub metadata calls:

- `githubRepoId`: stable GitHub repository ID used across renames
- `repo`, `defaultBranch`, and `repoPushedAt`: repository observation
- `packageName`, `packageVersion`, and `lastManifestCheckedAt`: manifest observation
- `firstSeenAt` and `lastSeenAt`: lifecycle evidence; migrated v1 records keep
  `firstSeenAt: null` because their original first observation is unknown
- `discoverySource`: how the repository was discovered

Readers must accept the checked-in v1 record shape until that refresh occurs.
A transient manifest fetch failure preserves the prior record and its manifest
observation rather than treating the plugin as removed.

## Install probe

The install probe attempts installation for the top 100 listed plugins by stars.
It records the DSH version, check time, scope, duration, and failure reason. Its
states are `installed`, `blocked`, `failed`, `timeout`, and `not-tested`.
Environment or package-manager policy requirements (including pnpm
`allowBuilds`) are `blocked`; they are not claims of plugin incompatibility.

## Change ledger

`registry/events.json` is append-only machine-readable state for future
refreshes. Events use stable repository identity and cover additions, removals,
renames, package-version changes, activity changes, and install-probe changes.
Event IDs make append operations idempotent. The v1 migration is a baseline and
does not create artificial historical events; ordinary star changes are not
events.

## Discovery observations and removal confirmation

`registry/discovery-state.json` records the last evidence that each repository
was returned by GitHub Search and its consecutive miss count. One missed search
run preserves the prior verified registry record without advancing its manifest
timestamps. After two consecutive misses, only that removal candidate is
verified directly. A missing/archived repository, removed topic or default
branch, confirmed missing manifest, or manifest that no longer meets admission
can confirm removal; transient verification failures preserve the record.

Search coverage diagnostics in `registry/meta.json` report each segment's
result count, pages, unique repositories and 1000-result ceiling status. The
zero-star range is split deterministically by repository creation year rather
than treating the capped search window as complete. Any dated segment that is
still saturated is recursively bisected into disjoint date ranges, subject to
a bounded segment budget; unresolved one-day saturation remains explicitly
reported.

Removal events created before confirmation tracking retain their original event
body and ID, but receive top-level migration metadata
`confirmation: "unconfirmed-legacy-discovery"`; new removal event bodies state
that direct verification confirmed them.
