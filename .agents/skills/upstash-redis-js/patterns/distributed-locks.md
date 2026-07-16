# Distributed Locks

## Overview

Distributed locks prevent concurrent access to shared resources across multiple processes or servers. Use SET NX with expiration for simple locking.

## Good For

- Preventing duplicate job execution
- Ensuring only one process modifies a resource
- Rate limiting at system level
- Coordinating distributed operations

## Limitations

- Lock holder must complete before TTL expires
- No automatic lock release on crash (relies on TTL)
- Use @upstash/lock for production (implements Redlock)

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Simple lock with SET NX
async function acquireLock(lockKey: string, ttl: number = 10): Promise<boolean> {
  const acquired = await redis.set(lockKey, "locked", {
    nx: true, // Only set if not exists
    ex: ttl, // Expire after ttl seconds
  });

  return acquired === "OK";
}

async function releaseLock(lockKey: string) {
  await redis.del(lockKey);
}

// Use lock pattern
async function processJob(jobId: string) {
  const lockKey = `lock:job:${jobId}`;

  const acquired = await acquireLock(lockKey, 30);

  if (!acquired) {
    console.log("Job already being processed");
    return;
  }

  try {
    // Do work
    await performJobWork(jobId);
  } finally {
    await releaseLock(lockKey);
  }
}

// Lock with unique token (prevents accidental unlock by others)
async function acquireLockWithToken(lockKey: string, token: string, ttl: number = 10) {
  const acquired = await redis.set(lockKey, token, { nx: true, ex: ttl });
  return acquired === "OK";
}

async function releaseLockWithToken(lockKey: string, token: string) {
  // Only delete if token matches (using Lua script)
  const script = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

  return await redis.eval<number>(script, [lockKey], [token]);
}

// Usage with token
async function processWithTokenLock(jobId: string) {
  const lockKey = `lock:job:${jobId}`;
  const token = crypto.randomUUID();

  const acquired = await acquireLockWithToken(lockKey, token, 30);

  if (!acquired) return;

  try {
    await performJobWork(jobId);
  } finally {
    await releaseLockWithToken(lockKey, token);
  }
}

// Lock with retry
async function acquireLockWithRetry(
  lockKey: string,
  ttl: number = 10,
  retries: number = 3,
  delay: number = 100
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    const acquired = await acquireLock(lockKey, ttl);
    if (acquired) return true;

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return false;
}

// Prevent duplicate webhook processing
async function processWebhook(webhookId: string, data: any) {
  const lockKey = `webhook:${webhookId}`;

  const acquired = await acquireLock(lockKey, 60);

  if (!acquired) {
    console.log("Webhook already processed");
    return { status: "duplicate" };
  }

  try {
    await handleWebhook(data);
    return { status: "processed" };
  } finally {
    await releaseLock(lockKey);
  }
}
```
