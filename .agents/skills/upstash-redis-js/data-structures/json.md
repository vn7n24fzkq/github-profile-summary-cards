# JSON

## Overview

JSON data type stores JSON documents with support for nested objects and arrays. It enables operations on specific paths within the document using JSONPath syntax.

## Good For

- Complex nested objects
- Document storage (user profiles, product catalogs)
- Partial updates of large objects
- Querying nested data

## Limitations

- Maximum document size: 512 MB
- JSONPath queries have performance cost on deeply nested structures
- Some JSONPath features may not be supported

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Set entire JSON document
await redis.json.set("user:1", "$", {
  name: "Alice",
  age: 30,
  email: "alice@example.com",
  address: {
    city: "New York",
    country: "USA",
    zip: "10001",
  },
  hobbies: ["reading", "coding"],
  metadata: {
    registered: "2024-01-15",
    verified: true,
  },
});

// Get entire document
const user = await redis.json.get("user:1");
// Returns the full object

// Get specific path
const name = await redis.json.get("user:1", "$.name"); // ["Alice"]
const city = await redis.json.get("user:1", "$.address.city"); // ["New York"]

// Get multiple paths
const details = await redis.json.get("user:1", "$.name", "$.email");
// { "$.name": ["Alice"], "$.email": ["alice@example.com"] }

// Set nested field
await redis.json.set("user:1", "$.address.city", "San Francisco");

// Set multiple fields (overwrites at path)
await redis.json.set("user:1", "$.metadata", {
  registered: "2024-01-15",
  verified: true,
  lastLogin: "2024-01-23",
});

// Type-specific operations on JSON
await redis.json.set("product:1", "$", {
  name: "Laptop",
  price: 999.99,
  stock: 50,
  tags: ["electronics", "computers"],
});

// Increment numeric field
await redis.json.numincrby("product:1", "$.price", 100); // 1099.99
await redis.json.numincrby("product:1", "$.stock", -5); // 45

// String append
await redis.json.strappend("product:1", "$.name", " Pro"); // "Laptop Pro"

// Get string length
const nameLength = await redis.json.strlen("product:1", "$.name"); // [10]

// Array operations
await redis.json.set("cart:1", "$", {
  items: ["item1", "item2"],
  quantities: [1, 2],
});

// Append to array
await redis.json.arrappend("cart:1", "$.items", "item3", "item4");
// items: ["item1", "item2", "item3", "item4"]

// Insert into array at index
await redis.json.arrinsert("cart:1", "$.items", 1, "item-new");
// items: ["item1", "item-new", "item2", "item3", "item4"]

// Get array length
const itemCount = await redis.json.arrlen("cart:1", "$.items"); // [5]

// Get element by index
const firstItem = await redis.json.arrindex("cart:1", "$.items", "item1"); // [0]

// Pop from array
const lastItem = await redis.json.arrpop("cart:1", "$.items"); // ["item4"]
const firstFromItems = await redis.json.arrpop("cart:1", "$.items", 0); // ["item1"]

// Trim array to range
await redis.json.arrtrim("cart:1", "$.items", 0, 1); // Keep first 2 elements

// Object operations
await redis.json.set("config:1", "$", {
  database: { host: "localhost", port: 5432 },
  cache: { enabled: true },
});

// Get object keys
const dbKeys = await redis.json.objkeys("config:1", "$.database");
// [["host", "port"]]

// Get object length (number of keys)
const dbKeyCount = await redis.json.objlen("config:1", "$.database"); // [2]

// Delete path
await redis.json.del("user:1", "$.metadata.lastLogin");

// Delete entire document
await redis.json.del("user:1");

// Type checking
await redis.json.set("data:1", "$", { str: "hello", num: 42, bool: true, arr: [1, 2] });
const type = await redis.json.type("data:1", "$.num"); // ["number"]
```
