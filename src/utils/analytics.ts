import crypto from 'crypto';

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
const GA_API_SECRET = process.env.GA_API_SECRET;

/**
 * Generates a consistent client_id based on the username.
 * If no username is provided, it generates a random UUID.
 *
 * @param {string} [username] - The username to hash.
 * @return {string} The generated client ID.
 */
const getClientId = (username?: string): string => {
    if (!username) return crypto.randomUUID();
    // GitHub logins are case-insensitive, so normalise (lowercase + trim) before
    // hashing — otherwise `Torvalds` and `torvalds` would count as two "users".
    return crypto.createHash('sha256').update(username.trim().toLowerCase()).digest('hex');
};

// Obvious crawlers / scrapers / CLI tools. This deliberately does NOT match
// GitHub's camo image proxy — camo is how legitimate README embeds fetch the
// card, so that traffic must be classified as `embed`, not `bot`.
const BOT_UA =
    /bot\b|crawl|spider|slurp|bingpreview|curl\/|wget\/|python-(?:requests|urllib)|scrapy|go-http-client|httpclient|headlesschrome|phantomjs/i;
function isLikelyBot(userAgent: string): boolean {
    return BOT_UA.test(userAgent);
}

/**
 * Classifies where a card request came from, so it can be segmented (and bots
 * filtered out) in GA rather than silently dropped:
 * - `demo`  — the demo/landing page (it tags its requests with `?source=demo`);
 * - `bot`   — an obvious crawler/scraper/CLI by User-Agent (never camo);
 * - `embed` — GitHub's camo image proxy, i.e. a README / Markdown embed;
 * - `other` — anything else (direct hits, unknown clients).
 *
 * @param {unknown} sourceParam - The raw `source` query value, if any.
 * @param {string} userAgent - The request User-Agent.
 * @return {string} The resolved source label.
 */
export function resolveSource(sourceParam: unknown, userAgent: string): string {
    if (typeof sourceParam === 'string' && sourceParam.toLowerCase() === 'demo') return 'demo';
    if (isLikelyBot(userAgent)) return 'bot';
    return userAgent.toLowerCase().includes('camo') ? 'embed' : 'other';
}

import {IncomingHttpHeaders} from 'http';

// ...

/**
 * Sends an event to GA4 via the Measurement Protocol.
 * Accepts headers to extract user-specific data (IP and User-Agent)
 * provided by the Vercel Edge Network.
 *
 * @param {string} eventName - The name of the event.
 * @param {Record<string, any>} [params] - Event parameters.
 * @param {IncomingHttpHeaders} [headers] - Request headers.
 */
export async function sendAnalytics(
    eventName: string,
    params: Record<string, any> = {},
    headers?: IncomingHttpHeaders // Pass Vercel request headers here (plain object)
) {
    // Only execute in Vercel environment with valid credentials
    if (!process.env.VERCEL || !GA_MEASUREMENT_ID || !GA_API_SECRET) return;

    // Wrap the entire body so fire-and-forget callers (`void sendAnalytics(...)`)
    // can never produce an unhandled rejection, even if setup throws before fetch.
    try {
        // client_id stays a hash (stable "user" identity for GA), but the plain
        // username is also sent as a card_username event param — GitHub logins
        // are public, and this is what makes "which accounts get rendered most"
        // reportable in GA. Bots aren't dropped here — the handler tags them
        // `source=bot` (via resolveSource) so they can be filtered in reports.
        const {username, ...cleanParams} = params;
        const clientId = getClientId(username);
        if (username) cleanParams.card_username = String(username).trim().toLowerCase();

        // Extract user IP + User-Agent from Vercel-injected headers
        // Vercel headers are plain objects (string | string[] | undefined)
        const forwardedFor = headers?.['x-forwarded-for'];
        const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0] || '';

        const userAgent = headers?.['user-agent'];
        const ua = Array.isArray(userAgent) ? userAgent[0] : userAgent || '';

        const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

        const payload = {
            client_id: clientId,
            // GA4 Measurement Protocol supports top-level overrides for UA and IP
            user_agent: ua,
            ip_override: ip,
            events: [
                {
                    name: eventName,
                    params: {
                        ...cleanParams,
                        // Use provided session_id or fallback to a timestamp-based ID to ensure session separation
                        session_id: cleanParams.session_id || Date.now().toString(),
                        engagement_time_msec: 100
                    }
                }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            // Native fetch timeout implementation available in Node.js 18+
            signal: AbortSignal.timeout(2000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('GA4 Error Response:', errorText);
        }
    } catch (e) {
        // Log error but do not throw to prevent breaking the main application flow
        console.error(`Analytics error (ignored) [${eventName}]:`, e instanceof Error ? e.message : e);
    }
}
