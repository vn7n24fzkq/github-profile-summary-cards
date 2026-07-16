# Features

This Skill documents the core features of the Upstash Rate Limiter for TypeScript. It highlights how to apply caching, timeouts, analytics, multiple limit strategies, dynamic limits, and multi-region setups.

## Caching

Caching prevents unnecessary Redis calls when identifiers are already blocked.

Key points:
- Use an in-memory `Map<string, number>` as `ephemeralCache`.
- Default: a new `Map()` is created automatically.
- Disable by setting `ephemeralCache: false`.
- Works only when the cache or rate limiter is created outside serverless handlers.
- Responses blocked by cache return `reason: cacheBlock`.

Example:
```ts
const cache = new Map();
const ratelimit = new Ratelimit({
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  ephemeralCache: cache,
});
```

## Timeout

A timeout allows requests to proceed if Redis is slow or unreachable.
- Default timeout: 5 seconds
- On timeout success, `reason` reflects this

Example:
```ts
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  timeout: 1000,
});
```

## Analytics & Dashboard

Analytics collect counts of success/blocked requests.
- Disabled by default; enable via `analytics: true`
- Data is viewable in the Upstash Rate Limit Dashboard
- In edge runtimes, ensure analytics requests complete using `pending` from `limit()`

Example:
```ts
const { pending } = await ratelimit.limit("id");
context.waitUntil(pending);
```

## Using Multiple Limits

Different user tiers can use different limiters.

Example:
```ts
const ratelimit = {
  free: new Ratelimit({ prefix: "free", limiter: Ratelimit.slidingWindow(10, "10s") }),
  paid: new Ratelimit({ prefix: "paid", limiter: Ratelimit.slidingWindow(60, "10s") }),
};

await ratelimit.free.limit(ip);
await ratelimit.paid.limit(userId);
```

## Custom Rates

Specify how many tokens to subtract per request using `rate`.

Example:
```ts
await ratelimit.limit("identifier", { rate: batchSize });
```

## Multi Region

Multi-region rate limiting provides lower latency and state replication via CRDTs.
- Uses multiple Redis instances
- Trades strict accuracy for global performance

Example:
```ts
const ratelimit = new MultiRegionRatelimit({
  redis: [redisUS, redisEU],
  limiter: MultiRegionRatelimit.slidingWindow(10, "10 s"),
});

const { pending } = await ratelimit.limit("id");
context.waitUntil(pending);
```

## Dynamic Limits

Update rate limits at runtime without recreating the limiter.
- Works only for single-region limiters (fixedWindow, slidingWindow, tokenBucket)

Example:
```ts
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10s"),
  dynamicLimits: true,
});

await ratelimit.setDynamicLimit({ limit: 5 });
const current = await ratelimit.getDynamicLimit();
await ratelimit.setDynamicLimit({ limit: false });
```

## Common Pitfalls

- Forgetting to place the cache outside serverless handlers disables effective caching.
- Not calling `context.waitUntil(pending)` in edge runtimes may cause lost analytics/sync requests.
- Multi-region setups cannot guarantee strict limit enforcement.
- Dynamic limits do not work with multi-region limiters.
