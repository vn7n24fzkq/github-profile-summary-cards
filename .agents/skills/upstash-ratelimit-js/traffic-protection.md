# Traffic Protection

This skill documents how to use deny lists and automatic IP protection in the Upstash Ratelimit TypeScript SDK. It explains configuration, behavior, caching, update patterns, and common pitfalls.

---

## Deny Lists

Deny lists block requests based on IP, user agent, country, or identifier. Enable protection by setting `enableProtection: true` when creating your Ratelimit client.

Example usage:

```ts
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  enableProtection: true,
  analytics: true,
});

const result = await ratelimit.limit("userId", {
  ip: "203.0.113.5",
  userAgent: "malicious-bot",
  country: "CN",
});

await result.pending; // analytics sync

if (!result.success && result.reason === "denyList") {
  console.log("Blocked value:", result.deniedValue);
}
```

### Behavior & Pitfalls

- Exact match only; pattern matching is **not supported**.
- Denied values are cached for 1 minute to reduce Redis load. Removal from the deny list may take up to a minute to propagate.
- Adding a value propagates instantly.
- Dashboard manages all deny list entries; analytics can show aggregated blocks.

---

## Auto IP Deny List

Automatically blocks IPs aggregated from >30 open‑source abuse lists (via GitHub's *ipsum* repository). Updates occur daily at **2 AM UTC**.

Enable protection:

```ts
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  enableProtection: true,
});

const { success, pending } = await ratelimit.limit("userId", { ip: "203.0.113.77" });
await pending; // ensures async sync completion
```

### Update Flow

- First call to `limit` after 2 AM UTC triggers asynchronous list refresh.
- Request results are returned immediately; updates complete in the background.
- Use the `pending` promise when accuracy depends on the sync.

### Dashboard Integration

- All auto‑blocked IPs appear in the "Denied" section.
- Feature can be disabled from the Upstash Console without disabling standard deny lists.

---

## Common Mistakes

- Forgetting to pass `ip`, `userAgent`, or `country` to `limit` → protection does not apply.
- Expecting pattern or CIDR matches; only exact strings are checked.
- Confusing auto IP deny list with manual deny list entries; both operate independently.
