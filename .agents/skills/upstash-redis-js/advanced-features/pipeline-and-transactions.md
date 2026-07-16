# Pipelines and Transactions

## Overview

**Pipelines** batch multiple commands for efficiency. **Transactions** (MULTI/EXEC) execute commands atomically.

## Good For

- **Pipelines**: Reducing round trips for independent operations
- **Transactions**: Atomic operations that must succeed or fail together

## Limitations

- Pipeline commands execute independently (no atomicity)
- No WATCH / optimistic locking over the REST client — use a Lua script (`redis.eval`) for atomic check-and-set

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Manual Pipeline - batch operations for efficiency
const pipeline = redis.pipeline();
pipeline.set("user:1:name", "Alice");
pipeline.set("user:1:email", "alice@example.com");
pipeline.incr("user:count");
pipeline.lpush("recent:users", "user:1");

const results = await pipeline.exec();
// Returns array of results: [OK, OK, 1, 1]

// Transaction (MULTI/EXEC) - atomic operations
const tx = redis.multi();
tx.decrby("inventory:item:1", 5); // Deduct inventory
tx.incrby("user:123:purchases", 5); // Add to user purchases
tx.lpush("orders", JSON.stringify({ userId: 123, itemId: 1, qty: 5 }));

const txResults = await tx.exec();
// All commands succeed together or all fail
```
