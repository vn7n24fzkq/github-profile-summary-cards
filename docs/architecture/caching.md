# Caching & quota strategy

Two layers sit between viewers and the GitHub API. They exist because the
hosted service runs on shared tokens: GitHub GraphQL allows **5,000 points per
hour per account** (all tokens of one account share the pool — which is why the
two service tokens belong to different accounts).

```mermaid
flowchart TB
    viewer[Viewer] --> l1

    subgraph l1[Layer 1 — Vercel CDN]
        direction TB
        l1note["Key: deployment + full URL<br/>fresh: s-maxage 24h<br/>stale-while-revalidate: 7d<br/>⚠ wiped on every deploy<br/>⚠ every theme/color combo is a separate key"]
    end

    subgraph l2[Layer 2 — Upstash Redis data cache]
        direction TB
        l2note["Key: v1:{kind}:{username}<br/>fresh: 6h (past years 30d, owner type 7d)<br/>stale kept: 7d → served on GitHub errors<br/>survives deployments<br/>all theme/color/exclude variations share one entry<br/>fail-open on any Redis error (1.5s timeout)"]
    end

    subgraph gh[GitHub GraphQL]
        direction TB
        ghnote["5,000 points/hr per account<br/>primary: machine account token<br/>fallback: owner PAT (rotation on 401/403/429)"]
    end

    l1 -->|miss| l2
    l2 -->|miss or stale| gh
```

## What each layer protects against

| Scenario | Before | Now |
|---|---|---|
| Same user, different theme/colors | Each combo hit GitHub | One Redis entry serves all combos |
| New deployment | CDN cold → quota stampede | Redis is deployment-independent |
| GitHub rate limited | Error card (cached 300s) | Stale data renders a normal card |
| Redis outage / quota exhausted | — | Fail-open: behaves exactly like the pre-cache system |

## Error-card caching

Error cards are cached for **300s** (`public, max-age=300, s-maxage=300`) — long
enough that repeat views don't burn quota during an incident, short enough to
recover promptly. Successful cards use
`public, max-age=14400, s-maxage=86400, stale-while-revalidate=604800`
(`src/const/cache.ts`).
