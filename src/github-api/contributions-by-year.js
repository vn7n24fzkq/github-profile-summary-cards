require("dotenv").config();
const request = require("../utils/request");

const githubToken = process.env.GITHUB_TOKEN;

const fetcher = (token, variables, year) => {
  return request(
    {
      Authorization: `bearer ${token}`,
    },
    {
      query: `
      query userInfo($login: String!) {
        user(login: $login) {
            contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
                totalPullRequestReviewContributions
                totalIssueContributions
                totalCommitContributions
                totalPullRequestContributions
                totalRepositoryContributions
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
  let result = {
    totalContributions: 0,
    totalPullRequestReviewContributions: 0,
    totalIssueContributions: 0,
    totalCommitContributions: 0,
    totalPullRequestContributions: 0,
    totalRepositoryContributions: 0,
  };

  let res = await fetcher(
    githubToken,
    {
      login: username,
    },
    year
  );

  if (res.data.errors) {
    throw Error(res.data.errors[0].message || "GetContributionByYear failed");
  }

  let user = res.data.data.user;

  result.totalRepositoryContributions = user.contributionsCollection.totalRepositoryContributions;
  result.totalPullRequestContributions = user.contributionsCollection.totalPullRequestContributions;
  result.totalPullRequestReviewContributions = user.contributionsCollection.totalPullRequestReviewContributions;
  result.totalIssueContributions = user.contributionsCollection.totalIssueContributions;
  result.totalCommitContributions = user.contributionsCollection.totalCommitContributions;
  result.totalContributions =
    user.contributionsCollection.contributionCalendar.totalContributions;

  return result;
}

module.exports = getContributionByYear;
