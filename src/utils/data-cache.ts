// Shared GitHub-data cache backed by Upstash Redis (Vercel Marketplace).
//
// Why: the Vercel CDN cache is keyed per deployment and per full URL, so every
// deploy starts cold and every theme/color variation of the same card re-hits
// the GitHub API. Caching the *raw data* per username collapses all of those
// into one GitHub fetch, survives deployments, and lets us serve slightly
// stale data instead of an error card while rate limited.
//
// Design constraints:
// - Fail-open: when the KV env vars are missing (Action/CLI/tests) or Redis
//   errors/times out, callers behave exactly as without the cache.
// - Only cache plain-JSON payloads (raw API data), never class instances —
//   aggregation into Maps/Dates happens after the cache boundary.
// - A per-instance circuit breaker stops paying KV timeouts during an outage,
//   and lets features (full-history stats) decide to degrade via isKvHealthy().
// - Concurrent lookups of the same key are coalesced in-instance so a cold
//   cache plus a burst of identical requests fires one fetch, not N.

import {AsyncLocalStorage} from 'async_hooks';

// 12h: with the CDN already serving most viewers up-to-48h-old cards, a
// shorter Redis fresh window buys little visible freshness while doubling the
// GitHub refresh traffic. Halving that traffic is a free-tier budget lever.
const FRESH_SECONDS_DEFAULT = 12 * 60 * 60; // serve without re-fetching
const RETENTION_SECONDS_DEFAULT = 7 * 24 * 60 * 60; // Redis EX — stale kept as a rate-limit fallback
const KV_TIMEOUT_MS = 1500; // never let a slow Redis block a card render

// Circuit breaker: after this many consecutive KV failures (timeouts/errors —
// cache misses are successes), skip all KV I/O for the cooldown period so an
// outage costs ~0ms per key instead of a 1.5s timeout each.
const KV_FAIL_THRESHOLD = 3;
const KV_UNHEALTHY_COOLDOWN_MS = 60 * 1000;

export interface DataCacheOptions {
    freshSeconds?: number;
    retentionSeconds?: number;
    // Pre-read envelopes from primeDataCache — lets a card fetch all its keys
    // with one MGET (one billed command) instead of one GET per key.
    primed?: PrimedReads;
}

interface Envelope<T> {
    at: number; // epoch ms when the data was fetched
    data: T;
}

type KvReadResult<T> = {kind: 'hit'; envelope: Envelope<T>} | {kind: 'miss'} | {kind: 'error'};

// Result of a batched MGET; consumed via DataCacheOptions.primed. Keys absent
// from the map (MGET failed, key not requested) fall back to a per-key GET.
export type PrimedReads = Map<string, KvReadResult<unknown>>;

// Per-request cache-outcome collector. handleCard opens a context with
// runWithCacheStats; every withDataCache call inside it records its outcome so
// the request can report a cache_status analytics dimension. AsyncLocalStorage
// keeps concurrent requests in the same lambda instance isolated.
interface CacheStats {
    fresh: number;
    miss: number;
    stale: number;
}

const cacheStatsStorage = new AsyncLocalStorage<CacheStats>();

/**
 * Runs `fn` with a fresh cache-outcome collector attached to the async context.
 *
 * @param {Function} fn - The request work (usually the card render).
 * @return {Promise} Whatever `fn` resolves to, plus the collected stats.
 */
export async function runWithCacheStats<T>(fn: () => Promise<T>): Promise<{result: T; cacheStatus: string}> {
    const stats: CacheStats = {fresh: 0, miss: 0, stale: 0};
    const result = await cacheStatsStorage.run(stats, fn);
    let cacheStatus = 'disabled';
    if (kvConfigured()) {
        if (stats.stale > 0) cacheStatus = 'stale';
        else if (stats.miss > 0 && stats.fresh > 0) cacheStatus = 'mixed';
        else if (stats.miss > 0) cacheStatus = 'miss';
        else if (stats.fresh > 0) cacheStatus = 'fresh';
        else cacheStatus = 'none';
    }
    return {result, cacheStatus};
}

function recordCacheOutcome(kind: keyof CacheStats): void {
    const stats = cacheStatsStorage.getStore();
    if (stats) stats[kind] += 1;
}

