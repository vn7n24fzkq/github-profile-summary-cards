const axios = require('axios');

function request(header, data) {
    return axios({
        url: 'https://api.github.com/graphql',
        method: 'post',
        headers: header,
        data: data,
    });
}

module.exports = request;
