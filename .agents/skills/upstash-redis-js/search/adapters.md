# Adapters

## Overview

`@upstash/redis` works over HTTP, which is ideal for serverless environments. If you need TCP-based connections (e.g., long-running servers with `redis` or `ioredis`), use the adapter packages `@upstash/search-redis` and `@upstash/search-ioredis`. They provide the exact same search API.

## Packages

| Package                   | Client     | Protocol  | Install                                       |
| ------------------------- | ---------- | --------- | --------------------------------------------- |
| `@upstash/redis`          | Built-in   | HTTP/REST | `npm install @upstash/redis`                  |
| `@upstash/search-redis`   | node-redis | TCP       | `npm install @upstash/search-redis redis`     |
| `@upstash/search-ioredis` | ioredis    | TCP       | `npm install @upstash/search-ioredis ioredis` |

## Examples

### With @upstash/redis (HTTP)

```typescript
import { Redis, s } from "@upstash/redis";

const redis = Redis.fromEnv();

const index = await redis.search.createIndex({
  name: "products",
  prefix: "product:",
  dataType: "json",
  schema: s.object({ name: s.string(), price: s.number("F64") }),
});

const results = await index.query({
  filter: { name: { $eq: "laptop" } },
  select: { name: true, price: true },
});
```

### With node-redis (TCP)

```typescript
import { createClient } from "redis";
import { createSearch, s } from "@upstash/search-redis";

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const search = createSearch(client);

const index = await search.createIndex({
  name: "products",
  prefix: "product:",
  dataType: "json",
  schema: s.object({ name: s.string(), price: s.number("F64") }),
});

const results = await index.query({
  filter: { name: { $eq: "laptop" } },
  select: { name: true, price: true },
});

await client.disconnect();
```

### With ioredis (TCP)

```typescript
import IORedis from "ioredis";
import { createSearch, s } from "@upstash/search-ioredis";

const ioredis = new IORedis(process.env.REDIS_URL);

const search = createSearch(ioredis);

const index = await search.createIndex({
  name: "products",
  prefix: "product:",
  dataType: "json",
  schema: s.object({ name: s.string(), price: s.number("F64") }),
});

const results = await index.query({
  filter: { name: { $eq: "laptop" } },
  select: { name: true, price: true },
});

await ioredis.disconnect();
```

## API Parity

All three packages expose identical search APIs:

- `search.createIndex()` / `createSearch(client).createIndex()`
- `search.index()` / `createSearch(client).index()`
- `search.alias.list()`, `search.alias.add()`, `search.alias.delete()`
- `index.query()`, `index.aggregate()`, `index.count()`
- `index.describe()`, `index.drop()`, `index.waitIndexing()`
- `index.addAlias()`

The only difference is initialization. The `s` schema builder is re-exported from all packages.
