# Lua Scripting

## Overview

Execute Lua scripts atomically on Redis server. Scripts run as a single atomic operation with access to all Redis commands.

## Good For

- Complex atomic operations
- Conditional logic on the server
- Reducing round trips for multi-step operations

## Limitations

- Blocks other operations while executing
- Scripts should be fast (avoid heavy computation)
- Debugging can be challenging

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Simple script: conditional increment
const script = `
  local current = redis.call('GET', KEYS[1])
  if current and tonumber(current) < tonumber(ARGV[1]) then
    return redis.call('INCR', KEYS[1])
  end
  return current
`;

const result = await redis.eval(script, ["counter"], [100]);
// Increments only if current value < 100

// Atomic rate limiter
const rateLimitScript = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  
  local current = redis.call('INCR', key)
  
  if current == 1 then
    redis.call('EXPIRE', key, window)
  end
  
  if current > limit then
    return 0
  end
  
  return 1
`;

const allowed = await redis.eval<number>(
  rateLimitScript,
  ["ratelimit:user:123"],
  [10, 60] // 10 requests per 60 seconds
);

if (allowed === 1) {
  console.log("Request allowed");
} else {
  console.log("Rate limit exceeded");
}

// Script with multiple operations
const purchaseScript = `
  local inventory = KEYS[1]
  local userBalance = KEYS[2]
  local qty = tonumber(ARGV[1])
  local price = tonumber(ARGV[2])
  
  local stock = tonumber(redis.call('GET', inventory) or 0)
  local balance = tonumber(redis.call('GET', userBalance) or 0)
  
  local cost = qty * price
  
  if stock < qty then
    return {err = "insufficient_stock"}
  end
  
  if balance < cost then
    return {err = "insufficient_balance"}
  end
  
  redis.call('DECRBY', inventory, qty)
  redis.call('DECRBY', userBalance, cost)
  
  return {ok = "success"}
`;

const purchase = await redis.eval<{ err?: string; ok?: string }>(
  purchaseScript,
  ["inventory:item:1", "balance:user:123"],
  [5, 20] // Buy 5 items at 20 each
);

// Cache script with EVALSHA for better performance
const scriptSha = await redis.scriptLoad(rateLimitScript);

// Use cached script (faster)
const allowed2 = await redis.evalsha<number>(scriptSha, ["ratelimit:user:456"], [10, 60]);

// Conditional update script
const setIfHigherScript = `
  local key = KEYS[1]
  local newValue = tonumber(ARGV[1])
  local current = tonumber(redis.call('GET', key) or 0)
  
  if newValue > current then
    redis.call('SET', key, newValue)
    return 1
  end
  
  return 0
`;

const updated = await redis.eval<number>(setIfHigherScript, ["high_score:user:123"], [1500]);

console.log(updated === 1 ? "New high score!" : "Score not higher");
```
