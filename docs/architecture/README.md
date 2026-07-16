# Architecture

This project ships **two delivery modes from one codebase**:

| Mode | Entry | Data freshness | Whose API quota | Repo coverage |
|---|---|---|---|---|
| **Web API** (Vercel) | `api/cards/*.ts` | CDN + Redis cached | Shared service tokens | Up to 1,000 repos (10 pages) |
| **GitHub Action** | `dist/index.js` → `src/app.ts` | Regenerated per run | The user's own token | Unbounded |

Both modes share the same core: `src/github-api/` (GraphQL fetchers), `src/cards/` (data → chart data), and `src/templates/` (d3 + jsdom SVG rendering).

```mermaid
flowchart TB
    subgraph consumers[Consumers]
        readme[GitHub README embeds via camo]
        demo[Landing page /demo]
        workflow[User's GitHub workflow]
    end

    subgraph vercel[Web API on Vercel]
        cdn[CDN edge cache]
        fn[Serverless functions api/cards/*]
    end

    subgraph action[GitHub Action]
        dist[dist/index.js ncc bundle]
        commit[Commit SVGs to user's repo]
    end

    subgraph shared[Shared core src/]
        cards[src/cards data assembly]
        templates[src/templates d3+jsdom SVG]
        ghapi[src/github-api GraphQL fetchers]
    end

    redis[(Upstash Redis data cache)]
    github[GitHub GraphQL API]

    readme --> cdn
    demo --> cdn
    cdn -->|miss| fn
    fn --> cards
    workflow --> dist
    dist --> cards
    dist --> commit
    cards --> templates
    cards --> ghapi
    ghapi -->|web only| redis
    redis -->|miss / stale| github
    ghapi -->|Action: direct| github
```

## Documents

- [web-api.md](web-api.md) — Vercel request flow, token rotation, error handling
- [github-action.md](github-action.md) — Action run flow and inputs
- [caching.md](caching.md) — the two cache layers and quota strategy
- [release-pipeline.md](release-pipeline.md) — branch model, CI, release and deploy
