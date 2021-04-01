const request = require('../utils/request');

// we use commit datetime to caculate productive time
const fetcher = (token, variables) => {
    return request(
        {
            Authorization: `bearer ${token}`,
        },
        {
            query: `
      query ProductiveTime($login: String!,$userId: ID!,$until: GitTimestamp!) {
        user(login: $login) {
          contributionsCollection{
            commitContributionsByRepository(maxRepositories:100) {
              repository {
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: 100,until: $until,author:{id:$userId}) {
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
async function getProductiveTime(username, userId, until) {
    const array = [];
    const res = await fetcher(process.env.GITHUB_TOKEN, {
        login: username,
        userId: userId,
        until: until,
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
