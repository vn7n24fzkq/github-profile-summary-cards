# Data Serialization and Deserialization

## Overview

Automatic serialization preserves JavaScript types across Redis operations. Numbers stay numbers, objects stay objects, arrays stay arrays.

## Good For

- Storing any JavaScript value without JSON.stringify/parse
- Type preservation across GET/SET
- Cleaner code (no manual serialization)
- Storing numbers, booleans, objects, arrays, null

## Limitations

- undefined, functions, symbols cannot be serialized
- Date objects serialize as ISO strings
- Class instances lose their prototype
- Map and Set serialize to `{}` (their contents are lost) — convert to a plain object/array first
- Binary data requires special handling

## Examples

### Basic Type Preservation

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Numbers preserved
await redis.set("age", 42);
const age = await redis.get("age");
console.log(typeof age); // "number"
console.log(age === 42); // true

// Compare with other SDKs
// ioredis: returns "42" (string)
// @upstash/redis: returns 42 (number)

// Booleans preserved
await redis.set("active", true);
const active = await redis.get("active");
console.log(typeof active); // "boolean"

// Objects preserved
await redis.set("user", { name: "Alice", age: 30 });
const user = await redis.get("user");
console.log(user.name); // "Alice"
console.log(user.age); // 30 (number, not string)

// Arrays preserved
await redis.set("scores", [100, 200, 300]);
const scores = await redis.get<number[]>("scores");
console.log(scores[0]); // 100 (number)

// Nested structures preserved
await redis.set("data", {
  user: { name: "Alice", age: 30 },
  scores: [100, 200, 300],
  active: true,
  count: 42,
});

const data = await redis.get<any>("data");
console.log(typeof age); // "number"
console.log(Array.isArray(data.scores)); // true
```

### Complex Types

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Date objects become ISO strings
await redis.set("created", new Date());
const created = await redis.get<string>("created");
console.log(typeof created); // "string"
console.log(created); // "2024-01-01T00:00:00.000Z"

// Convert back to Date
const createdDate = new Date(created);

// Class instances lose prototype
class User {
  constructor(public name: string) {}
  greet() {
    return `Hello, ${this.name}`;
  }
}

const alice = new User("Alice");
await redis.set("instance", alice);

const retrieved = await redis.get<any>("instance");
console.log(retrieved.name); // "Alice"
console.log(retrieved.greet); // undefined (method lost)

// Solution: serialize/deserialize manually
class SerializableUser {
  constructor(public name: string) {}

  static toRedis(user: SerializableUser) {
    return { name: user.name };
  }

  static fromRedis(data: any) {
    return new SerializableUser(data.name);
  }
}

await redis.set("ser_user", SerializableUser.toRedis(alice));
const serRetrieved = SerializableUser.fromRedis(await redis.get("ser_user"));
```

### Disabling Auto-Serialization

```typescript
import { Redis } from "@upstash/redis";

// Disable auto-serialization if needed
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  automaticDeserialization: false,
});

await redis.set("key", JSON.stringify({ value: 42 }));
const raw = await redis.get("key");
console.log(typeof raw); // "string"
const parsed = JSON.parse(raw as string);
```
