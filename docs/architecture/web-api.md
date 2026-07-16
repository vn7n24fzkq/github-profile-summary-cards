# Web API (Vercel)

Serverless functions under `api/cards/*.ts`, one per card. Production runs the
`release` branch on Node.js 24 (`memory: 128`, `maxDuration: 10` in
`vercel.json`).

## Request flow

```mermaid
sequenceDiagram
    participant V as Viewer (camo / demo / direct)
    participant CDN as Vercel CDN
    participant F as api/cards/*.ts
    participant H as handleCard
    participant D as owner-dispatch
    participant C as withDataCache
    participant R as Upstash Redis
    participant G as GitHub GraphQL
    participant GA as GA4

    V->>CDN: GET /api/cards/stats?username=...&theme=...
    alt CDN hit (per deployment + full URL)
        CDN-->>V: cached SVG
    else miss
        CDN->>F: invoke function
        F->>H: validate username / theme / params
        H->>D: render via dispatch (user first, org fallback)
        D->>C: github-api module fetch
        alt Redis fresh (< 6h)
            C->>R: GET v1:{kind}:{username}
            R-->>C: raw JSON
        else miss / stale
            C->>G: GraphQL query (paginated, bounded to 10 pages)
            G-->>C: raw data
            C->>R: SET (7d retention)
        end
        C-->>D: raw data → filters → chart data
        D-->>H: SVG (d3 + jsdom template, theme + color overrides + animation)
        H-->>CDN: 200 image/svg+xml (max-age=14400, s-maxage=86400, SWR 7d)
        CDN-->>V: SVG
        H--)GA: waitUntil(sendAnalytics) after response
    end
```

## Failure handling

```mermaid
flowchart TB
    err[GitHub fetch fails] --> rot{401 / 403 / 429 / GraphQL RATE_LIMITED?}
    rot -->|yes| next[Rotate to next token GITHUB_TOKEN_1]
    next --> retry[Retry render]
    retry -->|still failing| stale
    rot -->|no| stale{Stale copy in Redis?}
    stale -->|yes| serve[Serve stale data, render normal card]
    stale -->|no| card[Generic error card, cached 300s]
```

Key points:

- **Tokens**: `GITHUB_TOKEN` (machine account, production primary) →
  `GITHUB_TOKEN_1` (owner PAT, fallback). Same-account tokens share one
  quota pool, so the two tokens belong to different accounts.
- **Error messages are sanitised** (`safeErrorMessage`) — raw GitHub errors can
  leak the backing account and never reach the card.
- **Analytics never block or fail a card**: fired with `waitUntil` after the
  response; a bare fire-and-forget promise would be frozen with the lambda.
