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
      query OrganizationReposPerLanguage($login: String!) {
        repositoryOwner(login: $login) {
          __typename
          ... on Organization {
            repositories(isFork: false, first: 100, privacy: PUBLIC, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
              nodes {
                primaryLanguage {
                  name
                  color
                }
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
    // Single top-100 (by stars) query instead of paginating every repo — see the
    // note in the user repos-per-language module.
    const repoLanguages = new RepoLanguages();

    const res: any = await fetcher(token, {login: login});
    if (res.data.errors) {
        throw Error(res.data.errors[0].message || 'GetOrganizationRepoLanguage fail');
    }
    const owner = res.data.data.repositoryOwner;
    if (!owner || owner.__typename !== 'Organization') {
        throw Error(`Organization not found: ${login}`);
    }
    const nodes = owner.repositories.nodes;

    nodes.forEach((node: {primaryLanguage: {name: string; color: string} | null}) => {
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
