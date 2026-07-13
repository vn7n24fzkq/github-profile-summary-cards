// Aggregates commit counts by primary language across an organization's top public repos.
// Capped at MAX_REPOS to stay within GitHub rate limits and Vercel function timeouts.
// Semantics differ from the per-user version: orgs do not have contributionsCollection,
// so we sample the default-branch history of each top repo.
import request from '../utils/request';
import {CommitLanguages} from './commits-per-language';

const MAX_REPOS = 50;

const fetcher = (token: string, variables: any) => {
    // Use `repositoryOwner` + Organization fragment (public, no read:org scope).
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query OrganizationCommitsPerLanguage($login: String!, $first: Int!) {
        repositoryOwner(login: $login) {
          __typename
          ... on Organization {
            repositories(first: $first, privacy: PUBLIC, isFork: false, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
              nodes {
                primaryLanguage {
                  name
                  color
                }
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: 0) {
                        totalCount
                      }
                    }
                  }
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

// commits per language for an organization
export async function getOrganizationCommitLanguage(
    login: string,
    exclude: Array<string>,
    token: string
): Promise<CommitLanguages> {
    const commitLanguages = new CommitLanguages();

    const res = await fetcher(token, {
        login: login,
        first: MAX_REPOS
    });

    if (res.data.errors) {
        throw Error(res.data.errors[0].message || 'GetOrganizationCommitLanguage failed');
    }

    const owner = res.data.data.repositoryOwner;
    if (!owner || owner.__typename !== 'Organization') {
        throw Error(`Organization not found: ${login}`);
    }
    const org = owner;

    org.repositories.nodes.forEach(
        (node: {
            primaryLanguage: {name: string; color: string} | null;
            defaultBranchRef: {target: {history: {totalCount: number}}} | null;
        }) => {
            if (node.primaryLanguage == null || node.defaultBranchRef == null) {
                return;
            }
            const langName = node.primaryLanguage.name;
            const langColor = node.primaryLanguage.color;
            const totalCount = node.defaultBranchRef.target.history.totalCount;
            if (!exclude.includes(langName.toLowerCase())) {
                commitLanguages.addLanguageCount(langName, langColor, totalCount);
            }
        }
    );

    return commitLanguages;
}