function kvConfigured(): boolean {
    return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

/**
 * Spreads a cache window deterministically per key: baseSeconds ± spreadSeconds,
 * derived from a hash of the key. Keys written in the same burst (e.g. the
 * full-history backfill caching thousands of accounts in one day) would
 * otherwise all expire together and repeat the burst as a re-fetch storm every
 * cycle. Hash-based (not random) so every read and write of the same key — on
 * any lambda instance — agrees on the same window.
 *
 * @param {string} key - The cache key to derive the jitter from.
 * @param {number} baseSeconds - The centre of the window.
 * @param {number} spreadSeconds - Maximum deviation in either direction.
 * @return {number} A stable value in [base - spread, base + spread].
 */
export function jitteredSeconds(key: string, baseSeconds: number, spreadSeconds: number): number {
    // FNV-1a with a murmur3-style finalizer: similar keys (same user, adjacent
    // years) must land far apart, and a plain rolling hash has no avalanche —
    // adjacent inputs map to adjacent fractions and the jitter collapses.
    let h = 0x811c9dc5;
    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    const fraction = (h >>> 0) / 0xffffffff; // stable in [0, 1]
    return Math.round(baseSeconds + (fraction - 0.5) * 2 * spreadSeconds);
}

// ---- circuit breaker state (per lambda instance) ----
// Reads and writes are tracked separately: during a write-only outage (e.g.
// Redis out of memory) reads keep succeeding, and a shared streak would be
// reset before every failing write — the breaker would never open and every
// cold key would pay the full write timeout.
let kvReadFailStreak = 0;
let kvWriteFailStreak = 0;
let kvUnhealthyUntil = 0;

function recordKvSuccess(kind: 'read' | 'write'): void {
    if (kind === 'read') kvReadFailStreak = 0;
    else kvWriteFailStreak = 0;
}

function recordKvFailure(kind: 'read' | 'write'): void {
    const streak = kind === 'read' ? ++kvReadFailStreak : ++kvWriteFailStreak;
    if (streak >= KV_FAIL_THRESHOLD) {
        kvUnhealthyUntil = Date.now() + KV_UNHEALTHY_COOLDOWN_MS;
        kvReadFailStreak = 0; // re-tripping after the cooldown takes a fresh streak
        kvWriteFailStreak = 0;
        console.log(`data-cache: circuit opened for ${KV_UNHEALTHY_COOLDOWN_MS / 1000}s after repeated KV failures`);
    }
}

/**
 * Whether the data cache is usable right now: configured and not in a
 * circuit-breaker cooldown. Features that are only affordable WITH a cache
 * (full-history stats) consult this to pick their degraded mode.
 *
 * @return {boolean} True when KV is configured and believed healthy.
 */
export function isKvHealthy(): boolean {
    return kvConfigured() && Date.now() >= kvUnhealthyUntil;
}

/**
 * Test hook: clears breaker state so suites don't leak failures into each other.
 */
export function resetKvHealthForTests(): void {
    kvReadFailStreak = 0;
    kvWriteFailStreak = 0;
    kvUnhealthyUntil = 0;
}

async function kvGet<T>(key: string): Promise<KvReadResult<T>> {
    try {
        const res = await fetch(`${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`, {
            headers: {Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`},
            signal: AbortSignal.timeout(KV_TIMEOUT_MS)
        });
        if (!res.ok) {
            recordKvFailure('read');
            return {kind: 'error'};
        }
        const body = await res.json();
        recordKvSuccess('read');
        // A miss is a healthy answer, not a failure.
        if (typeof body?.result !== 'string') return {kind: 'miss'};
        return {kind: 'hit', envelope: JSON.parse(body.result) as Envelope<T>};
    } catch (e) {
        recordKvFailure('read');
        return {kind: 'error'};
    }
}

async function kvSet<T>(key: string, envelope: Envelope<T>, retentionSeconds: number): Promise<void> {
    // A read that just opened the breaker shouldn't be followed by a doomed
    // write paying another timeout.
    if (!isKvHealthy()) return;
    try {
        const res = await fetch(
            `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}?EX=${retentionSeconds}`,
            {
                method: 'POST',
                headers: {Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`},
                body: JSON.stringify(envelope),
                signal: AbortSignal.timeout(KV_TIMEOUT_MS)
            }
        );
        if (res.ok) recordKvSuccess('write');
        else recordKvFailure('write');
    } catch (e) {
        // Best-effort write; the card was already rendered from fresh data.
        recordKvFailure('write');
    }
}

/**
 * Reads many cache keys with a single MGET (Upstash bills per command, so this
 * turns N reads into 1). The result feeds withDataCache via options.primed;
 * per-key semantics (fresh/stale/miss, stale rescue) are unchanged. Fail-open:
 * on any KV problem an empty map is returned and callers fall back to per-key
 * reads (which the circuit breaker then short-circuits during an outage).
 *
 * @param {Array<string>} keys - Cache keys to read in one command.
 * @return {Promise<PrimedReads>} Map of key → read result; empty on failure.
 */
