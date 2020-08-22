require("dotenv").config();
const request = require("../utils/request");

const privacy = process.env.CONTAIN_PRAIVTE == 1 ? "" : "privacy: PUBLIC";
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
            }
          }
        }
      }

      `,
      variables,
    }
  );
};

//repos per language
async function getProfileDetails(username) {
    let result = {
        name:"",
        email:"",
        joinedAt:"",
        totalContributions:0,
        totalPublicRepos:0,
    };

  try {
      let res = await fetcher(githubToken, {
        login: username,
      });

      if (res.data.errors) {
        throw Error(res.data.errors[0].message || "Github api fail");
      }

      let user = res.data.data.user;

      result.name = user.name;
      result.email = user.email;
      result.joinedAt = user.createdAt;
      result.totalContributions = user.contributionsCollection.contributionCalendar.totalContributions;
      result.totalPublicRepos = user.repositories.totalCount;

  } catch (e) {
    if (e.response) {
      console.log(e.response.data);
    } else {
      console.log(e);
    }
  }

  return result;
}

module.exports = getProfileDetails;
