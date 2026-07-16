# Migrating from node-redis

## Overview

Migrate from node-redis (redis@4.x) to @upstash/redis for automatic serialization, REST API access, and serverless-friendly architecture.

## Good For

- Serverless deployments
- Eliminating manual type conversions
- Cleaner code without Buffer handling
- REST-based access (no TCP connections)

## Limitations

- Different connection model (REST vs TCP)
- Command syntax differences

## Examples

### Basic Comparison

**node-redis:**

```typescript
import { createClient } from "redis";

const redis = createClient({
  url: "redis://localhost:6379",
});

await redis.connect();

// Manual serialization
const user = { name: "Alice", age: 30 };
await redis.set("user:1", JSON.stringify(user));

const raw = await redis.get("user:1");
const retrieved = JSON.parse(raw!);

// Numbers as strings
await redis.set("count", "42");
const count = await redis.get("count"); // "42"
const num = parseInt(count!, 10);

await redis.disconnect();
```

**@upstash/redis:**

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
// No connect() needed

// Automatic serialization
const user = { name: "Alice", age: 30 };
await redis.set("user:1", user);

const retrieved = await redis.get("user:1");
// retrieved is already parsed

// Numbers preserved
await redis.set("count", 42);
const count = await redis.get("count"); // 42 (number)

// No disconnect() needed
```

### Connection Initialization

**node-redis:**

```typescript
import { createClient } from "redis";

const redis = createClient({
  socket: {
    host: "redis.upstash.io",
    port: 6379,
  },
  password: "your-password",
});

await redis.connect();
```

**@upstash/redis:**

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

### Command Syntax

**node-redis:**

```typescript
// SET with expiration
await redis.set("key", "value", { EX: 3600 });

// ZADD
await redis.zAdd("leaderboard", { score: 100, value: "player:1" });

// ZRANGE with scores
const results = await redis.zRangeWithScores("leaderboard", 0, 9);
// Returns: [{ value: "player:1", score: 100 }, ...]
```

**@upstash/redis:**

```typescript
// SET with expiration (lowercase options)
await redis.set("key", "value", { ex: 3600 });

// ZADD (member instead of value)
await redis.zadd("leaderboard", { score: 100, member: "player:1" });

// ZRANGE with scores
const results = await redis.zrange("leaderboard", 0, 9, { withScores: true });
// Returns: [{ member: "player:1", score: 100 }, ...]
```

### Hash Operations

**node-redis:**

```typescript
await redis.hSet("user:1", "name", "Alice");
await redis.hSet("user:1", "age", "30"); // Must be string

const age = await redis.hGet("user:1", "age");
const numAge = parseInt(age!, 10);
```

**@upstash/redis:**

```typescript
await redis.hset("user:1", { name: "Alice", age: 30 }); // Native types

const age = await redis.hget("user:1", "age"); // Returns 30 (number)
```

### Pipelines

**node-redis:**

```typescript
const pipeline = redis.multi();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.get("key1");
const results = await pipeline.exec();
```

**@upstash/redis:**

```typescript
const pipeline = redis.pipeline();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.get("key1");
const results = await pipeline.exec();
```

### Error Handling

**node-redis:**

```typescript
try {
  await redis.get("key");
} catch (error) {
  console.error(error);
} finally {
  await redis.disconnect();
}
```

**@upstash/redis:**

```typescript
try {
  await redis.get("key");
} catch (error) {
  console.error(error);
}
// No cleanup needed
```

### Migration Checklist

1. Replace imports: `import { createClient } from "redis"` → `import { Redis } from "@upstash/redis"`
2. Remove connection management: `await redis.connect()` and `await redis.disconnect()`
3. Update connection config: Use REST URL and token
4. Remove `JSON.stringify`/`JSON.parse` calls
5. Update command names: `zAdd` → `zadd`, `hSet` → `hset` (lowercase)
6. Update options: `EX` → `ex`, `value` → `member` in sorted sets
7. Remove type conversions: No `parseInt`, `parseFloat` needed
