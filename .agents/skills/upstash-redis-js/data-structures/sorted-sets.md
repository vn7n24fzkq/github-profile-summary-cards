# Sorted Sets

## Overview

Sorted sets store unique members with associated scores. Members are automatically ordered by score, enabling range queries and rankings.

## Good For

- Leaderboards and rankings
- Priority queues
- Time-series data (using timestamp as score)
- Trending content (using engagement score)

## Limitations

- Maximum members: 2^32 - 1 (4.2 billion) per sorted set
- Scores are 64-bit floating point numbers
- Members must be unique (updating a member replaces its score)

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Add members with scores
await redis.zadd("leaderboard", { score: 100, member: "player1" });
await redis.zadd(
  "leaderboard",
  { score: 250, member: "player2" },
  { score: 150, member: "player3" }
);

// Update score (replaces if member exists)
await redis.zadd("leaderboard", { score: 300, member: "player1" });

// Increment score
await redis.zincrby("leaderboard", 50, "player3"); // player3 now has 200

// Get number of members
const count = await redis.zcard("leaderboard"); // 3

// Get score of a member
const score = await redis.zscore("leaderboard", "player1"); // 300

// Get rank (position) of member (0-based, lowest score = rank 0)
const rank = await redis.zrank("leaderboard", "player3"); // 0 (lowest score)

// Get reverse rank (highest score = rank 0)
const revRank = await redis.zrevrank("leaderboard", "player1"); // 0 (highest score)

// Get range by rank (ascending order)
const bottom2 = await redis.zrange("leaderboard", 0, 1);
// ["player3", "player2"] - without scores

// Get range with scores
const bottom2WithScores = await redis.zrange("leaderboard", 0, 1, { withScores: true });
// [{ member: "player3", score: 200 }, { member: "player2", score: 250 }]

// Get range in descending order (highest scores first)
const top2 = await redis.zrange("leaderboard", 0, 1, { rev: true });
// ["player1", "player2"]

const top2WithScores = await redis.zrange("leaderboard", 0, 1, { withScores: true, rev: true });
// [{ member: "player1", score: 300 }, { member: "player2", score: 250 }]

// Get all members
const all = await redis.zrange("leaderboard", 0, -1);

// Get range by score
const midRange = await redis.zrange("leaderboard", 150, 250, { byScore: true });
// ["player3", "player2"]

// Get range by score (descending)
const midRangeDesc = await redis.zrange("leaderboard", 250, 150, { rev: true, byScore: true });
// ["player2", "player3"]

// Count members in score range
const countInRange = await redis.zcount("leaderboard", 100, 250); // 2

// Remove members
await redis.zrem("leaderboard", "player2");
await redis.zrem("leaderboard", "player1", "player3"); // Remove multiple

// Remove by rank range
await redis.zadd(
  "scores",
  { score: 1, member: "a" },
  { score: 2, member: "b" },
  { score: 3, member: "c" }
);
await redis.zremrangebyrank("scores", 0, 0); // Remove lowest score (rank 0)

// Remove by score range
await redis.zremrangebyscore("scores", 2, 3); // Remove members with scores 2-3

// Pop members (remove and return)
await redis.zadd("items", { score: 1, member: "a" }, { score: 2, member: "b" });
const lowest = await redis.zpopmin("items"); // Remove and return lowest score
const highest = await redis.zpopmax("items"); // Remove and return highest score

// Pop multiple members
await redis.zadd(
  "items",
  { score: 1, member: "a" },
  { score: 2, member: "b" },
  { score: 3, member: "c" }
);
const twoLowest = await redis.zpopmin("items", 2); // Remove 2 lowest

// Practical example: Time-series data
const now = Date.now();
await redis.zadd(
  "events",
  { score: now - 3600000, member: "event1" }, // 1 hour ago
  { score: now - 1800000, member: "event2" }, // 30 min ago
  { score: now, member: "event3" } // now
);

// Get events from last hour
const lastHour = await redis.zrange("events", now - 3600000, now, { byScore: true });

// Delete entire sorted set
await redis.del("leaderboard");
```
