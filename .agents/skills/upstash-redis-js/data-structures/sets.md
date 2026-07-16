# Sets

## Overview

Sets are unordered collections of unique strings. They provide fast membership testing and set operations (union, intersection, difference).

## Good For

- Unique item tracking (unique visitors, tags)
- Deduplication
- Membership testing
- Set operations (finding common elements between sets)

## Limitations

- Maximum members: 2^32 - 1 (4.2 billion) per set
- Unordered (no guaranteed iteration order)
- Members must be unique (duplicates are automatically ignored)

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Add members to set (duplicates are ignored)
await redis.sadd("tags", "javascript", "redis", "typescript");
await redis.sadd("tags", "javascript"); // Ignored, already exists

// Get all members
const allTags = await redis.smembers("tags"); // ["javascript", "redis", "typescript"]

// Check if member exists
const hasRedis = await redis.sismember("tags", "redis"); // 1 if exists, 0 if not

// Check multiple members at once
const exists = await redis.smismember("tags", ["redis", "python", "typescript"]);
// [1, 0, 1] - redis exists, python doesn't, typescript exists

// Get number of members
const count = await redis.scard("tags"); // 3

// Remove members
await redis.srem("tags", "typescript");
await redis.srem("tags", "javascript", "redis"); // Remove multiple

// Pop random member (removes and returns)
await redis.sadd("items", "a", "b", "c", "d");
const random = await redis.spop("items"); // Removes and returns random member
const twoRandom = await redis.spop("items", 2); // Remove and return 2 random members

// Get random member without removing
const randomItem = await redis.srandmember("items");
const threeRandom = await redis.srandmember("items", 3);

// Set operations with multiple sets
await redis.sadd("set1", "a", "b", "c");
await redis.sadd("set2", "b", "c", "d");
await redis.sadd("set3", "c", "d", "e");

// Intersection (common elements)
const common = await redis.sinter("set1", "set2"); // ["b", "c"]
const commonAll = await redis.sinter("set1", "set2", "set3"); // ["c"]

// Count the intersection without returning members
const commonCount = await redis.sintercard(["set1", "set2"]); // 2

// Store intersection result in new set
await redis.sinterstore("result", "set1", "set2");

// Union (all unique elements from all sets)
const union = await redis.sunion("set1", "set2"); // ["a", "b", "c", "d"]

// Store union result
await redis.sunionstore("result", "set1", "set2");

// Difference (elements in first set but not in others)
const diff = await redis.sdiff("set1", "set2"); // ["a"]
const diff2 = await redis.sdiff("set2", "set1"); // ["d"]

// Store difference result
await redis.sdiffstore("result", "set1", "set2");

// Move member from one set to another
await redis.smove("set1", "set2", "a"); // Move "a" from set1 to set2

// Delete entire set
await redis.del("tags");
```
