import * as core from '@actions/core';
import rax from 'retry-axios';
import axios, {AxiosPromise} from 'axios';

rax.attach();

// An error thrown from the GraphQL layer, optionally flagged as a rate-limit so
// callers can rotate to another token.
export interface GraphQLError extends Error {
    isRateLimit?: boolean;
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
        if (errors.some((e: any) => e?.type === 'RATE_LIMITED')) {
            err.isRateLimit = true;
        }
        throw err;
    }
}

export default function request(header: any, data: any): AxiosPromise<any> {
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
