const request = require('../utils/request');

const fetcher = (token, variables) => {
    // contain private need token permission
    // contributionsCollection default to a year ago
    return request(
        {
            Authorization: `bearer ${token}`,
        },
        {
            query: `
      query UserDetails($login: String!) {
        user(login: $login) {
            id
            name
            email
            createdAt
            twitterUsername
            company
            location
            websiteUrl
            repositories(first: 100,privacy:PUBLIC, isFork: false, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
              totalCount
              nodes {
                stargazers {
                  totalCount
                }
              }
            }
            contributionsCollection {
                contributionCalendar {
                    weeks {
                        contributionDays {
                            contributionCount
                            date
                        }
                    }
                }
                contributionYears
            }
            repositoriesContributedTo(first: 1,includeUserRepositories:true, privacy:PUBLIC, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
                totalCount
            }
            pullRequests(first: 1) {
                totalCount
            }
            issues(first: 1) {
                totalCount
            }
        }
      }

      `,
            variables,
        }
    );
};

async function getProfileDetails(username) {
    const result = {
        id: 0,
        name: '',
        email: '',
        joinedAt: '',
        company: null,
        websiteUrl: null,
        twitterUsername: null,
        location: null,
        totalPublicRepos: 0,
        totalStars: 0,
        totalIssueContributions: 0,
        totalPullRequestContributions: 0,
        totalRepositoryContributions: 0,
        contributions: [],
        contributionYears: [],
    };

    const res = await fetcher(process.env.GITHUB_TOKEN, {
        login: username,
    });

    if (res.data.errors) {
        throw Error(res.data.errors[0].message || 'GetProfileDetails failed');
    }

    const user = res.data.data.user;

    result.id = user.id;
    result.name = user.name;
    result.email = user.email;
    result.joinedAt = user.createdAt;
    result.totalPublicRepos = user.repositories.totalCount;
    result.totalStars = user.repositories.nodes.reduce((stars, curr) => {
        return stars + curr.stargazers.totalCount;
    }, 0);
    result.websiteUrl = user.websiteUrl;
    result.totalIssueContributions = user.issues.totalCount;
    result.totalPullRequestContributions = user.pullRequests.totalCount;
    result.totalRepositoryContributions =
        user.repositoriesContributedTo.totalCount;
    result.company = user.company;
    result.location = user.location;
    result.twitterUsername = user.twitterUsername;
    result.contributionYears = user.contributionsCollection.contributionYears;

    // contributions into array
    for (const week of user.contributionsCollection.contributionCalendar
        .weeks) {
        for (const day of week.contributionDays) {
            day.date = new Date(day.date);
            result.contributions.push(day);
        }
    }

    return result;
}

module.exports = getProfileDetails;
