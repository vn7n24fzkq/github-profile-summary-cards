import * as core from '@actions/core';
import rax from 'retry-axios';
import axios, {AxiosPromise} from 'axios';

rax.attach();

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
