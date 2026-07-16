# Batching Operations

## Overview

Batch multiple Redis operations into single commands to reduce network round trips. Use MGET/MSET for strings, HMGET/HMSET for hashes, pipelines for mixed operations.

## Good For

- Fetching multiple keys at once
- Bulk data loading
- Reducing latency in high-latency networks
- Operations on related data

## Limitations

- Batch operations are atomic per command, not across commands
- Some commands don't have batch equivalents

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// MGET - batch get multiple keys
const [user1, user2, user3] = await redis.mget<any[]>("user:1", "user:2", "user:3");

// MSET - batch set multiple keys
await redis.mset({
  "user:1": { name: "Alice", age: 30 },
  "user:2": { name: "Bob", age: 25 },
  "user:3": { name: "Charlie", age: 35 },
});

// Compare: individual operations (3 round trips)
const u1 = await redis.get("user:1");
const u2 = await redis.get("user:2");
const u3 = await redis.get("user:3");

// vs batch operation (1 round trip)
const users = await redis.mget("user:1", "user:2", "user:3");

// HMGET - batch get hash fields
const [name, email] = await redis.hmget("user:123", "name", "email");

// HMSET - batch set hash fields
await redis.hset("user:123", {
  name: "Alice",
  email: "alice@example.com",
  age: 30,
});

// Batch with mixed operations - use pipeline
const pipeline = redis.pipeline();
userIds.forEach((id) => {
  pipeline.get(`user:${id}`);
  pipeline.hgetall(`user:${id}:profile`);
  pipeline.zrank("leaderboard", id);
});
const results = await pipeline.exec();

// Batch delete
await redis.del("key1", "key2", "key3", "key4");

// Batch SADD
await redis.sadd("tags", "redis", "nodejs", "typescript", "upstash");

// Batch with Promise.all (for independent operations)
const [userCount, postCount, commentCount] = await Promise.all([
  redis.get("count:users"),
  redis.get("count:posts"),
  redis.get("count:comments"),
]);
// Note: With auto-pipelining enabled, these batch automatically
```
