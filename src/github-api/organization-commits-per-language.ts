// Aggregates commit counts by primary language across an organization's top public repos.
// Capped at MAX_REPOS to stay within GitHub rate limits and Vercel function timeouts.
// Semantics differ from the per-user version: orgs do not have contributionsCollection,
// so we sum each top repo's total default-branch commit count (all authors, all
// time) and attribute it to that repo's primary language. `first: 1` is used
// only to satisfy the connection arg — we read `totalCount`, not the nodes.
import request, {assertNoGraphQLErrors} from '../utils/request';
import {withDataCache} from '../utils/data-cache';
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
                name
                nameWithOwner
                primaryLanguage {
                  name
                  color
                }
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: 1) {
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
    token: string,
    excludeRepos: Array<string> = []
): Promise<CommitLanguages> {
    const commitLanguages = new CommitLanguages();

    // Raw node list cached per login; filters apply after the cache boundary.
    const orgNodes = await withDataCache(`v1:ocl:${login.toLowerCase()}`, async () => {
        const res = await fetcher(token, {
            login: login,
            first: MAX_REPOS
        });

        assertNoGraphQLErrors(res, 'GetOrganizationCommitLanguage failed');

        const owner = res.data.data.repositoryOwner;
        if (!owner || owner.__typename !== 'Organization') {
            throw Error(`Organization not found: ${login}`);
        }
        return owner.repositories.nodes;
    });

    orgNodes.forEach(
        (node: {
            name: string;
            nameWithOwner: string;
            primaryLanguage: {name: string; color: string} | null;
            defaultBranchRef: {target: {history: {totalCount: number}}} | null;
        }) => {
            if (
                excludeRepos.includes((node.name ?? '').toLowerCase()) ||
                excludeRepos.includes((node.nameWithOwner ?? '').toLowerCase())
            ) {
                return;
            }
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
