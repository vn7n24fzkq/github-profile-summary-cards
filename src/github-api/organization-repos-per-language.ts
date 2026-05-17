import request from '../utils/request';
import {RepoLanguages} from './repos-per-language';

const fetcher = (token: string, variables: any) => {
    // contain private repo need token permission
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query OrganizationReposPerLanguage($login: String!, $endCursor: String) {
        organization(login: $login) {
          repositories(isFork: false, first: 100, after: $endCursor, ownerAffiliations: OWNER) {
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
        cursor = res.data.data.organization.repositories.pageInfo.endCursor;
        hasNextPage = res.data.data.organization.repositories.pageInfo.hasNextPage;
        nodes.push(...res.data.data.organization.repositories.nodes);
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
