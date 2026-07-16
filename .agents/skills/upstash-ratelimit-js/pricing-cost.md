# Pricing & Cost Considerations for Ratelimit Operations

This document explains how Redis command costs vary across Ratelimit algorithms, cache states, and optional features. Use it to reason about latency, throughput, and pricing impacts when designing systems with Upstash Ratelimit.

---

## Overview

Redis command usage depends on:
- Algorithm type (Fixed Window, Sliding Window, Token Bucket)
- Algorithm state for a given identifier (first request, intermediate, rate‑limited)
- Cache hit/miss in the runtime environment
- Optional features (deny lists, analytics, dynamic limits, multi‑region replication)

A Global Upstash Redis setup multiplies write commands by `(1 + readRegionCount)` and adds 1 extra command when analytics is enabled.

---

## Algorithm States

Each identifier (e.g., an IP or user ID) has an associated state:
- **First**: No existing key; creates state and sets expiry
- **Intermediate**: Key exists; normal operation
- **Rate‑Limited**: Request blocked; may avoid Redis if cache contains an unexpired block timestamp

Cache hits allow skipping Redis entirely for rate‑limited requests.

---

## Cache Behavior

- **Hit**: Identifier found in in‑memory cache → request may be denied without Redis calls.
- **Miss**: Cache empty or value does not indicate a block → algorithm consults Redis.

Only rate‑limited results populate the cache.

---

## Command Costs by Operation

### `limit()`
Costs depend on algorithm, cache state, and identifier state.

**Fixed Window:**
- First: 3 commands (EVAL, INCR, PEXPIRE)
- Intermediate: 2 commands (EVAL, INCR)
- Rate‑limited miss: 2 commands (EVAL, INCR)
- Rate‑limited hit: 0 commands

**Sliding Window:**
- First: 5 commands (EVAL, GET, GET, INCR, PEXPIRE)
- Intermediate: 4 commands (EVAL, GET, GET, INCR)
- Rate‑limited miss: 3 commands (EVAL, GET, GET)
- Rate‑limited hit: 0 commands

**Token Bucket:**
- First/Intermediate: 4 commands (EVAL, HMGET, HSET, PEXPIRE)
- Rate‑limited miss: 2 commands (EVAL, HMGET)
- Rate‑limited hit: 0 commands

### `getRemaining()`
Always deterministic, no cache effects:
- Fixed Window: 2 commands (EVAL, GET)
- Sliding Window: 3 commands (EVAL, GET, GET)
- Token Bucket: 2 commands (EVAL, HMGET)

### `resetUsedTokens()`
Starts with SCAN and deletes all matching keys:
- Fixed Window: 3 commands (EVAL, SCAN, DEL)
- Sliding Window: 4 commands (EVAL, SCAN, DEL, DEL)
- Token Bucket: 3 commands (EVAL, SCAN, DEL)

### `blockUntilReady()`
Same cost model as `limit()`.

---

## Optional Features Impact

### Deny List
Adds **2 commands per `limit()` call**:
- One `SMISMEMBER` check
- One TTL fetch for deny list validity

Auto‑IP deny list refresh uses **9 commands once per day** (first limit call after 02:00 UTC).

A deny‑listed identifier is cached for a minute, skipping Redis for subsequent checks.

### Analytics
Adds **1 Redis command per `limit()`** via `ZINCRBY`.

### Dynamic Limits
Adds **1 command** to each `limit()` and `getRemaining()` call.
- `setDynamicLimit()` = 1 command
- `getDynamicLimit()` = 1 command

### Multi‑Region
Effective cost becomes:
```
(1 + readRegionCount) * writeCommandCount + readCommandCount
+1 if analytics is enabled
```

---

## Example Usage

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({ url: process.env.UPSTASH_URL!, token: process.env.UPSTASH_TOKEN! });

const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,            // adds +1 ZINCRBY per call
  enableProtection: true,     // adds +2 per call
  dynamicLimits: true         // adds +1 per call
});

async function handle(ip) {
  const { success, reset } = await limiter.limit(ip);
  if (!success) {
    return { status: 429, retryAfter: reset - Date.now() };
  }

  const remaining = await limiter.getRemaining(ip);
  return { status: 200, remaining };
}
```

This example shows all cost‑impacting features enabled. Sliding Window + deny list + analytics + dynamic limits can increase the base 4–5 command cost per `limit()`.

---

## Common Pitfalls

- **Ignoring cold starts**: Serverless environments often start with empty caches → initial calls incur higher Redis usage.
- **Using Sliding Window when cost‑sensitive**: It requires multiple GET operations, making it the most expensive algorithm.
- **Unexpected multi‑region amplification**: Write commands scale with region count; cost can rise significantly.
- **Assuming deny list is free**: Even when no identifier is blocked, two extra commands execute per request.

---

This file provides an operational reference for estimating Redis usage and optimizing Ratelimit performance and cost.