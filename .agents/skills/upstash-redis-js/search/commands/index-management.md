# Index Management

## Overview

Create, inspect, and drop search indexes. Wait for indexing to complete after data changes. Indexes automatically track Redis keys matching a specified prefix.

## Good For

- Creating indexes over existing or new Redis data
- Inspecting index schema and configuration
- Rebuilding or dropping indexes
- Ensuring data consistency after bulk writes

## Examples

### Create an Index

```typescript
import { Redis, s } from "@upstash/redis";

const redis = Redis.fromEnv();

// JSON index with nested schema
const index = await redis.search.createIndex({
  name: "products",
  prefix: "product:",
  dataType: "json",
  schema: s.object({
    name: s.string(),
    price: s.number("F64"),
    metadata: s.object({
      brand: s.facet(),
      tags: s.keyword(),
    }),
  }),
});

// Hash index (flat schema only)
const hashIndex = await redis.search.createIndex({
  name: "sessions",
  prefix: "session:",
  dataType: "hash",
  schema: {
    userId: { type: "TEXT" as const },
    lastActive: { type: "DATE" as const },
  },
});
```

### Create with Options

```typescript
const index = await redis.search.createIndex({
  name: "articles",
  prefix: ["article:", "post:"], // multiple prefixes
  dataType: "json",
  language: "english", // stemming language
  skipInitialScan: false, // scan existing keys (default)
  existsOk: true, // don't error if index already exists
  schema: s.object({
    title: s.string(),
    body: s.string().noStem(),
    publishedAt: s.date().fast(),
  }),
});
```

### Get a Reference to an Existing Index

```typescript
// If you already created the index and just need a reference
const index = redis.search.index({
  name: "products",
  schema: s.object({
    name: s.string(),
    price: s.number("F64"),
  }),
});

// Without schema (untyped - no filter/select type safety)
const untypedIndex = redis.search.index({ name: "products" });
```

### Describe an Index

```typescript
const description = await index.describe();
// {
//   name: "products",
//   dataType: "json",
//   prefixes: ["product:"],
//   language: "english",
//   schema: { name: { type: "TEXT" }, price: { type: "F64", fast: true } }
// }

// Returns null if index doesn't exist
const missing = await redis.search.index({ name: "nonexistent" }).describe();
// null
```

### Wait for Indexing

```typescript
// After inserting/updating/deleting data, wait for index to catch up
await redis.json.set("product:1", "$", { name: "Laptop", price: 999 });
await redis.json.set("product:2", "$", { name: "Mouse", price: 29 });
await redis.json.set("product:3", "$", { name: "Keyboard", price: 79 });

await index.waitIndexing(); // blocks until all pending docs are indexed

// Queries now reflect the latest data
const results = await index.query({ filter: { name: { $eq: "Laptop" } } });
```

### Drop an Index

```typescript
const result = await index.drop();
// 1 if dropped, 0 if index didn't exist
```

### Supported Languages

For stemming: `english`, `french`, `spanish`, `portuguese`, `italian`, `german`, `dutch`, `swedish`, `norwegian`, `danish`, `finnish`, `hungarian`, `russian`, `romanian`, `turkish`, `arabic`, `chinese`, `japanese`
