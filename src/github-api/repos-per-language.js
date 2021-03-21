require("dotenv").config();
const request = require("../utils/request");

const githubToken = process.env.GITHUB_TOKEN;

const fetcher = (token, variables) => {
  //contain private repo need token permission
  return request(
    {
      Authorization: `bearer ${token}`,
    },
    {
      query: `
      query ReposPerLanguage($login: String!,$endCursor: String) {
        user(login: $login) {
          repositories(isFork: false, first: 100, after: $endCursor,ownerAffiliations: OWNER) {
            nodes {
              primaryLanguage {
                name
                color
              }
            }
            pageInfo{
                endCursor
                hasNextPage
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
async function getRepoLanguage(username) {
  let hasNextPage = true;
  let cursor = null;
  let languageMap = new Map();
  let nodes = [];

  while (hasNextPage) {
    let res = await fetcher(githubToken, {
      login: username,
      endCursor: cursor,
    });

    if (res.data.errors) {
      throw Error(res.data.errors[0].message || "GetRepoLanguage fail");
    }
    cursor = res.data.data.user.repositories.pageInfo.endCursor;
    hasNextPage = res.data.data.user.repositories.pageInfo.hasNextPage;
    nodes.push(...res.data.data.user.repositories.nodes);
  }

  nodes.forEach((node) => {
    if (node.primaryLanguage) {
      let langName = node.primaryLanguage.name;
      if (languageMap.has(langName)) {
        let lang = languageMap.get(langName);
        lang.count += 1;
      } else {
        languageMap.set(langName, {
          count: 1,
          color: node.primaryLanguage.color ? node.primaryLanguage.color : "#586e75",
        });
      }
    }
  });

  return languageMap;
}

module.exports = getRepoLanguage;
