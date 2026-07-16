# Aggregations

## Overview

Run analytics over indexed data using metric and bucket aggregations. Compute statistics, group documents, build histograms, and perform faceted navigation. Aggregations can be nested for multi-level analysis.

## Good For

- Computing averages, sums, min/max across documents
- Grouping documents by field values (category breakdown)
- Building price range facets for e-commerce
- Histogram distributions (price ranges, date ranges)
- Multi-level analytics (average price per category)

## Examples

### Metric Aggregations

```typescript
import { Redis, s } from "@upstash/redis";

const redis = Redis.fromEnv();

const index = await redis.search.createIndex({
  name: "orders",
  prefix: "order:",
  dataType: "json",
  schema: s.object({
    product: s.string(),
    category: s.facet(),
    price: s.number("F64"),
    quantity: s.number("U64"),
    date: s.date(),
  }),
});

// Insert sample data
await redis.json.set("order:1", "$", {
  product: "Laptop",
  category: "electronics",
  price: 999.99,
  quantity: 1,
  date: "2024-06-15",
});
await redis.json.set("order:2", "$", {
  product: "Mouse",
  category: "electronics",
  price: 29.99,
  quantity: 3,
  date: "2024-06-16",
});
await redis.json.set("order:3", "$", {
  product: "Desk",
  category: "furniture",
  price: 249.99,
  quantity: 1,
  date: "2024-07-01",
});
await index.waitIndexing();

// Average price
const result = await index.aggregate({
  aggregations: {
    avg_price: { $avg: { field: "price" } },
  },
});
// result.avg_price -> number

// Multiple metrics at once
const stats = await index.aggregate({
  aggregations: {
    avg_price: { $avg: { field: "price" } },
    total_revenue: { $sum: { field: "price" } },
    cheapest: { $min: { field: "price" } },
    most_expensive: { $max: { field: "price" } },
    order_count: { $count: { field: "price" } },
  },
});

// Combined statistics
const priceStats = await index.aggregate({
  aggregations: {
    price_stats: { $stats: { field: "price" } },
    // Returns: { count, min, max, sum, avg }
  },
});

// Extended statistics (includes variance and standard deviation)
const extended = await index.aggregate({
  aggregations: {
    price_extended: { $extendedStats: { field: "price" } },
    // Returns: { count, min, max, sum, avg, sumOfSquares, variance, stdDeviation }
  },
});

// Percentiles
const percentiles = await index.aggregate({
  aggregations: {
    price_percentiles: { $percentiles: { field: "price", percents: [25, 50, 75, 95] } },
  },
});

// Count distinct values
const uniqueCategories = await index.aggregate({
  aggregations: {
    unique_cats: { $cardinality: { field: "category" } },
  },
});
```

### Bucket Aggregations

#### $terms - Group by field values

```typescript
const byCategory = await index.aggregate({
  aggregations: {
    categories: {
      $terms: { field: "category", size: 10 },
    },
  },
});
// categories.buckets -> [{ key: "electronics", doc_count: 2 }, { key: "furniture", doc_count: 1 }]
```

#### $range - Group by numeric ranges

```typescript
const priceRanges = await index.aggregate({
  aggregations: {
    price_ranges: {
      $range: {
        field: "price",
        ranges: [
          { to: 50 }, // Under $50
          { from: 50, to: 200 }, // $50-$200
          { from: 200 }, // Over $200
        ],
      },
    },
  },
});
```

#### $histogram - Fixed-interval numeric buckets

```typescript
const priceHistogram = await index.aggregate({
  aggregations: {
    price_distribution: {
      $histogram: { field: "price", interval: 100 },
    },
  },
});
```

#### $facet - Faceted navigation

```typescript
const facets = await index.aggregate({
  aggregations: {
    brand_facets: { $facet: { field: "brand" } },
  },
});
```

### Nested Aggregations

Combine buckets with metrics for multi-level analysis:

```typescript
// Average price per category
const result = await index.aggregate({
  aggregations: {
    by_category: {
      $terms: { field: "category" },
      $aggs: {
        avg_price: { $avg: { field: "price" } },
        min_price: { $min: { field: "price" } },
        max_price: { $max: { field: "price" } },
        total_orders: { $count: { field: "price" } },
      },
    },
  },
});
// by_category.buckets -> [
//   { key: "electronics", doc_count: 2, avg_price: 514.99, min_price: 29.99, max_price: 999.99, total_orders: 2 },
//   { key: "furniture", doc_count: 1, avg_price: 249.99, ... },
// ]
```

### Filtered Aggregations

Apply a filter before aggregating:

```typescript
const electronicsStats = await index.aggregate({
  filter: { category: { $eq: "electronics" } },
  aggregations: {
    avg_price: { $avg: { field: "price" } },
    price_ranges: {
      $range: {
        field: "price",
        ranges: [{ to: 100 }, { from: 100, to: 500 }, { from: 500 }],
      },
    },
  },
});
```

## Available Aggregations

### Metric Aggregations

| Aggregation      | Description                                |
| ---------------- | ------------------------------------------ |
| `$avg`           | Average value of a numeric field           |
| `$sum`           | Sum of values                              |
| `$min`           | Minimum value                              |
| `$max`           | Maximum value                              |
| `$count`         | Count of documents                         |
| `$cardinality`   | Count of distinct values                   |
| `$stats`         | Combined count/min/max/sum/avg             |
| `$extendedStats` | Stats + variance/stdDeviation/sumOfSquares |
| `$percentiles`   | Percentile values at specified thresholds  |

### Bucket Aggregations

| Aggregation  | Description                       |
| ------------ | --------------------------------- |
| `$terms`     | Group by field values             |
| `$range`     | Group by custom numeric ranges    |
| `$histogram` | Fixed-interval numeric buckets    |
| `$facet`     | Faceted navigation (hierarchical) |
