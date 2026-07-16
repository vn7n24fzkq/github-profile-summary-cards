# Redis Search

## Overview

Redis Search is a full-text search and secondary indexing extension for Upstash Redis. It provides powerful APIs for querying, filtering, and aggregating data stored in Redis keys. Built on Tantivy, it supports text search with stemming, fuzzy matching, faceted navigation, and complex aggregations.

## Good For

- Full-text search over Redis data (strings, JSON, hashes)
- Filtering and sorting with type-safe queries
- Aggregations and analytics (averages, histograms, facets)
- Autocomplete and typo-tolerant search
- Faceted navigation (e-commerce categories, filters)

## Packages

- `@upstash/redis` - The primary SDK. Access search via `redis.search` (works over HTTP)
- `@upstash/search-redis` - Adapter for the `redis` (node-redis) TCP client
- `@upstash/search-ioredis` - Adapter for the `ioredis` TCP client

All three packages expose the same search API. See [adapters.md](./adapters.md) for TCP client setup.

## Schema

Schemas define which fields are indexed and how. Use the `s` schema builder for type-safe definitions:

```typescript
import { Redis, s } from "@upstash/redis";

const redis = Redis.fromEnv();

const index = await redis.search.createIndex({
  name: "products",
  prefix: "product:",
  dataType: "json",
  schema: s.object({
    name: s.string(), // TEXT - full-text searchable
    description: s.string().noStem(), // TEXT without stemming
    sku: s.string().noTokenize(), // TEXT stored as-is (no splitting)
    price: s.number("F64"), // floating point number
    stock: s.number("U64"), // unsigned 64-bit integer
    inStock: s.boolean(), // boolean
    createdAt: s.date(), // date
    category: s.keyword(), // exact-match keyword
    brand: s.facet(), // facet for aggregations
  }),
});
```

### Field Types

| Builder        | Redis Type  | TypeScript | Use Case                         |
| -------------- | ----------- | ---------- | -------------------------------- |
| `s.string()`   | TEXT        | `string`   | Full-text searchable text        |
| `s.number()`   | F64/U64/I64 | `number`   | Numeric values, ranges           |
| `s.boolean()`  | BOOL        | `boolean`  | True/false filtering             |
| `s.date()`     | DATE        | `string`   | Date range queries               |
| `s.keyword()`  | KEYWORD     | `string`   | Exact match, lexicographic range |
| `s.facet()`    | FACET       | `string`   | Faceted aggregations             |
| `s.object({})` | (nested)    | `object`   | Nested field groups              |

### Field Options

- `.noTokenize()` - (TEXT only) Don't split on whitespace/punctuation. Use for SKUs, URLs, emails
- `.noStem()` - (TEXT only) Don't reduce words to stems. Use for brand names, proper nouns
- `.fast()` - (BOOL, DATE) Enable fast filtering
- `.from("fieldName")` - Map index field to a different field name in the stored data

### Data Types

- `"json"` - Index JSON documents stored with `redis.json.set()` or `redis.set()`. Supports nested schemas with `s.object()`
- `"string"` - Index JSON strings stored with `redis.set()`. Supports nested schemas
- `"hash"` - Index Redis hashes stored with `redis.hset()`. Flat schemas only (no nesting)

## Commands

For detailed usage of each command category, see:

- [commands/querying.md](./commands/querying.md) - Query and count documents with filters, pagination, sorting, highlighting
- [commands/aggregating.md](./commands/aggregating.md) - Aggregations: metrics ($avg, $sum, $min, $max), buckets ($terms, $range, $histogram), facets
- [commands/index-management.md](./commands/index-management.md) - Create, describe, drop indexes; wait for indexing
- [commands/aliases.md](./commands/aliases.md) - Manage index aliases for zero-downtime reindexing

## Pitfalls

### Data is upserted with regular Redis commands, not through search

There is no `index.upsert()` or `index.add()` method. You store data using standard Redis commands (`set`, `json.set`, `hset`), and the search index automatically picks up keys matching its prefix.

```typescript
// Create the index
const index = await redis.search.createIndex({
  name: "users",
  prefix: "user:",
  dataType: "json",
  schema: s.object({ name: s.string(), age: s.number("U64") }),
});

// Upsert data with regular Redis commands
await redis.json.set("user:1", "$", { name: "Alice", age: 30 });
await redis.json.set("user:2", "$", { name: "Bob", age: 25 });

// Wait for the index to process the new data
await index.waitIndexing();

// Now you can query
const results = await index.query({
  filter: { name: { $eq: "Alice" } },
});
```

### Always call waitIndexing after data changes

Index updates are batched. After upserting or deleting data, the index may not immediately reflect the changes. Call `waitIndexing()` to block until all pending documents are processed.

```typescript
// Batch upsert many documents
for (const product of products) {
  await redis.json.set(`product:${product.id}`, "$", product);
}

// Call waitIndexing ONCE after all upserts (not after each one)
await index.waitIndexing();

// Now queries will return up-to-date results
const results = await index.query({ filter: { category: { $eq: "electronics" } } });
```

### Tokenization splits text at word boundaries

TEXT fields are tokenized by default: `"hello-world"` becomes `["hello", "world"]`. An `$eq` filter for `"hello-world"` matches because it finds the substring. But if you need exact matching of the full string (e.g., SKUs, URLs), use `.noTokenize()`.

### Stemming reduces words to roots

By default, TEXT fields apply language-specific stemming: `"running"` is stored as `"run"`. This means `$regex` patterns won't match the original form. Disable with `.noStem()` for brand names or when you need exact word forms.

### $mustNot cannot be used alone

`$mustNot` filters only exclude documents. Using `$mustNot` alone returns no results. Always combine it with `$must` or `$should`:

```typescript
// Won't work - returns nothing
{ $mustNot: [{ status: { $eq: "archived" } }] }

// Correct - exclude within a broader match
{ $must: [{ category: { $eq: "electronics" } }], $mustNot: [{ status: { $eq: "archived" } }] }
```

### SCOREFUNC and ORDERBY are mutually exclusive

You cannot use `scoreFunc` and `orderBy` in the same query. Use `orderBy` for deterministic sorting, `scoreFunc` for relevance-based ranking.

## Resources

- [Upstash Redis Search documentation](https://upstash.com/docs/redis/search)
