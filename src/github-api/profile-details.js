require("dotenv").config();
const request = require("../utils/request");

const githubToken = process.env.GITHUB_TOKEN;

const fetcher = (token, variables) => {
  //contain private need token permission
  //contributionsCollection default to a year ago
  return request(
    {
      Authorization: `bearer ${token}`,
    },
    {
      query: `
      query userInfo($login: String!) {
        user(login: $login) {
            name
            email
            createdAt
            twitterUsername
            company
            location
            websiteUrl
            repositories(privacy:PUBLIC){
                totalCount
            }
            contributionsCollection {
                totalIssueContributions
                totalCommitContributions
                totalRepositoryContributions
                totalPullRequestContributions
                totalPullRequestReviewContributions
                contributionCalendar {
                    totalContributions
                    weeks {
                        contributionDays {
                            contributionCount
                            date
                        }
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

async function getProfileDetails(username) {
  let result = {
    name: "",
    email: "",
    joinedAt: "",
    company: null,
    websiteUrl: null,
    twitterUsername: null,
    location: null,
    totalContributions: 0,
    totalPublicRepos: 0,
    contributions: [],
  };

  let res = await fetcher(githubToken, {
    login: username,
  });

  if (res.data.errors) {
    throw Error(res.data.errors[0].message || "Github api failed");
  }

  let user = res.data.data.user;

  result.name = user.name;
  result.email = user.email;
  result.joinedAt = user.createdAt;
  result.totalContributions =
    user.contributionsCollection.contributionCalendar.totalContributions;
  result.totalPublicRepos = user.repositories.totalCount;
  result.websiteUrl = user.websiteUrl;
  result.company = user.company;
  result.location = user.location;
  result.twitterUsername = user.twitterUsername;

  //contributions into array
  for (let week of user.contributionsCollection.contributionCalendar.weeks) {
    for (let day of week.contributionDays) {
      day.date = new Date(day.date);
      result.contributions.push(day);
    }
  }

  return result;
}

module.exports = getProfileDetails;
