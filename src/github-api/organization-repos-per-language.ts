import request from '../utils/request';
import {RepoLanguages} from './repos-per-language';

const fetcher = (token: string, variables: any) => {
    // Use `repositoryOwner` + Organization fragment (public, no read:org scope).
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query OrganizationReposPerLanguage($login: String!, $endCursor: String) {
        repositoryOwner(login: $login) {
          __typename
          ... on Organization {
            repositories(isFork: false, first: 100, after: $endCursor, privacy: PUBLIC, ownerAffiliations: OWNER) {
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
      }
      `,
            variables
        }
    );
};

// repos per language for an organization
export async function getOrganizationRepoLanguages(
    login: string,
    exclude: Array<string>,
    token: string
): Promise<RepoLanguages> {
    let hasNextPage = true;
    let cursor = null;
    const repoLanguages = new RepoLanguages();
    const nodes = [];

    while (hasNextPage) {
        const res: any = await fetcher(token, {
            login: login,
            endCursor: cursor
        });

        if (res.data.errors) {
            throw Error(res.data.errors[0].message || 'GetOrganizationRepoLanguage fail');
        }
        const owner = res.data.data.repositoryOwner;
        if (!owner || owner.__typename !== 'Organization') {
            throw Error(`Organization not found: ${login}`);
        }
        const org = owner;
        cursor = org.repositories.pageInfo.endCursor;
        hasNextPage = org.repositories.pageInfo.hasNextPage;
        nodes.push(...org.repositories.nodes);
    }

    nodes.forEach(node => {
        if (node.primaryLanguage) {
            const langName = node.primaryLanguage.name;
            const langColor = node.primaryLanguage.color;
            if (!exclude.includes(langName.toLowerCase())) {
                repoLanguages.addLanguage(langName, langColor);
            }
        }
    });

    return repoLanguages;
}
