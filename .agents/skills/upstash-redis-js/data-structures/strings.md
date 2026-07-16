# Strings

## Overview

Strings are the most basic Redis data structure. They store a single value and support atomic operations like increment/decrement.

## Good For

- Caching simple values (strings, numbers, booleans, objects)
- Counters (page views, likes, inventory)
- Feature flags
- Session tokens

## Limitations

- Maximum value size: 512 MB
- No built-in list or set operations on a single key
- Increment/decrement only work on values that can be parsed as integers

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Set and get strings
await redis.set("greeting", "Hello World");
const greeting = await redis.get("greeting"); // "Hello World"

// Set and get numbers (automatic serialization)
await redis.set("views", 100);
const views = await redis.get("views"); // 100 (as number, not string)

// Set and get objects (automatic JSON serialization)
await redis.set("user", { name: "Alice", age: 30 });
const user = await redis.get("user"); // { name: "Alice", age: 30 }

// Set with expiration (TTL in seconds)
await redis.setex("session", 3600, { userId: "123" });

// Set only if key doesn't exist
await redis.setnx("lock", "process-1"); // Returns 1 if set, 0 if already exists

// Increment and decrement counters
await redis.incr("views"); // 101
await redis.decr("views"); // 100
await redis.incrby("views", 10); // 110
await redis.decrby("views", 5); // 105

// Append to string
await redis.set("name", "Alice");
await redis.append("name", " Smith"); // "Alice Smith"

// Get and set atomically
const oldValue = await redis.getset("counter", 0);

// Multiple get/set (batch operations)
await redis.mset({ key1: "value1", key2: "value2", key3: 123 });
const values = await redis.mget("key1", "key2", "key3"); // ["value1", "value2", 123]

// Check if key exists
const exists = await redis.exists("greeting"); // 1 if exists, 0 if not

// Delete key
await redis.del("greeting");

// Get TTL (time to live in seconds)
await redis.ttl("session"); // seconds remaining, -1 if no expiry, -2 if doesn't exist

// Set expiration on existing key
await redis.expire("key1", 60); // expires in 60 seconds
```
