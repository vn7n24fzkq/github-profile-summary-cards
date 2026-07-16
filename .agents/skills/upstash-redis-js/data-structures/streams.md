# Streams

## Overview

Streams are append-only logs of entries with unique IDs. They support consumer groups for distributed processing and delivery guarantees.

## Good For

- Event sourcing
- Activity logs
- Message queues with multiple consumers
- Real-time data feeds
- Chat systems

## Limitations

- Entries cannot be modified after insertion
- Memory grows unbounded unless trimmed
- Maximum stream length: practical limits based on memory

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Add entry to stream (auto-generated ID)
const id1 = await redis.xadd("events", "*", {
  type: "user.login",
  userId: "123",
  timestamp: Date.now(),
});
// Returns ID like "1642424242424-0"

// Add with specific ID (timestamp-sequence format)
const id2 = await redis.xadd("events", "1642424242424-1", {
  type: "user.logout",
  userId: "123",
});

// Add with trim (limit stream size)
await redis.xadd(
  "events",
  "*",
  { event: "test" },
  {
    trim: {
      type: "MAXLEN",
      comparison: "=",
      threshold: 1000,
    },
  }
);

// Add with approximate trim (more efficient)
await redis.xadd(
  "events",
  "*",
  { event: "test" },
  {
    trim: {
      type: "MAXLEN",
      comparison: "~",
      threshold: 1000,
    },
  }
);

// Get stream length
const length = await redis.xlen("events");

// Read entries from stream
const entries = await redis.xread("events", "0", { count: 10 });
// Returns: [{ name: "events", messages: [{ id: "...", message: {...} }] }]

// Read latest entries
const latest = await redis.xread("events", "$"); // $ means new entries only

// Read from multiple streams
const multi = await redis.xread(["stream1", "stream2"], ["0", "0"]);

// Note: Blocking (BLOCK option) is not yet supported in Upstash Redis

// Get range of entries by ID
const range = await redis.xrange("events", "-", "+"); // All entries
const specific = await redis.xrange("events", "1642424242424-0", "1642424242424-1");
const last10 = await redis.xrevrange("events", "+", "-", 10); // Last 10 in reverse

// Create consumer group
await redis.xgroup("events", {
  type: "CREATE",
  group: "processors",
  id: "0",
  options: { MKSTREAM: true },
});
// Creates group "processors" starting from beginning

// Read as consumer group member
const groupEntries = await redis.xreadgroup(
  "processors", // group name
  "consumer1", // consumer name
  "events", // stream key
  ">", // > means undelivered messages
  { count: 5 }
);

// Acknowledge processed messages
if (groupEntries && groupEntries[0]) {
  const messages = (groupEntries[0] as any)[1] as Array<{ 0: string; 1: any }>;
  if (messages && messages.length > 0) {
    const messageIds = messages.map((m) => m[0]);
    await redis.xack("events", "processors", messageIds);
  }
}

// Get pending messages (delivered but not acknowledged)
const pending = await redis.xpending("events", "processors", "-", "+", 10);
// Returns pending entry details

// Get detailed pending info for specific consumer
const pendingDetails = await redis.xpending(
  "events", // stream key
  "processors", // group
  "-", // start
  "_+", // end
  10, // count
  { consumer: "consumer1" } // optional: specific consumer
);

// Claim pending messages (take over from another consumer)
const claimed = await redis.xclaim(
  "events", // stream key
  "processors", // group
  "consumer2", // new owner (consumer)
  3600000, // min idle time (ms)
  "1642424242424-0" // message ID(s) to claim
);

// Delete messages
await redis.xdel("events", [id1, id2]);

// Trim stream to maximum length
await redis.xtrim("events", { strategy: "MAXLEN", threshold: 1000, exactness: "=" });
await redis.xtrim("events", { strategy: "MAXLEN", threshold: 1000, exactness: "~" }); // Approximate (more efficient)

// Get consumer group info
const groups = await redis.xinfo("events", { type: "GROUPS" });
// Returns list of consumer groups

// Get consumers in group
const consumers = await redis.xinfo("events", { type: "CONSUMERS", group: "processors" });
// Returns list of consumers and their stats

// Delete consumer from group
await redis.xgroup("events", {
  type: "DELCONSUMER",
  group: "processors",
  consumer: "consumer1",
});

// Delete consumer group
await redis.xgroup("events", { type: "DESTROY", group: "processors" });

// Practical example: Event log with processing
await redis.xadd("orders", "*", {
  orderId: "order-123",
  status: "pending",
  amount: 99.99,
});

// Create processor group
await redis.xgroup("orders", {
  type: "CREATE",
  group: "order-processors",
  id: "0",
  options: { MKSTREAM: true },
});

// Worker reads and processes
const orders = await redis.xreadgroup("order-processors", "worker-1", "orders", ">", {
  count: 1,
});

if (orders && orders[0]) {
  const messages = (orders[0] as any)[1] as Array<{ 0: string; 1: any }>;
  if (messages && messages.length > 0) {
    const order = messages[0];
    // Process order...
    console.log("Processing:", order[1]);

    // Acknowledge when done
    await redis.xack("orders", "order-processors", order[0]);
  }
}
```
