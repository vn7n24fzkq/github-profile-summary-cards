# Upstash Ratelimit Methods (TypeScript)

This document provides a focused, practical reference for all Ratelimit methods. Each section includes direct examples, usage patterns, and common pitfalls.

## limit
Primary method for checking and consuming tokens.

```ts
const { success, remaining, reset, reason, pending } = await ratelimit.limit(
  identifier,
  {
    rate: 2,          // optional: consume N tokens
    ip: req.ip,       // optional: used for deny‑list checks
    userAgent: ua,    // optional
    country: geo?.country,
  }
);

if (!success) return "blocked";

// In Cloudflare/Vercel Edge, flush async work
context.waitUntil(pending);
```

Notes:
- `rate` lets a request consume more than 1 token.
- `reason` can be: `timeout`, `cacheBlock`, `denyList`, or undefined.
- When analytics or MultiRegion is enabled, **always handle `pending`** in serverless environments.

## blockUntilReady
Waits for a request to become allowed instead of rejecting immediately.

```ts
const { success } = await ratelimit.blockUntilReady("id", 30_000);
if (!success) return "still blocked after timeout";
```

## resetUsedTokens
Clears the state for an identifier.

```ts
await ratelimit.resetUsedTokens("user123");
```

Useful when granting temporary resets or admin overrides.

## getRemaining
Read-only view of remaining quota.

```ts
const { remaining, reset } = await ratelimit.getRemaining("user123");
```

Common use cases:
- Dashboard queries
- Showing users their remaining quota

## setDynamicLimit
Overrides the global limit at runtime.

```ts
await ratelimit.setDynamicLimit({ limit: 5 });   // set
await ratelimit.setDynamicLimit({ limit: false }); // remove
```

Notes:
- Requires `dynamicLimits: true` in constructor.
- Applies to all future rate checks.

## getDynamicLimit
Fetch the currently active dynamic limit.

```ts
const { dynamicLimit } = await ratelimit.getDynamicLimit();
```

Returns `null` when no override is active.
