# Caching Strategies

## Overview

Use Redis as a cache layer to reduce database load and improve response times. Supports cache-aside, write-through, and TTL-based expiration.

## Good For

- Reducing database queries
- Storing frequently accessed data
- Session data, API responses, computed results
- Temporary data with automatic expiration

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Cache-Aside (Lazy Loading) - most common pattern
async function getUser(userId: string) {
  // Try cache first
  const cached = await redis.get(`user:${userId}`);

  if (cached) {
    return cached; // Cache hit
  }

  // Cache miss - fetch from database
  const user = await database.users.findById(userId);

  // Store in cache with 1 hour TTL
  await redis.set(`user:${userId}`, user, { ex: 3600 });

  return user;
}

// Write-Through - update cache on write
async function updateUser(userId: string, data: any) {
  // Update database
  const user = await database.users.update(userId, data);

  // Update cache immediately
  await redis.set(`user:${userId}`, user, { ex: 3600 });

  return user;
}

// Cache invalidation
async function deleteUser(userId: string) {
  // Delete from database
  await database.users.delete(userId);

  // Invalidate cache
  await redis.del(`user:${userId}`);
}
```
