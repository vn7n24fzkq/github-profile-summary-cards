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
    /timed out before/i, // our own budget throws (converge via cache)
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
    // Errors already classified by handleCard (rate limits by status/flag, bad
    // usernames) are known even when their axios message is generic
    // ("Request failed with status code 429").
    if (errorType === 'rate_limited' || errorType === 'not_found') return;
    // 403/429 with generic messages are (secondary) rate limiting; 404 is a
    // missing entity. 401 deliberately NOT skipped — a revoked token is
    // exactly the kind of new problem Sentry should page about.
    const status = (err as any)?.response?.status;
    if (status === 403 || status === 429 || status === 404) return;
    const message = String((err as Error)?.message ?? '');
    if (KNOWN_ERROR_PATTERNS.some(p => p.test(message))) return;
    if (!ensureInit()) return;
    try {
        // Never hand Sentry the raw error: axios errors carry the full request
        // config (incl. the Authorization token) which Sentry would serialize.
        // A rebuilt Error keeps the message and stack and nothing else.
        const sanitized = new Error(message || 'unknown card error');
        sanitized.name = (err as Error)?.name ?? 'Error';
        sanitized.stack = (err as Error)?.stack;
        Sentry.withScope(scope => {
            scope.setTags({card, error_type: errorType, http_status: String(status ?? 'n/a')});
            scope.setUser({username});
            Sentry.captureException(sanitized);
        });
        await Sentry.flush(2000);
    } catch (e) {
        // Never let telemetry failures affect a card render.
    }
}

// ---- Axiom error records ----
// Structured error records are POSTed straight to Axiom's ingest API from the
// function (an ordinary outbound request — free on both sides: Vercel bills
// nothing for it, and Axiom's Personal plan is hard-capped, pausing rather
// than charging). Vercel Log Drains were deliberately NOT used: the drain
// mechanism itself is billed at $0.50/GB processed. Unlike the Sentry path,
// EVERY card error ships here — Axiom is the searchable 30-day history for
// "which usernames failed, when, and why".

/**
 * Ships one structured card-error record to Axiom. No-op without
 * AXIOM_TOKEN/AXIOM_DATASET. Fire-and-forget via waitUntil.
 *
 * @param {unknown} err - The thrown error.
 * @param {string} card - The card event name (e.g. stats_card).
 * @param {string} username - The requested card subject.
 * @param {string} errorType - classifyError's type (GA dimension).
 * @return {Promise<void>} Resolves once the record is sent (max 2s).
 */
export async function shipErrorRecord(err: unknown, card: string, username: string, errorType: string): Promise<void> {
    const token = process.env.AXIOM_TOKEN;
    const dataset = process.env.AXIOM_DATASET;
    if (!token || !dataset) return;
    try {
        await fetch(`https://api.axiom.co/v1/datasets/${encodeURIComponent(dataset)}/ingest`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([
                {
                    _time: new Date().toISOString(),
                    level: 'error',
                    card,
                    username,
                    error_type: errorType,
                    message: String((err as Error)?.message ?? 'unknown').slice(0, 300),
                    status: (err as any)?.response?.status ?? null,
                    env: process.env.VERCEL_ENV ?? 'development'
                }
            ]),
            signal: AbortSignal.timeout(2000)
        });
    } catch (e) {
        // Best-effort telemetry — never affects the card.
    }
}
