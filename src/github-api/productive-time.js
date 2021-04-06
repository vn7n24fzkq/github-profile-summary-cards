const request = require('../utils/request');

const userIdFetcher = (token, variables) => {
    return request(
        {
            Authorization: `bearer ${token}`,
        },
        {
            query: `
      query getUserId($login: String!) {
        user(login: $login) {
            id
        }
      }
     `,
            variables,
        }
    );
};
// we use commit datetime to caculate productive time
const fetcher = (token, variables) => {
    return request(
        {
            Authorization: `bearer ${token}`,
        },
        {
            query: `
      query ProductiveTime($login: String!,$userId: ID!,$until: GitTimestamp!,,$since: GitTimestamp!) {
        user(login: $login) {
          contributionsCollection{
            commitContributionsByRepository(maxRepositories:50) {
              repository {
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: 50,since: $since,until: $until,author:{id:$userId}) {
                        edges {
                          node {
                            message
                            author{
                              email
                            }
                            committedDate
                          }
                        }
                      }
                    }
                  }
                }
                name
              }
            }
          }
        }
      }
     `,
            variables,
        }
    );
};

// get productive time
async function getProductiveTime(username, until, since) {
    const userIdResponse = await userIdFetcher(process.env.GITHUB_TOKEN, {
        login: username,
    });

    if (userIdResponse.data.errors) {
        throw Error(
            userIdResponse.data.errors[0].message ||
                'GetProductiveTime(getUserId) failed'
        );
    }

    const userId = userIdResponse.data.data.user.id;
    const array = [];
    const res = await fetcher(process.env.GITHUB_TOKEN, {
        login: username,
        userId: userId,
        until: until,
        since: since,
    });

    if (res.data.errors) {
        throw Error(res.data.errors[0].message || 'GetProductiveTime failed');
    }

    res.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(
        (node) => {
            if (node.repository.defaultBranchRef != null) {
                node.repository.defaultBranchRef.target.history.edges.forEach(
                    (node) => {
                        array.push(node.node.committedDate);
                    }
                );
            }
        }
    );

    return array;
}

module.exports = getProductiveTime;
