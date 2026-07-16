import request, {assertNoGraphQLErrors} from '../utils/request';
import {shouldFetchNextPage} from '../const/pagination';

export class ProfileDetails {
    id: number; // user id
    name: string;
    email: string;
    createdAt: string;
    company: string | null = null;
    websiteUrl: string | null = null;
    twitterUsername: string | null = null;
    location: string | null = null;
    totalPublicRepos: number = 0;
    totalStars: number = 0;
    totalIssueContributions: number = 0;
    totalPullRequestContributions: number = 0;
    totalRepositoryContributions: number = 0;
    contributions: ProfileContribution[] = [];
    contributionYears: number[] = [];
    constructor(id: number, name: string, email: string, createdAt: string) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.createdAt = createdAt;
    }
}

export class ProfileContribution {
    contributionCount: number = 0;
    date: Date;
    constructor(date: Date, count: number) {
        this.date = date;
        this.contributionCount = count;
    }
}

const fetcher = (token: string, variables: any) => {
    // contain private need token permission
    // contributionsCollection default to a year ago
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query UserDetails($login: String!) {
        user(login: $login) {
            id
            name
            email
            createdAt
            twitterUsername
            company
            location
            websiteUrl
            repositories(first: 100,privacy:PUBLIC, isFork: false, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
              totalCount
              nodes {
                stargazers {
                  totalCount
                }
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
            contributionsCollection {
                contributionCalendar {
                    weeks {
                        contributionDays {
                            contributionCount
                            date
                        }
                    }
                }
                contributionYears
            }
            repositoriesContributedTo(first: 1,includeUserRepositories:true, privacy:PUBLIC, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
                totalCount
            }
            pullRequests(first: 1) {
                totalCount
            }
            issues(first: 1) {
                totalCount
            }
        }
      }

      `,
            variables
        }
    );
};

// Lightweight follow-up query used only to finish the star count for accounts
// with more than 100 repos — the heavy fields (contribution calendar etc.) all
// come from the first page.
const starsFetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query UserStars($login: String!, $endCursor: String!) {
        user(login: $login) {
            repositories(first: 100, after: $endCursor, privacy:PUBLIC, isFork: false, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
              nodes {
                stargazers {
                  totalCount
                }
              }
              pageInfo {
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

export async function getProfileDetails(username: string, token: string): Promise<ProfileDetails> {
    const res = await fetcher(token, {
        login: username
    });

    assertNoGraphQLErrors(res, 'GetProfileDetails failed');

    const user = res.data.data.user;
    const profileDetails = new ProfileDetails(user.id, user.name, user.email, user.createdAt);
    profileDetails.totalPublicRepos = user.repositories.totalCount;
    profileDetails.totalStars = user.repositories.nodes.reduce(
        (stars: number, curr: {stargazers: {totalCount: number}}) => {
            return stars + curr.stargazers.totalCount;
        },
        0
    );

    // The main query only covers the first 100 repos; accounts with more were
    // undercounting stars (#164). Keep summing with the lightweight star-only
    // query — unbounded off Vercel, bounded on it (see src/const/pagination.ts).
    let starsCursor: string | null = user.repositories.pageInfo?.endCursor ?? null;
    let starsPages = 1;
    let starsHasNextPage = shouldFetchNextPage(!!user.repositories.pageInfo?.hasNextPage, starsPages);
    while (starsHasNextPage && starsCursor) {
        const starsRes: any = await starsFetcher(token, {login: username, endCursor: starsCursor});
        assertNoGraphQLErrors(starsRes, 'GetProfileDetails failed');
        const repos = starsRes.data.data.user.repositories;
        profileDetails.totalStars += repos.nodes.reduce(
            (stars: number, curr: {stargazers: {totalCount: number}}) => stars + curr.stargazers.totalCount,
            0
        );
        starsCursor = repos.pageInfo?.endCursor ?? null;
        starsPages += 1;
        starsHasNextPage = shouldFetchNextPage(!!repos.pageInfo?.hasNextPage, starsPages);
    }
    profileDetails.websiteUrl = user.websiteUrl;
    profileDetails.totalIssueContributions = user.issues.totalCount;
    profileDetails.totalPullRequestContributions = user.pullRequests.totalCount;
    profileDetails.totalRepositoryContributions = user.repositoriesContributedTo.totalCount;
    profileDetails.company = user.company;
    profileDetails.location = user.location;
    profileDetails.twitterUsername = user.twitterUsername;
    profileDetails.contributionYears = user.contributionsCollection.contributionYears;

    // contributions into array
    for (const week of user.contributionsCollection.contributionCalendar.weeks) {
        for (const day of week.contributionDays) {
            profileDetails.contributions.push(new ProfileContribution(new Date(day.date), day.contributionCount));
        }
    }

    return profileDetails;
}
