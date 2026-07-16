# Error Handling

## Overview

Handle Redis errors gracefully with try-catch, implement retry logic for transient failures, and provide fallbacks for degraded operation.

## Good For

- Network failure recovery
- Timeout handling
- Graceful degradation
- Debugging and monitoring
- Production reliability

## Limitations

- Some errors are not recoverable
- Retries can increase latency
- Too many retries may cause cascading failures

## Examples

### Built-in Retry Configuration

```typescript
import { Redis } from "@upstash/redis";

// Default: 5 retries with exponential backoff
const redis = Redis.fromEnv();

// Customize retry behavior
const redisWithRetry = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.exp(retryCount) * 50, // Exponential backoff
  },
});

// Disable retries
const redisNoRetry = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  retry: false, // No retries
});

// Custom backoff strategy
const redisCustomBackoff = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  retry: {
    retries: 10,
    backoff: (retryCount) => {
      // Linear backoff: 100ms, 200ms, 300ms...
      return retryCount * 100;
    },
  },
});
```

### Request Cancellation with AbortSignal

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const redisWithTimeout = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  signal: () => AbortSignal.timeout(5000), // 5 second timeout per request
});

try {
  await redisWithTimeout.get("key");
} catch (error) {
  if (error.name === "TimeoutError") {
    console.error("Request timed out");
  }
}
```

### Error Types

All SDK error classes are importable from `@upstash/redis`:

| Error | `error.name` | When it's thrown |
| --- | --- | --- |
| `UpstashError` | `"UpstashError"` | A command failed server-side, or the REST response contained an `error` field. The base error type. |
| `UpstashJSONParseError` | `"UpstashJSONParseError"` | The response body could not be parsed as JSON. Extends `UpstashError`. |
| `UrlError` | `"UrlError"` | The client was constructed with an invalid URL (must start with `https`). Thrown synchronously at construction, before any request. |
| `TimeoutError` | `"TimeoutError"` | A request was aborted by an `AbortSignal.timeout(...)`. This is the native DOM error, not an SDK class. |

```typescript
import { Redis, UpstashError } from "@upstash/redis";

try {
  await redis.get("key");
} catch (error) {
  if (error instanceof UpstashError) {
    // command failed or bad request to Upstash
    console.error("Upstash command failed:", error.message);
  } else if (error.name === "TimeoutError") {
    console.error("Request timed out");
  } else {
    throw error;
  }
}
```

Because `UpstashJSONParseError extends UpstashError`, a single `instanceof UpstashError` check catches both. `UrlError` is thrown when you construct the client, so it surfaces at startup rather than inside request `try/catch` blocks.

### Debugging

- **Read the message — it includes the failed command.** `UpstashError` messages are formatted like `<server error>, command was: ["GET","key"]`, so logging `error.message` shows exactly what was sent.
- **`UrlError` at startup** almost always means a missing or typo'd `UPSTASH_REDIS_REST_URL` (it must start with `https://`). Verify env vars before suspecting the network.
- **Retryable vs. fatal.** Network and `TimeoutError` failures are transient and already covered by the built-in `retry`. An `UpstashError` from a bad command (wrong argument types, `WRONGTYPE`, unknown command) is deterministic — retrying won't help, so fix the call instead of raising the retry count.
