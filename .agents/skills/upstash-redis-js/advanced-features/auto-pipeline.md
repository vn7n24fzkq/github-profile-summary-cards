# Automatic Pipelining

## Overview

Automatic pipelining batches multiple Redis commands into a single HTTP request, reducing round-trip latency for independent operations.

It's enabled by default. Use `enableAutoPipelining: false` to disable automatic pipelining.

## Good For

- Multiple independent GET/SET operations
- Batch reads across different keys
- Reducing latency in high-latency networks
- Serverless environments with cold starts

## Limitations

- Only works with independent commands (no command depends on another's result)
- Not beneficial for single commands

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Without auto-pipeline: 3 separate HTTP requests
// With auto-pipeline: 1 HTTP request containing all 3 commands
const [user, posts, comments] = await Promise.all([
  redis.get("user:1"),
  redis.get("posts:1"),
  redis.get("comments:1"),
]);

// Auto-pipeline batches these independent operations
async function fetchUserData(userId: string) {
  const [profile, settings, activity] = await Promise.all([
    redis.hgetall(`user:${userId}:profile`),
    redis.hgetall(`user:${userId}:settings`),
    redis.zrange(`user:${userId}:activity`, 0, 9),
  ]);

  return { profile, settings, activity };
}
```
