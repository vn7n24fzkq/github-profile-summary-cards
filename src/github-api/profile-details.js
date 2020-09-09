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
    totalPublicRepos: 0,
    totalStars: 0,
    contributions: [],
    contributionYears: [],
  };

  let res = await fetcher(githubToken, {
    login: username,
  });

  if (res.data.errors) {
    throw Error(res.data.errors[0].message || "GetProfileDetails failed");
  }

  let user = res.data.data.user;

  result.name = user.name;
  result.email = user.email;
  result.joinedAt = user.createdAt;
  result.totalPublicRepos = user.repositories.totalCount;
  result.totalStars = user.repositories.nodes.reduce((stars, curr) => {
    return stars + curr.stargazers.totalCount;
  }, 0);
  result.websiteUrl = user.websiteUrl;
  result.company = user.company;
  result.location = user.location;
  result.twitterUsername = user.twitterUsername;
  result.contributionYears = user.contributionsCollection.contributionYears;

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
