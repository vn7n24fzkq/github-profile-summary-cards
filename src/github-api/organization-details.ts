import request from '../utils/request';

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
    totalMembers: number = 0;
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
    // contain private member info need token permission
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query OrganizationDetails($login: String!, $endCursor: String) {
        organization(login: $login) {
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
            membersWithRole {
                totalCount
            }
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
      `,
            variables
        }
    );
};

export async function getOrganizationDetails(login: string, token: string): Promise<OrganizationDetails> {
    let hasNextPage = true;
    let cursor: string | null = null;
    let organizationDetails: OrganizationDetails | null = null;

    while (hasNextPage) {
        const res: any = await fetcher(token, {
            login: login,
            endCursor: cursor
        });

        if (res.data.errors) {
            throw Error(res.data.errors[0].message || 'GetOrganizationDetails failed');
        }

        const org = res.data.data.organization;
        if (!org) {
            throw Error(`Organization not found: ${login}`);
        }

        if (organizationDetails === null) {
            organizationDetails = new OrganizationDetails(org.id, org.login, org.name, org.createdAt);
            organizationDetails.description = org.description;
            organizationDetails.email = org.email || null;
            organizationDetails.location = org.location;
            organizationDetails.websiteUrl = org.websiteUrl;
            organizationDetails.twitterUsername = org.twitterUsername;
            organizationDetails.isVerified = !!org.isVerified;
            organizationDetails.totalMembers = org.membersWithRole.totalCount;
            organizationDetails.totalPublicRepos = org.repositories.totalCount;
        }

        for (const node of org.repositories.nodes) {
            organizationDetails.totalStars += node.stargazers.totalCount;
            organizationDetails.totalForks += node.forkCount;
            organizationDetails.totalOpenIssues += node.issues.totalCount;
            organizationDetails.repoCreatedAt.push(new Date(node.createdAt));
        }

        cursor = org.repositories.pageInfo.endCursor;
        hasNextPage = org.repositories.pageInfo.hasNextPage;
    }

    return organizationDetails!;
}
