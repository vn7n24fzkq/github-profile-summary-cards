# Leaderboard Pattern

## Overview

Use Sorted Sets (ZSET) to implement leaderboards with automatic ranking. Scores determine rank, members are unique.

## Good For

- Gaming leaderboards (high scores)
- User rankings by activity, points, or reputation
- Top performers, trending content
- Time-based rankings (using timestamps as scores)

## Limitations

- Ties have undefined order (use score decimals or timestamps to break ties)
- Memory grows with number of members

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Add/update scores
await redis.zadd("leaderboard:global", { score: 1500, member: "player:123" });
await redis.zadd("leaderboard:global", { score: 2300, member: "player:456" });
await redis.zadd("leaderboard:global", { score: 1800, member: "player:789" });

// Increment score
await redis.zincrby("leaderboard:global", 100, "player:123"); // +100 points

// Get top 10 (highest scores first)
const top10 = await redis.zrange("leaderboard:global", 0, 9, { rev: true, withScores: true });
// Returns: [{ member: "player:456", score: 2300 }, { member: "player:789", score: 1800 }, ...]

// Get player's rank (0-based, lowest score = rank 0)
const rank = await redis.zrevrank("leaderboard:global", "player:123");
// Use zrevrank for highest-first ranking

// Get player's score
const score = await redis.zscore("leaderboard:global", "player:123");

// Get rank with score
async function getPlayerStats(playerId: string) {
  const [rank, score, totalPlayers] = await Promise.all([
    redis.zrevrank("leaderboard:global", playerId),
    redis.zscore("leaderboard:global", playerId),
    redis.zcard("leaderboard:global"),
  ]);

  return {
    playerId,
    score,
    rank: rank !== null ? rank + 1 : null, // Convert to 1-based
    totalPlayers,
  };
}

// Get surrounding players (context ranking)
async function getRankContext(playerId: string, range: number = 5) {
  const rank = await redis.zrevrank("leaderboard:global", playerId);

  if (rank === null) return null;

  const start = Math.max(0, rank - range);
  const end = rank + range;

  const players = await redis.zrange("leaderboard:global", start, end, {
    rev: true,
    withScores: true,
  });

  return players;
}

// Time-based leaderboard (daily)
const today = new Date().toISOString().split("T")[0];
const dailyKey = `leaderboard:daily:${today}`;

await redis.zadd(dailyKey, { score: 500, member: "player:123" });
await redis.expire(dailyKey, 86400 * 7); // Keep for 7 days

// Multiple leaderboards (by region)
await redis.zadd("leaderboard:us", { score: 1500, member: "player:123" });
await redis.zadd("leaderboard:eu", { score: 1500, member: "player:456" });

// Get top from multiple boards
const [usTop, euTop] = await Promise.all([
  redis.zrange("leaderboard:us", 0, 9, { rev: true, withScores: true }),
  redis.zrange("leaderboard:eu", 0, 9, { rev: true, withScores: true }),
]);

// Score range query (players with score 1000-2000)
const midRange = await redis.zrangebyscore("leaderboard:global", 1000, 2000, {
  withScores: true,
});

// Remove player
await redis.zrem("leaderboard:global", "player:123");

// Remove bottom 10% (cleanup low performers)
const total = await redis.zcard("leaderboard:global");
const cutoff = Math.floor(total * 0.1);
await redis.zpopmin("leaderboard:global", cutoff);

// Tie breaking: use timestamp as decimal
const now = Date.now();
const scoreWithTieBreaker = 1500 + now / 1e13; // 1500.000123456
await redis.zadd("leaderboard:global", {
  score: scoreWithTieBreaker,
  member: "player:999",
});

// Batch update scores
const pipeline = redis.pipeline();
pipeline.zadd("leaderboard:global", { score: 1600, member: "player:1" });
pipeline.zadd("leaderboard:global", { score: 1700, member: "player:2" });
pipeline.zadd("leaderboard:global", { score: 1800, member: "player:3" });
await pipeline.exec();

// Get percentile rank
async function getPercentile(playerId: string) {
  const [rank, total] = await Promise.all([
    redis.zrevrank("leaderboard:global", playerId),
    redis.zcard("leaderboard:global"),
  ]);

  if (rank === null) return null;

  return ((rank / total) * 100).toFixed(2);
}
```
