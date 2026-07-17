// Sentry wiring for UNEXPECTED card errors only.
//
// The service already understands (and counts in GA) its known failure
// classes: GitHub rate limits, the cost-estimator "Resource limits"
// rejections, time-budget throws and token exhaustion. Sending those to
// Sentry would be pure noise and would burn the free tier's 5k events/month
// during an incident. Only errors OUTSIDE those classes reach Sentry — each
// alert email should mean "something new broke".
//
// No-op when SENTRY_DSN is unset (local, Action, preview without the
// integration), so this is safe to ship before the marketplace install.

import * as Sentry from '@sentry/node';

let initialized = false;

function ensureInit(): boolean {
    if (!process.env.SENTRY_DSN) return false;
    if (!initialized) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.VERCEL_ENV ?? 'development',
            // Errors only — no performance tracing (keeps the free quota for
            // what matters and adds no per-request overhead).
            tracesSampleRate: 0
        });
        initialized = true;
    }
    return true;
}

const KNOWN_ERROR_PATTERNS = [
    /rate limit/i, // GitHub primary/secondary rate limiting (GA: rate_limited)
    /resource limits/i, // cost-estimator rejections (GitHub-side, tracked)
    /timed out before all years/i, // our own 12s budget throw (converges via cache)
    /no more github_token/i, // both tokens exhausted — a rate-limit symptom
    /could not resolve/i, // bad username (GA: not_found)
    /not found/i
];

/**
 * Reports a card error to Sentry when it does NOT belong to a known failure
 * class. Fire-and-forget: pass the returned promise to waitUntil.
 *
 * @param {unknown} err - The thrown error.
 * @param {string} card - The card event name (e.g. stats_card).
 * @param {string} username - The requested card subject.
 * @param {string} errorType - classifyError's type (GA dimension).
 * @return {Promise<void>} Resolves once the event is flushed (max 2s).
 */
export async function reportUnexpectedError(
    err: unknown,
    card: string,
    username: string,
    errorType: string
): Promise<void> {
    const message = String((err as Error)?.message ?? '');
    if (KNOWN_ERROR_PATTERNS.some(p => p.test(message))) return;
    if (!ensureInit()) return;
    try {
        Sentry.withScope(scope => {
            scope.setTags({card, error_type: errorType});
            scope.setUser({username});
            Sentry.captureException(err);
        });
        await Sentry.flush(2000);
    } catch (e) {
        // Never let telemetry failures affect a card render.
    }
}
