require("dotenv").config();
const request = require("../utils/request");

const githubToken = process.env.GITHUB_TOKEN;

//we use commit datetime to caculate productive time
const fetcher = (token, variables) => {
  return request(
    {
      Authorization: `bearer ${token}`,
    },
    {
      query: `
      query userInfo($login: String!,$authorEmail: String!,$since: GitTimestamp!) {
        user(login: $login) {
          contributionsCollection{
            commitContributionsByRepository(maxRepositories:100) {
              repository {
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: 100,since: $since,author:{emails:[$authorEmail]}) {
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

//get productive time
async function getProductiveTime(username, authorEmail, since) {
  let array = new Array();
  let res = await fetcher(githubToken, {
    login: username,
    authorEmail: authorEmail,
    since: since,
  });

  if (res.data.errors) {
    throw Error(res.data.errors[0].message || "GetProductiveTime failed");
  }

  res.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(
    (node) => {
      node.repository.defaultBranchRef.target.history.edges.forEach((node) => {
        array.push(node.node.committedDate);
      });
    }
  );

  return array;
}

module.exports = getProductiveTime;
