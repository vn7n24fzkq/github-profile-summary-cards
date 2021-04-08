const request = require('../utils/request.js');

const fetcher = (token, variables) => {
    return request(
        {
            Authorization: `bearer ${token}`,
        },
        {
            query: `
      query CommitLanguages($login: String!) {
        user(login: $login) {
          contributionsCollection {
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

// repos per language
async function getCommitLanguage(username) {
    const languageMap = new Map();

    const res = await fetcher(process.env.GITHUB_TOKEN, {
        login: username,
    });

    if (res.data.errors) {
        throw Error(res.data.errors[0].message || 'GetCommitLanguage failed');
    }

    res.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(
        (node) => {
            if (node.repository.primaryLanguage == null) {
                return;
            }
            const langName = node.repository.primaryLanguage.name;
            const langColor = node.repository.primaryLanguage.color;
            const totalCount = node.contributions.totalCount;
            if (totalCount > 0) {
                if (languageMap.has(langName)) {
                    const lang = languageMap.get(langName);
                    lang.count += totalCount;
                } else {
                    languageMap.set(langName, {
                        count: totalCount,
                        color: langColor ? langColor : '#586e75',
                    });
                }
            }
        }
    );

    return languageMap;
}

module.exports = getCommitLanguage;
