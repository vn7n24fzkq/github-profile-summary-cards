import * as core from '@actions/core';
import rax from 'retry-axios';
import axios, {AxiosPromise} from 'axios';

rax.attach();

// An error thrown from the GraphQL layer, optionally flagged as a rate-limit so
// callers can rotate to another token, or as a resource-limit rejection so
// callers can retry with a cheaper query shape.
export interface GraphQLError extends Error {
    isRateLimit?: boolean;
    isResourceLimit?: boolean;
}

// GitHub's GraphQL API returns rate-limit failures as HTTP 200 with an `errors`
// array (type `RATE_LIMITED`), not an HTTP status — so axios never rejects and
// `err.response.status` is never 429/403. Centralise the check here: throw on any
// GraphQL error and mark rate-limit ones so the card handler rotates tokens
// instead of immediately rendering an error card.
export function assertNoGraphQLErrors(res: any, fallbackMessage: string): void {
    const errors = res?.data?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
        const err: GraphQLError = new Error(errors[0].message || fallbackMessage);
        // GitHub reports GraphQL rate limiting two ways: type RATE_LIMITED, and
        // (once the quota is fully spent) a typeless error reading "API rate
        // limit already exceeded for user ID ...". Matching only the type missed
        // the second form, so token rotation never engaged during a real
        // exhaustion — exactly when it matters most.
        if (errors.some((e: any) => e?.type === 'RATE_LIMITED' || /rate limit/i.test(e?.message ?? ''))) {
            err.isRateLimit = true;
        }
        // "Resource limits for this query exceeded" — GitHub's cost estimator
        // rejecting the query document. For mega-contribution accounts a
        // combined query can trip it while each field alone stays under the
        // limit, so callers may retry with a split query.
        if (errors.some((e: any) => /resource limits/i.test(e?.message ?? ''))) {
            err.isResourceLimit = true;
        }
        throw err;
    }
}

// ---- per-instance concurrency gate ----
// A cold heavy account renders 5 cards at once (README embeds / the demo page
// load all five images simultaneously), each firing chunks of parallel
// per-year queries plus fallbacks — bursts of 25-40 concurrent GraphQL calls
// trip GitHub's SECONDARY rate limit (403 with points to spare; observed in
// production 2026-07-17). Capping concurrent GitHub calls per lambda instance
// keeps the burst shape polite: excess calls queue for a moment instead of
// turning into an hour of 403s. Fluid routes many requests onto one instance,
// so the gate covers cross-card and cross-request bursts alike.
const MAX_CONCURRENT_GITHUB_CALLS = 8;
let activeGithubCalls = 0;
const githubCallWaiters: Array<() => void> = [];

async function acquireGithubSlot(): Promise<void> {
    if (activeGithubCalls < MAX_CONCURRENT_GITHUB_CALLS) {
        activeGithubCalls += 1;
        return;
    }
    await new Promise<void>(resolve => githubCallWaiters.push(resolve));
}

function releaseGithubSlot(): void {
    const next = githubCallWaiters.shift();
    if (next) {
        // hand the slot straight to the next waiter — activeGithubCalls stays put
        next();
    } else {
        activeGithubCalls -= 1;
    }
}

export default async function request(header: any, data: any): Promise<any> {
    await acquireGithubSlot();
    try {
        return await rawRequest(header, data);
    } finally {
        releaseGithubSlot();
    }
}

function rawRequest(header: any, data: any): AxiosPromise<any> {
    // GitHub's API requires a User-Agent header; without it the edge returns 502.
    // Callers can override via `header`, but we provide a sensible default.
    const headersWithUA = {'User-Agent': 'github-profile-summary-cards', ...header};
    return axios({
        url: 'https://api.github.com/graphql',
        method: 'post',
        headers: headersWithUA,
        data: data,
        raxConfig: {
            retry: 3,
            noResponseRetries: 3,
            retryDelay: 1000,
            backoffType: 'linear',
            httpMethodsToRetry: ['POST'],
            onRetryAttempt: err => {
                const cfg = rax.getConfig(err);
                core.warning(err);
                core.warning(`Retry attempt #${cfg?.currentRetryAttempt}`);
            }
        }
    });
}
