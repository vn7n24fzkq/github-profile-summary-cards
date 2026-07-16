import request, {assertNoGraphQLErrors, GraphQLError} from '../utils/request';
import {shouldFetchNextPage} from '../const/pagination';
import {withDataCache} from '../utils/data-cache';

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
            repositories(first: 100,privacy:PUBLIC, isFork: false, ownerAffiliations: OWNER) {
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

// ---- Split variants of UserDetails ----
// GitHub's cost estimator scores the whole document; for very active accounts
// the combined UserDetails query is rejected with "Resource limits for this
// query exceeded" while smaller documents pass. The split keeps the exact same
// fields, just spread across three cheaper queries (plus a half-window
// calendar fallback for the most extreme accounts).

const coreFetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query UserDetailsCore($login: String!) {
        user(login: $login) {
            id
            name
            email
            createdAt
            twitterUsername
            company
            location
            websiteUrl
            repositories(first: 100,privacy:PUBLIC, isFork: false, ownerAffiliations: OWNER) {
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
        }
      }
      `,
            variables
        }
    );
};

const calendarFetcher = (token: string, variables: any) => {
    // Null from/to falls back to GitHub's default trailing-year window.
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query UserDetailsCalendar($login: String!, $from: DateTime, $to: DateTime) {
        user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
                contributionCalendar {
                    weeks {
                        contributionDays {
                            contributionCount
                            date
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

const contributionYearsFetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query UserDetailsYears($login: String!) {
        user(login: $login) {
            contributionsCollection {
                contributionYears
            }
        }
      }
      `,
            variables
        }
    );
};

const countsFetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query UserDetailsCounts($login: String!) {
        user(login: $login) {
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

type CalendarWeek = {contributionDays: {contributionCount: number; date: string}[]};

async function fetchCalendarWeeks(username: string, token: string): Promise<CalendarWeek[]> {
    try {
        const res = await calendarFetcher(token, {login: username, from: null, to: null});
        assertNoGraphQLErrors(res, 'GetProfileDetails (calendar) failed');
        return res.data.data.user.contributionsCollection.contributionCalendar.weeks;
    } catch (err) {
        if (!(err as GraphQLError).isResourceLimit) throw err;
        // Even the trailing-year calendar alone is rejected for the most active
        // accounts — two disjoint half-windows score low enough to pass, and
        // their days concatenate into the same daily series. The seam sits on a
        // UTC day boundary: the calendar buckets by day, so a mid-day cut would
        // put the boundary date into both halves.
        const DAY_MS = 24 * 60 * 60 * 1000;
        const now = new Date();
        const todayStartUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const midStart = new Date(todayStartUtc - 182 * DAY_MS); // 00:00:00Z — first day of H2
        const start = new Date(todayStartUtc - 364 * DAY_MS);
        const [h1, h2] = await Promise.all([
            calendarFetcher(token, {
                login: username,
                from: start.toISOString(),
                to: new Date(midStart.getTime() - 1).toISOString() // 23:59:59.999Z of H1's last day
            }),
            calendarFetcher(token, {
                login: username,
                from: midStart.toISOString(),
                to: now.toISOString()
            })
        ]);
        assertNoGraphQLErrors(h1, 'GetProfileDetails (calendar H1) failed');
        assertNoGraphQLErrors(h2, 'GetProfileDetails (calendar H2) failed');
        return [
            ...h1.data.data.user.contributionsCollection.contributionCalendar.weeks,
            ...h2.data.data.user.contributionsCollection.contributionCalendar.weeks
        ];
    }
}

// Rebuilds the exact `user` object shape of the combined UserDetails query
// from the three split queries, so the code after the cache boundary doesn't
// care which path produced it.
async function fetchUserDetailsSplit(username: string, token: string): Promise<any> {
    const [coreRes, weeks, yearsRes, countsRes] = await Promise.all([
        coreFetcher(token, {login: username}),
        fetchCalendarWeeks(username, token),
        contributionYearsFetcher(token, {login: username}),
        countsFetcher(token, {login: username})
    ]);
    assertNoGraphQLErrors(coreRes, 'GetProfileDetails (core) failed');
    assertNoGraphQLErrors(yearsRes, 'GetProfileDetails (years) failed');
    assertNoGraphQLErrors(countsRes, 'GetProfileDetails (counts) failed');
    const core = coreRes.data.data.user;
    const counts = countsRes.data.data.user;
    return {
        ...core,
        contributionsCollection: {
            contributionCalendar: {weeks},
            contributionYears: yearsRes.data.data.user.contributionsCollection.contributionYears
        },
        repositoriesContributedTo: counts.repositoriesContributedTo,
        pullRequests: counts.pullRequests,
        issues: counts.issues
    };
}

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
            repositories(first: 100, after: $endCursor, privacy:PUBLIC, isFork: false, ownerAffiliations: OWNER) {
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
    // Cache the raw user payload + the fully paginated star total per username.
    // The ProfileDetails instance (with real Date objects) is built after the
    // cache boundary so only plain JSON is ever stored.
    const {user, totalStars} = await withDataCache(`v1:pd:${username.toLowerCase()}`, async () => {
        let fetchedUser: any;
        try {
            const res = await fetcher(token, {
                login: username
            });
            assertNoGraphQLErrors(res, 'GetProfileDetails failed');
            fetchedUser = res.data.data.user;
        } catch (err) {
            if (!(err as GraphQLError).isResourceLimit) throw err;
            // The combined document was rejected for this very active account —
            // fetch the same fields via three smaller queries instead.
            fetchedUser = await fetchUserDetailsSplit(username, token);
        }
        let stars: number = fetchedUser.repositories.nodes.reduce(
            (acc: number, curr: {stargazers: {totalCount: number}}) => acc + curr.stargazers.totalCount,
            0
        );

        // The main query only covers the first 100 repos; accounts with more were
        // undercounting stars (#164). Keep summing with the lightweight star-only
        // query — unbounded off Vercel, bounded on it (see src/const/pagination.ts).
        const starsStartedAt = Date.now();
        let starsCursor: string | null = fetchedUser.repositories.pageInfo?.endCursor ?? null;
        let starsPages = 1;
        let starsHasNextPage = shouldFetchNextPage(
            !!fetchedUser.repositories.pageInfo?.hasNextPage,
            starsPages,
            undefined,
            starsStartedAt
        );
        while (starsHasNextPage && starsCursor) {
            const starsRes: any = await starsFetcher(token, {login: username, endCursor: starsCursor});
            assertNoGraphQLErrors(starsRes, 'GetProfileDetails failed');
            const repos = starsRes.data.data.user.repositories;
            stars += repos.nodes.reduce(
                (acc: number, curr: {stargazers: {totalCount: number}}) => acc + curr.stargazers.totalCount,
                0
            );
            starsCursor = repos.pageInfo?.endCursor ?? null;
            starsPages += 1;
            starsHasNextPage = shouldFetchNextPage(
                !!repos.pageInfo?.hasNextPage,
                starsPages,
                undefined,
                starsStartedAt
            );
        }

        return {user: fetchedUser, totalStars: stars};
    });

    const profileDetails = new ProfileDetails(user.id, user.name, user.email, user.createdAt);
    profileDetails.totalPublicRepos = user.repositories.totalCount;
    profileDetails.totalStars = totalStars;
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
