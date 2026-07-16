import request, {assertNoGraphQLErrors} from '../utils/request';
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
            repositories(isFork: false, first: 100, after: $endCursor, privacy: PUBLIC, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
              nodes {
                name
                nameWithOwner
                primaryLanguage {
                  name
                  color
                }
              }
              pageInfo {
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
    token: string,
    excludeRepos: Array<string> = []
): Promise<RepoLanguages> {
    // Vercel: top-100 by stars in one query. Action/CLI: paginate all. See the
    // note in the user repos-per-language module.
    const repoLanguages = new RepoLanguages();
    const nodes: {name: string; nameWithOwner: string; primaryLanguage: {name: string; color: string} | null}[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
        const res: any = await fetcher(token, {login: login, endCursor: cursor});
        assertNoGraphQLErrors(res, 'GetOrganizationRepoLanguage fail');
        const owner = res.data.data.repositoryOwner;
        if (!owner || owner.__typename !== 'Organization') {
            throw Error(`Organization not found: ${login}`);
        }
        nodes.push(...owner.repositories.nodes);
        cursor = owner.repositories.pageInfo?.endCursor ?? null;
        hasNextPage = !process.env.VERCEL && !!owner.repositories.pageInfo?.hasNextPage;
    }

    nodes.forEach(
        (node: {name: string; nameWithOwner: string; primaryLanguage: {name: string; color: string} | null}) => {
            if (
                excludeRepos.includes((node.name ?? '').toLowerCase()) ||
                excludeRepos.includes((node.nameWithOwner ?? '').toLowerCase())
            ) {
                return;
            }
            if (node.primaryLanguage) {
                const langName = node.primaryLanguage.name;
                const langColor = node.primaryLanguage.color;
                if (!exclude.includes(langName.toLowerCase())) {
                    repoLanguages.addLanguage(langName, langColor);
                }
            }
        }
    );

    return repoLanguages;
}
