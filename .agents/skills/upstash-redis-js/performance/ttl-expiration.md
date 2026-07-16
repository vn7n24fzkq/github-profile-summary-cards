# TTL and Key Expiration

## Overview

Set Time-To-Live (TTL) on keys for automatic expiration. Useful for caches, sessions, and temporary data to manage memory usage.

## Good For

- Cache expiration (prevent stale data)
- Session timeouts
- Temporary data storage
- Memory management

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Set with expiration (EX = seconds)
await redis.set("session:123", { userId: "user1" }, { ex: 3600 });

// Add TTL to existing key
await redis.set("key", "value");
await redis.expire("key", 300); // Expire in 5 minutes

// Get TTL of a key
const ttl = await redis.ttl("key");
console.log(`TTL: ${ttl} seconds`);
// Returns: remaining seconds, -1 (no expiry), -2 (key doesn't exist)
```
