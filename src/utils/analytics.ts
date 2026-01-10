import axios from 'axios';
import crypto from 'crypto';

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
const GA_API_SECRET = process.env.GA_API_SECRET;

// Generate a deterministic client_id from username to track "active users" (profiles using the card)
// Fallback to random if no username (e.g. error card or basic view)
const getClientId = (username?: string): string => {
    if (!username) return crypto.randomUUID();
    return crypto.createHash('sha256').update(username).digest('hex');
};

export async function sendAnalytics(eventName: string, params: Record<string, any> = {}) {
    // Analytics only enabled on Vercel environment to respect user privacy on GitHub Actions
    if (!process.env.VERCEL || !GA_MEASUREMENT_ID || !GA_API_SECRET) {
        return;
    }

    // Extract username from params for client_id generation, but keep it in params too
    const clientId = getClientId(params.username);

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

    const payload = {
        client_id: clientId,
        events: [
            {
                name: eventName,
                params: {
                    ...params,
                    engagement_time_msec: '100',
                    session_id: '1'
                }
            }
        ]
    };

    try {
        // We await this because Vercel/Lambda freezes the process immediately after response.
        // "Fire and forget" without await puts the request at risk of being cut off.
        await axios.post(url, payload, {
            timeout: 2000 // Short timeout to prevent blocking response for too long
        });
    } catch (e) {
        // Ignore analytics errors to not break the main request
        console.error('Analytics error (ignored):', e instanceof Error ? e.message : e);
    }
}
