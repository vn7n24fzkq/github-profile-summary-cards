# Ratelimiting Algorithms

This documentation explains the three algorithms supported by the ratelimit‑ts SDK: Fixed Window, Sliding Window, and Token Bucket. It focuses on practical usage, pitfalls, and choosing the right algorithm.

## Fixed Window

Divides time into fixed periods (for example, 10‑second windows). Requests increment a counter for the current window and are rejected once the limit is exceeded.

**Pitfalls**
- Burst leakage: many requests at the boundary may bypass intended behavior.
- Stampedes: large client populations may all retry at the start of a window.
- Reset time is based on fixed boundaries, not on the first request.

**When to use**
- When performance and low computational cost are important.
- When small inaccuracies at boundaries are acceptable.

**Example**
```ts
// 10 requests per 10 seconds
const regional = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(10, "10 s"),
});

const multi = new MultiRegionRatelimit({
  redis: [new Redis({/* auth */}), new Redis({/* auth */})],
  limiter: MultiRegionRatelimit.fixedWindow(10, "10 s"),
});
```

## Sliding Window

Uses rolling time windows to smooth boundary behavior. Counts requests in the previous window proportionally based on elapsed time.

**Pitfalls**
- Slightly more expensive to compute and approximate.
- Assumes uniform distribution of past requests.
- In multi‑region mode, generates many Redis commands and can slow down operations.
- Reset time exposed via `limit` and `getRemaining` is only the start of the next full window.

**When to use**
- When smoother behavior around window boundaries is important.
- Avoid in multi‑region setups if command count is a concern.

**Example**
```ts
// 10 requests per 10 seconds
const regional = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

// Multi-region is possible but inefficient
const multi = new MultiRegionRatelimit({
  redis: [new Redis({/* auth */}), new Redis({/* auth */})],
  limiter: MultiRegionRatelimit.slidingWindow(10, "10 s"),
});
```

## Token Bucket

Maintains a bucket of tokens that refill at a defined rate. Each request consumes one token; if none remain, requests are rejected.

**Advantages**
- Smooths bursts naturally.
- Allows high initial burst capacity (`maxTokens > refillRate`).

**Pitfalls**
- Higher computational cost.
- Not yet supported for multi‑region.

**When to use**
- When smoothing request traffic and allowing controlled bursts is important.

**Example**
```ts
// Bucket with max 10 tokens, refilling 5 tokens every 10s
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.tokenBucket(5, "10 s", 10),
  analytics: true,
});
```