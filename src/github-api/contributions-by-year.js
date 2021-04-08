const request = require('../utils/request');

const fetcher = (token, variables, year) => {
    return request(
        {
            Authorization: `bearer ${token}`,
        },
        {
            query: `
      query ContributionsByYear($login: String!) {
        user(login: $login) {
            ${
                year
                    ? `contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {`
                    : 'contributionsCollection {'
            }
                    totalCommitContributions
                    contributionCalendar {
                        totalContributions
                    }
                }
            }
        }
      `,
            variables,
        }
    );
};

async function getContributionByYear(username, year) {
    const result = {
        totalCommitContributions: 0,
        totalContributions: 0,
    };

    const res = await fetcher(
        process.env.GITHUB_TOKEN,
        {
            login: username,
        },
        year
    );

    if (res.data.errors) {
        throw Error(
            res.data.errors[0].message || 'GetContributionByYear failed'
        );
    }

    const user = res.data.data.user;

    result.totalCommitContributions =
        user.contributionsCollection.totalCommitContributions;
    result.totalContributions =
        user.contributionsCollection.contributionCalendar.totalContributions;
    return result;
}

module.exports = getContributionByYear;
