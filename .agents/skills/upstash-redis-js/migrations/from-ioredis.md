# Migrating from ioredis

## Overview

Migrate from ioredis to @upstash/redis by removing manual serialization, using REST API, and leveraging automatic type preservation.

## Good For

- Serverless environments (no TCP connections)
- Reducing boilerplate (no JSON.stringify/parse)
- Type safety with automatic serialization
- Simplified code maintenance

## Examples

### Basic Comparison

**ioredis:**

```typescript
import Redis from "ioredis";

const redis = new Redis({
  host: "localhost",
  port: 6379,
});

// Manual serialization required
const user = { name: "Alice", age: 30 };
await redis.set("user:1", JSON.stringify(user));

const raw = await redis.get("user:1");
const retrieved = JSON.parse(raw!); // Manual parsing

// Numbers returned as strings
await redis.set("count", "42");
const count = await redis.get("count"); // "42" (string)
const numCount = parseInt(count!, 10); // Convert manually
```

**@upstash/redis:**

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Automatic serialization
const user = { name: "Alice", age: 30 };
await redis.set("user:1", user); // No JSON.stringify

const retrieved = await redis.get("user:1"); // Automatic parsing
console.log(retrieved.name); // "Alice"

// Numbers preserved
await redis.set("count", 42);
const count = await redis.get("count"); // 42 (number)
```

### Connection Initialization

**ioredis:**

```typescript
import Redis from "ioredis";

const redis = new Redis({
  host: "redis.upstash.io",
  port: 6379,
  password: "your-password",
});
```

**@upstash/redis:**

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Or use environment variables
const redis = Redis.fromEnv();
```

### Command Syntax

**ioredis:**

```typescript
// SET with expiration (positional args)
await redis.set("key", "value", "EX", 3600);

// ZADD
await redis.zadd("leaderboard", 100, "player:1");
```

**@upstash/redis:**

```typescript
// SET with expiration (options object)
await redis.set("key", "value", { ex: 3600 });

// ZADD
await redis.zadd("leaderboard", { score: 100, member: "player:1" });
```

### Pipelines

**ioredis:**

```typescript
const pipeline = redis.pipeline();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.get("key1");
const results = await pipeline.exec();
// Results: [[null, "OK"], [null, "OK"], [null, "value1"]]
```

**@upstash/redis:**

```typescript
const pipeline = redis.pipeline();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.get("key1");
const results = await pipeline.exec();
// Results: ["OK", "OK", "value1"]
```

### Hash Operations

**ioredis:**

```typescript
const hash = { name: "Alice", age: "30" }; // Must be strings
await redis.hmset("user:1", hash);

const retrieved = await redis.hgetall("user:1");
console.log(typeof retrieved.age); // "string"
```

**@upstash/redis:**

```typescript
const hash = { name: "Alice", age: 30 }; // Native types
await redis.hset("user:1", hash);

const retrieved = await redis.hgetall("user:1");
console.log(typeof retrieved.age); // "number"
```

### Migration Checklist

1. Replace imports: `import Redis from "ioredis"` → `import { Redis } from "@upstash/redis"`
2. Update connection: Use REST URL and token instead of host/port
3. Remove `JSON.stringify`/`JSON.parse` calls
4. Update command syntax: Positional args → options objects where applicable
5. Remove `parseInt`/`parseFloat` for numbers
6. Update ZADD syntax: `redis.zadd(key, score, member)` → `redis.zadd(key, { score, member })`
