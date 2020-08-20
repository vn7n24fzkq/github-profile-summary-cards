require("dotenv").config();
const request = require("../utils/request");

const privacy = process.env.CONTAIN_PRAIVTE == 1 ? "" : "privacy: PUBLIC";
const githubToken = process.env.GITHUB_TOKEN;

const fetcher = (token, variables) => {
  //contain private need token permission
  return request(
    {
      Authorization: `bearer ${token}`,
    },
    {
      query: `
        query userInfo($login: String!) {
        	user(login: $login) {
                login
                name
        		email
        		createdAt
        		twitterUsername
        
        		issues {
        			totalCount
        		}
        		pullRequests {
        			totalCount
        		}
                followers{
                    totalCount
                }
        		repositoriesContributedTo(${privacy}) {
        			totalCount
        		}
                repositories(first: 100, ownerAffiliations: OWNER, isFork: false,${privacy}) {
                  nodes {
                    stargazers {
                      totalCount
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

//repos per language
async function getProfileDetails(username) {
    let result = {
        name:"",
        email:"",
        joinedAt:"",
        issueCount:0,
        pullRequestCount:0,
        repoContributedCount:0,
        starCount:0,
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
      result.issueCount = user.issues.totalCount;
      result.pullRequestCount = user.pullRequests.totalCount;
      result.repoContributedCount = user.repositoriesContributedTo.totalCount;
      result.starCount = user.repositories.stargazers.toString;

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
