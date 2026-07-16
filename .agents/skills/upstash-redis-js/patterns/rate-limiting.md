# Rate Limiting

## Overview

Control request rates to prevent abuse and ensure fair resource usage. Use counters with TTL for simple rate limiting, or @upstash/ratelimit for production.

## Good For

- API rate limiting (requests per user/IP)
- Preventing brute force attacks
- Throttling expensive operations
- Fair resource allocation

## Limitations

- Simple counters can be imprecise at window boundaries
- Distributed rate limiting requires careful coordination
- Use @upstash/ratelimit for production (supports multiple algorithms)

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Simple fixed-window rate limiter
async function simpleRateLimit(userId: string, limit: number = 10, window: number = 60) {
  const key = `ratelimit:${userId}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, window);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    reset: window,
  };
}

// Usage
const result = await simpleRateLimit("user:123", 10, 60);

if (!result.allowed) {
  throw new Error("Rate limit exceeded");
}

// Sliding window rate limiter using sorted set
async function slidingWindowRateLimit(userId: string, limit: number = 10, window: number = 60) {
  const key = `ratelimit:sliding:${userId}`;
  const now = Date.now();
  const windowStart = now - window * 1000;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count requests in window
  const count = await redis.zcard(key);

  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Add current request
  await redis.zadd(key, { score: now, member: `${now}:${Math.random()}` });
  await redis.expire(key, window * 2); // Cleanup

  return {
    allowed: true,
    remaining: limit - count - 1,
  };
}

// Token bucket using Lua script
const tokenBucketScript = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local rate = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  
  local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
  local tokens = tonumber(bucket[1] or capacity)
  local last_refill = tonumber(bucket[2] or now)
  
  -- Refill tokens based on time elapsed
  local elapsed = now - last_refill
  local refill = math.floor(elapsed * rate)
  tokens = math.min(capacity, tokens + refill)
  
  if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    redis.call('EXPIRE', key, 3600)
    return 1
  else
    return 0
  end
`;

async function tokenBucketRateLimit(userId: string, capacity: number = 10, rate: number = 1) {
  const key = `ratelimit:bucket:${userId}`;
  const now = Date.now() / 1000;

  const allowed = await redis.eval<number>(tokenBucketScript, [key], [capacity, rate, now]);

  return { allowed: allowed === 1 };
}

// Production: Use @upstash/ratelimit
// npm install @upstash/ratelimit
import { Ratelimit } from "@upstash/ratelimit";

// Fixed window
const fixedWindowLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, "60 s"),
});

// Sliding window
const slidingWindowLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
});

// Token bucket
const tokenBucketLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(10, "1 s", 10),
});

// Usage
async function handleRequest(userId: string) {
  const { success, limit, remaining, reset } = await fixedWindowLimiter.limit(userId);

  if (!success) {
    return {
      error: "Rate limit exceeded",
      limit,
      remaining,
      reset,
    };
  }

  // Process request
  return { data: "Success", remaining };
}

// Multi-tier rate limiting
async function multiTierRateLimit(userId: string, tier: "free" | "pro") {
  const limits = {
    free: { requests: 100, window: 3600 },
    pro: { requests: 1000, window: 3600 },
  };

  const config = limits[tier];
  return await simpleRateLimit(userId, config.requests, config.window);
}

// Per-endpoint rate limiting
async function endpointRateLimit(userId: string, endpoint: string) {
  const key = `${userId}:${endpoint}`;
  return await simpleRateLimit(key, 10, 60);
}

// IP-based rate limiting
async function ipRateLimit(ip: string) {
  return await simpleRateLimit(`ip:${ip}`, 100, 60);
}

// Combined rate limiting (both user and IP)
async function combinedRateLimit(userId: string, ip: string) {
  const [userLimit, ipLimit] = await Promise.all([
    simpleRateLimit(`user:${userId}`, 100, 60),
    simpleRateLimit(`ip:${ip}`, 1000, 60),
  ]);

  return {
    allowed: userLimit.allowed && ipLimit.allowed,
    limits: { user: userLimit, ip: ipLimit },
  };
}
```

**Recommendation**: For production, use `@upstash/ratelimit` which provides battle-tested algorithms, analytics, and better accuracy.
