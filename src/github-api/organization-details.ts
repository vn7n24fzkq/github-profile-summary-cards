import request, {assertNoGraphQLErrors} from '../utils/request';

export class OrganizationDetails {
    id: number;
    login: string;
    name: string;
    createdAt: string;
    description: string | null = null;
    email: string | null = null;
    location: string | null = null;
    websiteUrl: string | null = null;
    twitterUsername: string | null = null;
    isVerified: boolean = false;
    totalPublicRepos: number = 0;
    totalStars: number = 0;
    totalForks: number = 0;
    totalOpenIssues: number = 0;
    repoCreatedAt: Date[] = [];
    constructor(id: number, login: string, name: string, createdAt: string) {
        this.id = id;
        this.login = login;
        this.name = name;
        this.createdAt = createdAt;
    }
}

const fetcher = (token: string, variables: any) => {
    // Query via `repositoryOwner` + an Organization fragment rather than the
    // `organization` root field: the latter requires the `read:org` scope for
    // every field (even login/name), which we deliberately don't grant — a
    // public card service must only ever read public data with a shared token.
    // `repositoryOwner` exposes exactly the public owner data and needs no scope.
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query OrganizationDetails($login: String!, $endCursor: String) {
        repositoryOwner(login: $login) {
            __typename
            ... on Organization {
                id
                login
                name
                description
                email
                location
                websiteUrl
                twitterUsername
                createdAt
                isVerified
                repositories(first: 100, after: $endCursor, privacy: PUBLIC, isFork: false, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
                    totalCount
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                    nodes {
                        createdAt
                        forkCount
                        stargazers {
                            totalCount
                        }
                        issues(states: OPEN) {
                            totalCount
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

export async function getOrganizationDetails(login: string, token: string): Promise<OrganizationDetails> {
    // On Vercel (shared token + 10s timeout) fetch only the top 100 repos by stars
    // in one query. Run as a GitHub Action / CLI (own token, no timeout) paginate
    // every repo for accurate totals. totalPublicRepos is always exact (totalCount).
    let organizationDetails: OrganizationDetails | null = null;
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
        const res: any = await fetcher(token, {login: login, endCursor: cursor});

        assertNoGraphQLErrors(res, 'GetOrganizationDetails failed');

        const owner = res.data.data.repositoryOwner;
        if (!owner || owner.__typename !== 'Organization') {
            throw Error(`Organization not found: ${login}`);
        }
        const org = owner;

        if (organizationDetails === null) {
            organizationDetails = new OrganizationDetails(org.id, org.login, org.name, org.createdAt);
            organizationDetails.description = org.description;
            organizationDetails.email = org.email || null;
            organizationDetails.location = org.location;
            organizationDetails.websiteUrl = org.websiteUrl;
            organizationDetails.twitterUsername = org.twitterUsername;
            organizationDetails.isVerified = !!org.isVerified;
            organizationDetails.totalPublicRepos = org.repositories.totalCount;
        }

        for (const node of org.repositories.nodes) {
            organizationDetails.totalStars += node.stargazers.totalCount;
            organizationDetails.totalForks += node.forkCount;
            organizationDetails.totalOpenIssues += node.issues.totalCount;
            organizationDetails.repoCreatedAt.push(new Date(node.createdAt));
        }

        cursor = org.repositories.pageInfo?.endCursor ?? null;
        hasNextPage = !process.env.VERCEL && !!org.repositories.pageInfo?.hasNextPage;
    }

    return organizationDetails!;
}