export async function primeDataCache(keys: string[]): Promise<PrimedReads> {
    const primed: PrimedReads = new Map();
    if (keys.length === 0 || !kvConfigured() || !isKvHealthy()) return primed;
    try {
        const path = keys.map(encodeURIComponent).join('/');
        const res = await fetch(`${process.env.KV_REST_API_URL}/mget/${path}`, {
            headers: {Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`},
            signal: AbortSignal.timeout(KV_TIMEOUT_MS)
        });
        if (!res.ok) {
            recordKvFailure('read');
            return primed;
        }
        const body = await res.json();
        recordKvSuccess('read');
        const values: unknown[] = Array.isArray(body?.result) ? body.result : [];
        keys.forEach((key, i) => {
            const value = values[i];
            if (typeof value !== 'string') {
                primed.set(key, {kind: 'miss'});
                return;
            }
            try {
                primed.set(key, {kind: 'hit', envelope: JSON.parse(value) as Envelope<unknown>});
            } catch (e) {
                // A corrupt entry re-fetches like a miss.
                primed.set(key, {kind: 'miss'});
            }
        });
    } catch (e) {
        recordKvFailure('read');
    }
    return primed;
}

/**
 * Reads a boolean flag key. Breaker-aware and fail-open (a KV problem reads
 * as "flag not set").
 *
 * @param {string} key - The flag key.
 * @return {Promise<boolean>} True when the flag is set.
 */
export async function kvGetFlag(key: string): Promise<boolean> {
    if (!kvConfigured() || !isKvHealthy()) return false;
    const read = await kvGet<boolean>(key);
    return read.kind === 'hit';
}

/**
 * Sets a boolean flag key with a TTL. Best-effort, fire-and-forget friendly.
 *
 * @param {string} key - The flag key.
 * @param {number} ttlSeconds - Redis EX for the flag.
 * @return {Promise<void>} Resolves when the write settles.
 */
export async function kvSetFlag(key: string, ttlSeconds: number): Promise<void> {
    if (!kvConfigured() || !isKvHealthy()) return;
    await kvSet(key, {at: Date.now(), data: true}, ttlSeconds);
}

// In-flight coalescing: identical keys requested concurrently (Fluid serves
// many requests per instance) share one lookup+fetch instead of stampeding.
const inflight = new Map<string, Promise<unknown>>();

/**
 * Returns cached data for `key` when fresh; otherwise runs `fetcher` and
 * caches the result. When `fetcher` fails (e.g. GitHub rate limit) and a stale
 * copy exists, the stale copy is served instead of failing the card.
 *
 * @param {string} key - Cache key; include every input that changes the data (never the token).
 * @param {Function} fetcher - Fetches the raw, JSON-serialisable data.
 * @param {number|DataCacheOptions} [options] - Fresh window seconds (number,
 *     back-compat) or {freshSeconds, retentionSeconds}.
 * @return {Promise} The fresh or cached data.
 */
export async function withDataCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: number | DataCacheOptions
): Promise<T> {
    const existing = inflight.get(key);
    if (existing) {
        // Followers get data without doing any work — report it as a hit.
        recordCacheOutcome('fresh');
        return existing as Promise<T>;
    }
    const promise = withDataCacheUncoalesced(key, fetcher, options);
    inflight.set(key, promise);
    try {
        return await promise;
    } finally {
        inflight.delete(key);
    }
}

async function withDataCacheUncoalesced<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: number | DataCacheOptions
): Promise<T> {
    const opts: DataCacheOptions = typeof options === 'number' ? {freshSeconds: options} : options ?? {};
    const freshSeconds = opts.freshSeconds ?? FRESH_SECONDS_DEFAULT;
    const retentionSeconds = opts.retentionSeconds ?? RETENTION_SECONDS_DEFAULT;

    if (!kvConfigured()) return fetcher();
    // Breaker open: skip KV I/O entirely so an outage doesn't cost a timeout
    // per key. Callers keep working straight against GitHub.
    if (!isKvHealthy()) {
        recordCacheOutcome('miss');
        return fetcher();
    }

    // A primed (batch-MGET) result replaces the per-key GET when available.
    const read = (opts.primed?.get(key) as KvReadResult<T> | undefined) ?? (await kvGet<T>(key));
    if (read.kind === 'hit' && Date.now() - read.envelope.at < freshSeconds * 1000) {
        recordCacheOutcome('fresh');
        return read.envelope.data;
    }

    try {
        const data = await fetcher();
        await kvSet(key, {at: Date.now(), data}, retentionSeconds);
        recordCacheOutcome('miss');
        return data;
    } catch (err) {
        // Rate limited / GitHub down: a stale answer beats an error card.
        if (read.kind === 'hit') {
            recordCacheOutcome('stale');
            console.log(`data-cache: serving stale ${key} after fetch error: ${(err as Error)?.message}`);
            return read.envelope.data;
        }
        throw err;
    }
}
