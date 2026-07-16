# Querying & Counting

## Overview

Query documents from a search index using type-safe filters with support for pagination, sorting, field selection, scoring, and highlighting. Count matching documents efficiently without returning results.

## Good For

- Full-text search with fuzzy matching and phrase queries
- Filtering by numeric ranges, dates, booleans, keywords
- Paginated results with sorting
- Highlighting search terms in results
- Counting documents matching a filter

## Examples

### Basic Query

```typescript
import { Redis, s } from "@upstash/redis";

const redis = Redis.fromEnv();

const index = await redis.search.createIndex({
  name: "products",
  prefix: "product:",
  dataType: "json",
  schema: s.object({
    name: s.string(),
    price: s.number("F64"),
    category: s.keyword(),
    inStock: s.boolean(),
  }),
});

// Insert data
await redis.json.set("product:1", "$", {
  name: "Gaming Laptop",
  price: 1299.99,
  category: "electronics",
  inStock: true,
});
await redis.json.set("product:2", "$", {
  name: "Wireless Mouse",
  price: 29.99,
  category: "electronics",
  inStock: true,
});
await redis.json.set("product:3", "$", {
  name: "Laptop Stand",
  price: 49.99,
  category: "accessories",
  inStock: false,
});
await index.waitIndexing();

// Query with filter and return data
const results = await index.query({
  filter: { category: { $eq: "electronics" } },
  select: { name: true, price: true },
});
// [
//   { key: "product:1", score: ..., data: { name: "Gaming Laptop", price: 1299.99 } },
//   { key: "product:2", score: ..., data: { name: "Wireless Mouse", price: 29.99 } },
// ]
```

### Keys Only (No Data)

```typescript
// Set select to {}
const keysOnly = await index.query({
  filter: { inStock: { $eq: true } },
  select: {},
});
// [{ key: "product:1", score: ... }, { key: "product:2", score: ... }]
```

### Pagination

```typescript
const page2 = await index.query({
  filter: { category: { $eq: "electronics" } },
  select: { name: true },
  limit: 10,
  offset: 10, // skip first 10 results
});
```

### Sorting

```typescript
const cheapest = await index.query({
  filter: { inStock: { $eq: true } },
  select: { name: true, price: true },
  orderBy: { price: "ASC" },
});
```

### Score Function

```typescript
// Rank by relevance with a score modifier
const results = await index.query({
  filter: { name: { $eq: "laptop" } },
  select: { name: true },
  scoreFunc: { field: "name", modifier: "log1p" },
});
// Available modifiers: log, log1p, log2p, ln, ln1p, ln2p, square, sqrt, reciprocal, none
```

### Highlighting

```typescript
const highlighted = await index.query({
  filter: { name: { $eq: "laptop" } },
  select: { name: true },
  highlight: {
    fields: ["name"],
    preTag: "<mark>", // optional, default <em>
    postTag: "</mark>", // optional, default </em>
  },
});
// data.name: "Gaming <mark>Laptop</mark>"
```

## Filter Operators

### Text Field Filters

```typescript
// Exact substring match
{ name: { $eq: "laptop" } }

// Multiple values (OR)
{ name: { $in: ["laptop", "tablet"] } }

// Fuzzy matching (typo tolerance)
{ name: { $fuzzy: { value: "lapto", distance: 1 } } }

// Phrase matching (adjacent words with tolerance)
{ name: { $phrase: { value: "gaming laptop", slop: 1 } } }

// Regex pattern
{ name: { $regex: "lap.*" } }

// Smart matching (automatic fuzzy + phrase + term)
{ name: { $smart: "gaming laptop" } }
```

### Numeric Field Filters

```typescript
// Exact value
{ price: { $eq: 29.99 } }

// Range
{ price: { $gte: 10, $lte: 100 } }

// Greater/less than
{ price: { $gt: 50 } }
{ stock: { $lt: 10 } }
```

### Boolean Field Filters

```typescript
{
  inStock: {
    $eq: true;
  }
}
{
  inStock: {
    $in: [true, false];
  }
}
```

### Date Field Filters

```typescript
{ createdAt: { $gte: "2024-01-01", $lt: "2025-01-01" } }
```

### Keyword Field Filters

```typescript
// Exact match
{ category: { $eq: "electronics" } }

// Multiple values
{ category: { $in: ["electronics", "accessories"] } }

// Lexicographic range
{ category: { $gte: "a", $lt: "m" } }
```

### Facet Field Filters

```typescript
{
  brand: {
    $eq: "Apple";
  }
}
{
  brand: {
    $in: ["Apple", "Samsung"];
  }
}
```

## Boolean Operators

Combine filters using boolean operators:

```typescript
// AND - all conditions must match
{
  $and: [
    { category: { $eq: "electronics" } },
    { price: { $lte: 500 } },
  ]
}

// OR - any condition matches
{
  $or: [
    { category: { $eq: "electronics" } },
    { category: { $eq: "accessories" } },
  ]
}

// MUST + MUST NOT - require some, exclude others
{
  $must: [{ category: { $eq: "electronics" } }],
  $mustNot: [{ inStock: { $eq: false } }],
}

// MUST + SHOULD - required conditions + optional boosters
{
  $must: [{ category: { $eq: "electronics" } }],
  $should: [{ name: { $eq: "premium" } }], // boosts score if matched
}

// SHOULD alone - at least one must match (acts like OR)
{
  $should: [
    { name: { $eq: "laptop" } },
    { name: { $eq: "tablet" } },
  ]
}
```

### Common mistake: `$should` next to `$must` does NOT filter

Adding `$must` silently turns sibling `$should` clauses into **score boosters only** —
documents are *not* required to match them. Membership is decided entirely by `$must`,
so the query "always finds something" even for nonsense terms (matches come back, just
with a low score). This is the most common search bug.

```typescript
// ❌ WRONG: the term only boosts; every in-stock doc still matches via $must,
// so a nonsensical searchTerm still returns results (with low scores).
{
  $must: { inStock: { $eq: true } },
  $should: [
    { name: { $smart: searchTerm }, $boost: 10 },
    { description: { $smart: searchTerm }, $boost: 5 },
  ],
}

// ✅ RIGHT: require a match in at least one field by nesting the OR ($should
// alone acts as OR) inside $must. $boost still ranks name above description.
{
  $must: [
    { inStock: { $eq: true } },
    {
      $should: [
        { name: { $smart: searchTerm }, $boost: 10 },
        { description: { $smart: searchTerm }, $boost: 5 },
      ],
    },
  ],
}
```

> There is no minimum-score / cutoff option on `query()`. Don't filter by the returned
> `score` (scores are relative and shift with `$boost`, so a fixed threshold isn't
> reliable) — instead make the term required as above so non-matches are excluded.

### Boosting

Boost the score of specific conditions:

```typescript
{
  $must: [
    { name: { $eq: "laptop", $boost: 2.0 } }, // double the score weight
    { category: { $eq: "electronics", $boost: 0.5 } },
  ];
}
```

## Counting

Count matching documents without returning them:

```typescript
const { count } = await index.count({
  filter: { category: { $eq: "electronics" } },
});
// count: 2
```
