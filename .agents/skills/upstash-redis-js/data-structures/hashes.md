# Hashes

## Overview

Hashes store field-value pairs under a single key. They're optimized for storing objects with multiple attributes.

## Good For

- User profiles
- Product details
- Configuration settings
- Any structured data with named fields

## Limitations

- For nested objects, use JSON data type instead

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

await redis.hset("user:1", {
  name: "Alice",
  email: "alice@example.com",
  age: 30,
});

// Get single field
const name = await redis.hget("user:1", "name"); // "Alice"

// Get multiple fields
const fields = await redis.hmget("user:1", "name", "email"); // ["Alice", "alice@example.com"]

// Get all fields and values
const user = await redis.hgetall("user:1");
// { name: "Alice", email: "alice@example.com", age: 30 }

// Get all field names
const fieldNames = await redis.hkeys("user:1"); // ["name", "email", "age"]

// Get all values
const values = await redis.hvals("user:1"); // ["Alice", "alice@example.com", 30]

// Check if field exists
const hasEmail = await redis.hexists("user:1", "email"); // 1 if exists, 0 if not

// Get number of fields
const fieldCount = await redis.hlen("user:1"); // 3

// Increment numeric field
await redis.hset("user:1", { loginCount: 0 });
await redis.hincrby("user:1", "loginCount", 1); // 1
await redis.hincrby("user:1", "loginCount", 5); // 6

// Increment float field
await redis.hset("user:1", { balance: 100.5 });
await redis.hincrbyfloat("user:1", "balance", 25.75); // 126.25

// Set only if field doesn't exist
await redis.hsetnx("user:1", "verified", "true"); // Returns 1 if set, 0 if exists

// Delete fields
await redis.hdel("user:1", "age");
await redis.hdel("user:1", "loginCount", "balance"); // Delete multiple fields

// Delete entire hash
await redis.del("user:1");
```
