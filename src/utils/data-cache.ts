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

import {AsyncLocalStorage} from 'async_hooks';

const FRESH_SECONDS_DEFAULT = 6 * 60 * 60; // serve without re-fetching
const STALE_SECONDS = 7 * 24 * 60 * 60; // keep as a rate-limit fallback
const KV_TIMEOUT_MS = 1500; // never let a slow Redis block a card render

interface Envelope<T> {
    at: number; // epoch ms when the data was fetched
    data: T;
}

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

async function kvGet<T>(key: string): Promise<Envelope<T> | null> {
    try {
        const res = await fetch(`${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`, {
            headers: {Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`},
            signal: AbortSignal.timeout(KV_TIMEOUT_MS)
        });
        if (!res.ok) return null;
        const body = await res.json();
        if (typeof body?.result !== 'string') return null;
        return JSON.parse(body.result) as Envelope<T>;
    } catch (e) {
        return null;
    }
}

async function kvSet<T>(key: string, envelope: Envelope<T>): Promise<void> {
    try {
        await fetch(`${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}?EX=${STALE_SECONDS}`, {
            method: 'POST',
            headers: {Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`},
            body: JSON.stringify(envelope),
            signal: AbortSignal.timeout(KV_TIMEOUT_MS)
        });
    } catch (e) {
        // Best-effort write; the card was already rendered from fresh data.
    }
}

/**
 * Returns cached data for `key` when fresh; otherwise runs `fetcher` and
 * caches the result. When `fetcher` fails (e.g. GitHub rate limit) and a stale
 * copy exists, the stale copy is served instead of failing the card.
 *
 * @param {string} key - Cache key; include every input that changes the data (never the token).
 * @param {Function} fetcher - Fetches the raw, JSON-serialisable data.
 * @param {number} [freshSeconds] - How long a cached copy is served without re-fetching.
 * @return {Promise<T>} The fresh or cached data.
 */
export async function withDataCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    freshSeconds: number = FRESH_SECONDS_DEFAULT
): Promise<T> {
    if (!kvConfigured()) return fetcher();

    const cached = await kvGet<T>(key);
    if (cached && Date.now() - cached.at < freshSeconds * 1000) {
        recordCacheOutcome('fresh');
        return cached.data;
    }

    try {
        const data = await fetcher();
        await kvSet(key, {at: Date.now(), data});
        recordCacheOutcome('miss');
        return data;
    } catch (err) {
        // Rate limited / GitHub down: a stale answer beats an error card.
        if (cached) {
            recordCacheOutcome('stale');
            console.log(`data-cache: serving stale ${key} after fetch error: ${(err as Error)?.message}`);
            return cached.data;
        }
        throw err;
    }
}

/**
 * Bumps the render leaderboards for a username: an all-time sorted set plus a
 * monthly one (auto-expiring). Fire-and-forget, fail-open — a Redis hiccup
 * never affects the card. View the boards in the Upstash data browser or GA.
 *
 * @param {string} username - The card subject (lowercased for aggregation).
 * @return {Promise<void>} Resolves once the pipeline call settles.
 */
export async function bumpRenderLeaderboard(username: string): Promise<void> {
    if (!kvConfigured()) return;
    const user = username.toLowerCase();
    const month = new Date().toISOString().slice(0, 7); // e.g. 2026-07
    const monthlyKey = `leaderboard:renders:${month}`;
    try {
        await fetch(`${process.env.KV_REST_API_URL}/pipeline`, {
            method: 'POST',
            headers: {Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`},
            body: JSON.stringify([
                ['ZINCRBY', 'leaderboard:renders', '1', user],
                ['ZINCRBY', monthlyKey, '1', user],
                // Keep two months of monthly boards around, then let them expire.
                ['EXPIRE', monthlyKey, String(62 * 24 * 60 * 60)]
            ]),
            signal: AbortSignal.timeout(KV_TIMEOUT_MS)
        });
    } catch (e) {
        // Best-effort statistics; never let them fail a request.
    }
}
