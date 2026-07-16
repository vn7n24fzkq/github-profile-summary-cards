# Lists

## Overview

Lists are ordered collections of strings. They support operations at both ends (head and tail) with O(1) time complexity.

## Good For

- Activity feeds (latest posts, news)
- Job queues
- Recent items (last 100 searches)
- Stack or queue implementations

## Limitations

- Maximum length: 2^32 - 1 (4.2 billion) elements
- Accessing elements by index is O(N) for large lists
- No built-in deduplication (use sets for unique values)

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Push to left (head) of list
await redis.lpush("tasks", "task1");
await redis.lpush("tasks", "task2", "task3"); // ["task3", "task2", "task1"]

// Push to right (tail) of list
await redis.rpush("tasks", "task4"); // ["task3", "task2", "task1", "task4"]

// Get list length
const length = await redis.llen("tasks"); // 4

// Get range of elements (0-based index, inclusive)
const allTasks = await redis.lrange("tasks", 0, -1); // All elements
const firstTwo = await redis.lrange("tasks", 0, 1); // ["task3", "task2"]

// Get element by index
const first = await redis.lindex("tasks", 0); // "task3"
const last = await redis.lindex("tasks", -1); // "task4"

// Set element at index
await redis.lset("tasks", 0, "updated-task");

// Pop from left (head)
const leftItem = await redis.lpop("tasks"); // "updated-task"

// Pop from right (tail)
const rightItem = await redis.rpop("tasks"); // "task4"

// Pop multiple elements from left
await redis.lpush("numbers", 1, 2, 3, 4, 5);
const twoItems = await redis.lpop("numbers", 2); // [5, 4]

// Trim list to specified range (keep only indices 0 to 2)
await redis.ltrim("tasks", 0, 2);

// Remove elements by value
await redis.rpush("items", "a", "b", "c", "b", "d");
await redis.lrem("items", 2, "b"); // Remove first 2 occurrences of "b" from left
// Use negative count to remove from right, 0 to remove all

// Insert before or after a pivot element
await redis.linsert("items", "BEFORE", "c", "x"); // Insert "x" before "c"
await redis.linsert("items", "AFTER", "c", "y"); // Insert "y" after "c"

// Delete entire list
await redis.del("tasks");
```
