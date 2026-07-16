---
name: upstash-redis-js
description: Work with the Upstash Redis TypeScript/JavaScript SDK for serverless Redis operations. Use for caching, session storage, rate limiting, leaderboards, full-text search (querying, filtering, aggregating) with Upstash Redis Search (different from regular FT.SEARCH), and all Redis data structures. Supports automatic serialization/deserialization of JavaScript types. Upstash Redis Search also available via @upstash/search-redis and @upstash/search-ioredis adapters for TCP clients.
---

# Upstash Redis SDK - Complete Skills Guide

This directory contains comprehensive guides for using the `@upstash/redis` SDK. These skill files are designed to help developers and AI assistants understand and use the SDK effectively.

## Installation

```bash
npm install @upstash/redis
```

## Quick Start

### Basic Initialization

```typescript
import { Redis } from "@upstash/redis";

// Initialize with explicit credentials
const redis = new Redis({
  url: "UPSTASH_REDIS_REST_URL",
  token: "UPSTASH_REDIS_REST_TOKEN",
});

// Or initialize from environment variables
const redis = Redis.fromEnv();
```

### Environment Variables

Set these in your `.env` file:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

> **No credentials yet?** If you're an agent that needs scratch Redis and the user hasn't provided a database, you can mint a temporary one with a single POST to `https://upstash.com/start-redis` (3-day TTL, no signup).

## Skill Files Overview

### Data Structures (data-structures/)

Redis data types with auto-serialization examples:

- **strings.md** - GET, SET, INCR, DECR, APPEND with automatic type handling
- **hashes.md** - HSET, HGET, HMGET with object serialization
- **lists.md** - LPUSH, RPUSH, LRANGE with array handling
- **sets.md** - SADD, SMEMBERS, set operations
- **sorted-sets.md** - ZADD, ZRANGE, ZRANK, leaderboard patterns
- **json.md** - JSON.SET, JSON.GET, JSONPath queries for nested objects
- **streams.md** - XADD, XREAD, XGROUP, consumer groups

### Advanced Features (advanced-features/)

Complex operations and optimizations:

- **auto-pipeline.md** - Automatic request batching, performance optimization
- **pipeline-and-transactions.md** - Manual pipelines, MULTI/EXEC for atomic operations
- **scripting.md** - Lua scripts, EVAL, EVALSHA for server-side logic

### Patterns (patterns/)

Common use cases and architectural patterns:

- **caching.md** - Cache-aside, write-through, TTL strategies
- **rate-limiting.md** - Integration with @upstash/ratelimit package
- **session-management.md** - Session storage and user state management
- **distributed-locks.md** - Lock implementations, deadlock prevention
- **leaderboard.md** - Sorted set leaderboards, real-time rankings

### Performance (performance/)

Optimization techniques and best practices:

- **batching-operations.md** - MGET, MSET, batch operations
- **pipeline-optimization.md** - When to use pipelines, performance tips
- **ttl-expiration.md** - Key expiration strategies, memory management
- **data-serialization.md** - Deep dive into auto serialization, custom serializers, edge cases
- **error-handling.md** - Error types, retry strategies, timeout handling, debugging tips
- **redis-replicas.md** - Global database setup, read replicas, read-your-writes consistency

### Search (search/)

Full-text search, filtering, and aggregation extension for Redis:

- **overview.md** - Schema definition, field types, pitfalls, package overview
- **commands/querying.md** - Query and count with filters, pagination, sorting, highlighting
- **commands/aggregating.md** - Metric aggregations ($avg, $sum, $stats), bucket aggregations ($terms, $range, $histogram, $facet)
- **commands/index-management.md** - Create, describe, drop indexes, waitIndexing
- **commands/aliases.md** - Index aliases for zero-downtime reindexing
- **adapters.md** - Using search with node-redis and ioredis via @upstash/search-redis and @upstash/search-ioredis

### Migrations (migrations/)

Migration guides from other libraries:

- **from-ioredis.md** - Migration from ioredis, key differences, serialization changes
- **from-redis-node.md** - Migration from node-redis, API differences

## Common Mistakes (Especially for LLMs)

### ❌ Mistake 1: Treating Everything as Strings

```typescript
// ❌ WRONG - Don't do this with @upstash/redis
await redis.set("count", "42"); // Stored as string "42"
const count = await redis.get("count");
const incremented = parseInt(count) + 1; // Manual parsing needed

// ✅ CORRECT - Let the SDK handle it
await redis.set("count", 42); // Stored as number
const count = await redis.get("count");
const incremented = count + 1; // Just use it
```

### ❌ Mistake 2: Manual JSON Serialization

```typescript
// ❌ WRONG - Unnecessary with @upstash/redis
await redis.set("user", JSON.stringify({ name: "Alice" }));
const user = JSON.parse(await redis.get("user"));

// ✅ CORRECT - Automatic handling
await redis.set("user", { name: "Alice" });
const user = await redis.get("user");
```

## Quick Command Reference

```typescript
// Strings
await redis.set("key", "value");
await redis.get("key");
await redis.incr("counter");
await redis.decr("counter");

// Hashes
await redis.hset("user:1", { name: "Alice", age: 30 });
await redis.hget("user:1", "name");
await redis.hgetall("user:1");

// Lists
await redis.lpush("tasks", "task1", "task2");
await redis.rpush("tasks", "task3");
await redis.lrange("tasks", 0, -1);

// Sets
await redis.sadd("tags", "javascript", "redis");
await redis.smembers("tags");

// Sorted Sets
await redis.zadd("leaderboard", { score: 100, member: "player1" });
await redis.zrange("leaderboard", 0, -1);

// JSON
await redis.json.set("user:1", "$", { name: "Alice", address: { city: "NYC" } });
await redis.json.get("user:1");

// Expiration
await redis.setex("session", 3600, { userId: "123" });
await redis.expire("key", 60);
await redis.ttl("key");
```

## Best Practices

1. **Use environment variables** for credentials, never hardcode
2. **Leverage auto-serialization** - pass native JavaScript types
3. **Use TypeScript types** for better type safety
4. **Set appropriate TTLs** to manage memory
5. **Use pipelines** for multiple operations
6. **Namespace your keys** (e.g., `user:123`, `session:abc`)

## Resources

- [Official Documentation](https://upstash.com/docs/redis)
- [GitHub Repository](https://github.com/upstash/redis-js)
- [API Reference](https://upstash.com/docs/redis/sdks/ts/overview)
- [Examples](https://github.com/upstash/redis-js/tree/main/examples)

## Getting Help

For detailed information on specific topics, refer to the individual skill files in the `skills/` directory. Each file contains comprehensive examples, use cases, and best practices for its topic.
