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
    return crypto.createHash('sha256').update(username).digest('hex');
};

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

    // Destructure to remove sensitive PII (username) from the final payload
    const {username, ...cleanParams} = params;
    const clientId = getClientId(username);

    // Extract user IP and User-Agent from Vercel-injected headers
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

    try {
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
        console.error('Analytics error (ignored):', e instanceof Error ? e.message : e);
    }
}
