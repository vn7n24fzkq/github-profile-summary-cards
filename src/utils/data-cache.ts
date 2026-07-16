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

const FRESH_SECONDS_DEFAULT = 6 * 60 * 60; // serve without re-fetching
const STALE_SECONDS = 7 * 24 * 60 * 60; // keep as a rate-limit fallback
const KV_TIMEOUT_MS = 1500; // never let a slow Redis block a card render

interface Envelope<T> {
    at: number; // epoch ms when the data was fetched
    data: T;
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
        return cached.data;
    }

    try {
        const data = await fetcher();
        await kvSet(key, {at: Date.now(), data});
        return data;
    } catch (err) {
        // Rate limited / GitHub down: a stale answer beats an error card.
        if (cached) {
            console.log(`data-cache: serving stale ${key} after fetch error: ${(err as Error)?.message}`);
            return cached.data;
        }
        throw err;
    }
}
