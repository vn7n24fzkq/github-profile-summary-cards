const request = require("../../utils/request");

const fetcher = (token, variables) => {
  //contain private repo need token permission 
  return request(
    {
      Authorization: `bearer ${token}`,
    },
    {
      query: `
      query userInfo($login: String!,$endCursor: String) {
        user(login: $login) {
          repositories(isFork: false, first: 100, after: $endCursor,ownerAffiliations: OWNER) {
            nodes {
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges {
                  size
                  node {
                    color
                    name
                  }
                }
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
async function getRepoLanguage(username,token) {
  let hasNextPage = true;
  let cursor = null;
  let languageMap = new Map(); 
  let nodes=[];


  try {
    while (hasNextPage) {
      let res = await fetcher(token, {
        login: username,
        endCursor: cursor,
      });

      if (res.data.errors) {
        throw Error(res.data.errors[0].message || "Could not fetch user");
      }
      cursor = res.data.data.user.repositories.pageInfo.endCursor;
      hasNextPage = res.data.data.user.repositories.pageInfo.hasNextPage;
      nodes.push(...res.data.data.user.repositories.nodes);
    }

    nodes.forEach(node=>{
        node.languages.edges.forEach(edge=>{
            let langName = edge.node.name;
            console.log(languageMap.has(langName));
            if(languageMap.has(langName)){
                let lang = languageMap.get(langName);
                lang.count+=1;
                languageMap.set(langName, lang);
            }else{
                languageMap.set(langName, {count:1,color:edge.node.color});
            }
        });
    });

  } catch (e) {
      console.log("error");
      if(e.response){
        console.log(e.response.data);
      }else{
        console.log(e);
      }
  }

  return languageMap;
}

module.exports = getRepoLanguage;
