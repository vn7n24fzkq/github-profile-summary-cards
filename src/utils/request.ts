import core from '@actions/core';
import rax from 'retry-axios';
import axios, {AxiosPromise} from 'axios';

rax.attach();

export default function request(header: any, data: any): AxiosPromise<any> {
    return axios({
        url: 'https://api.github.com/graphql',
        method: 'post',
        headers: header,
        data: data,
        raxConfig: {
            retry: 10,
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
