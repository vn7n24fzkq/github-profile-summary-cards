const core = require('@actions/core');
const rax = require('retry-axios');
const axios = require('axios');

rax.attach();

function request(header, data) {
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
            onRetryAttempt: (err) => {
                const cfg = rax.getConfig(err);
                core.info(err);
                core.info(`Retry attempt #${cfg.currentRetryAttempt}`);
            },
        },
    });
}

module.exports = request;
