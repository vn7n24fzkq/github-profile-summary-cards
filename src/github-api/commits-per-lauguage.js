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
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                primaryLanguage {
                  name
                  color
                }
              }
              contributions {
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
async function getCommitLanguage(username, year) {
  let languageMap = new Map();

  let res = await fetcher(
    githubToken,
    {
      login: username,
    },
    year
  );

  if (res.data.errors) {
    throw Error(res.data.errors[0].message || "GetCommitLanguage failed");
  }

  res.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(
    (node) => {
      if (node.repository.primaryLanguage == null) {
        return;
      }
      let langName = node.repository.primaryLanguage.name;
      let langColor = node.repository.primaryLanguage.color;
      let totalCount = node.contributions.totalCount;
      if (totalCount > 0) {
        if (languageMap.has(langName)) {
          let lang = languageMap.get(langName);
          lang.count += totalCount;
        } else {
          languageMap.set(langName, {
            count: totalCount,
            color: langColor == null ? "#586e75" : langColor,
          });
        }
      }
    }
  );

  return languageMap;
}

module.exports = getCommitLanguage;
