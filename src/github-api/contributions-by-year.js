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

  result.totalContributions =
    res.data.data.user.contributionsCollection.contributionCalendar.totalContributions;

  return result;
}

module.exports = getContributionByYear;
