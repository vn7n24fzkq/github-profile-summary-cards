# GitHub Action

Consumed as `vn7n24fzkq/github-profile-summary-cards@<tag>`. The tag points at
the `release` branch state, which carries the ncc-bundled `dist/index.js`
(built by the release workflow — `dist/` does not live on `main`). Runs on the
`node24` Actions runtime.

## Run flow

```mermaid
flowchart TB
    trigger["User workflow: cron / push / dispatch"] --> inputs["Inputs: USERNAME, UTC_OFFSET, EXCLUDE, EXCLUDE_REPOS, THEME, ANIMATION, DURATION, NAME, AUTO_PUSH, BRANCH_NAME"]
    inputs --> app["dist/index.js → src/app.ts action"]
    app --> owner{getOwnerType}
    owner -->|User| ucards["generateUserCards: profile-details, repos-per-language, most-commit-language, stats, productive-time"]
    owner -->|Organization| ocards["generateOrganizationCards: org variants"]
    ucards --> render["Render every theme, or the pinned THEME"]
    ocards --> render
    render --> files["Write SVGs to profile-summary-card-output/"]
    files --> push{AUTO_PUSH?}
    push -->|yes| commit["Commit & push to BRANCH_NAME, 3 retries"]
    push -->|no| done[Leave files in workspace]
```

## Differences from the Web API

| | GitHub Action | Web API |
|---|---|---|
| Token | User's own `GITHUB_TOKEN` secret | Shared service tokens |
| Repo pagination | Unbounded (every repo) | Bounded at 10 pages / 1,000 repos |
| Commit counts | All contribution years | All contribution years (per-year cached; past years are immutable so cache ~90d) |
| Redis cache | Not configured → `withDataCache` fails open, always fetches | 6h fresh / 7d stale; per-instance circuit breaker skips a dead Redis; **never changes data semantics** — it only buffers GitHub quota |
| Output | SVG files committed to the user's repo | SVG over HTTP |

The Action needs `permissions: contents: write` to push the generated cards.
