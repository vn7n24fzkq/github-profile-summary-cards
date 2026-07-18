import request, {assertNoGraphQLErrors, isTooExpensive} from '../utils/request';
import {shouldFetchNextPage} from '../const/pagination';
import {withDataCache, kvGetFlag, kvSetFlag, requestStartedAt} from '../utils/data-cache';

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
        if (!isTooExpensive(err)) throw err;
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
// care which path produced it. Star pagination starts as soon as the core
// query (which owns the first page's cursor) resolves and runs CONCURRENTLY
// with the calendar/years/counts queries — the split path only exists for
// very active accounts, exactly the ones with many star pages, and running
// the two serially is what pushed sindresorhus-class renders past Vercel's
// 30s kill (killed functions cache nothing, so they never converged).
async function fetchUserDetailsSplit(
    username: string,
    token: string,
    startedAt: number
): Promise<{user: any; totalStars: number}> {
    const corePromise = coreFetcher(token, {login: username});
    const starsPromise = corePromise.then(coreRes => {
        assertNoGraphQLErrors(coreRes, 'GetProfileDetails (core) failed');
        return paginateStars(coreRes.data.data.user.repositories, username, token, startedAt);
    });
    const [coreRes, totalStars, weeks, yearsRes, countsRes] = await Promise.all([
        corePromise,
        starsPromise,
        fetchCalendarWeeks(username, token),
        contributionYearsFetcher(token, {login: username}),
        countsFetcher(token, {login: username})
    ]);
    assertNoGraphQLErrors(yearsRes, 'GetProfileDetails (years) failed');
    assertNoGraphQLErrors(countsRes, 'GetProfileDetails (counts) failed');
    const core = coreRes.data.data.user;
    const counts = countsRes.data.data.user;
    return {
        user: {
            ...core,
            contributionsCollection: {
                contributionCalendar: {weeks},
                contributionYears: yearsRes.data.data.user.contributionsCollection.contributionYears
            },
            repositoriesContributedTo: counts.repositoriesContributedTo,
            pullRequests: counts.pullRequests,
            issues: counts.issues
        },
        totalStars
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

// ---- compact cache payload ----
// The raw user object is dominated by the contribution calendar: ~365 verbose
// day objects pushed the cached profile to ~19KB, and profile keys were the
// biggest consumer of the Upstash free plan's 256MB. The calendar is a run of
// consecutive days, so it compresses to a start date plus a counts array
// (~1.5KB total — roughly 3x more accounts fit in the same storage). Days are
// verified consecutive during compression; any gap falls back to explicit
// [date, count] pairs rather than silently shifting dates.
interface CompactProfilePayload {
    core: {
        id: number;
        name: string;
        email: string;
        createdAt: string;
        twitterUsername: string | null;
        company: string | null;
        location: string | null;
        websiteUrl: string | null;
    };
    totalPublicRepos: number;
    totalStars: number;
    issues: number;
    prs: number;
    contributedTo: number;
    years: number[];
    cal: {start: string; counts: number[]} | {days: [string, number][]};
}

const DAY_MS = 24 * 60 * 60 * 1000;

function compressProfile(user: any, totalStars: number): CompactProfilePayload {
    const days: {date: string; contributionCount: number}[] = [];
    for (const week of user.contributionsCollection.contributionCalendar.weeks) {
        for (const day of week.contributionDays) {
            days.push(day);
        }
    }
    let consecutive = days.length > 0;
    for (let i = 1; i < days.length && consecutive; i++) {
        if (new Date(days[i].date).getTime() - new Date(days[i - 1].date).getTime() !== DAY_MS) {
            consecutive = false;
        }
    }
    return {
        core: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            twitterUsername: user.twitterUsername,
            company: user.company,
            location: user.location,
            websiteUrl: user.websiteUrl
        },
        totalPublicRepos: user.repositories.totalCount,
        totalStars,
        issues: user.issues.totalCount,
        prs: user.pullRequests.totalCount,
        contributedTo: user.repositoriesContributedTo.totalCount,
        years: user.contributionsCollection.contributionYears,
        cal: consecutive
            ? {start: days[0].date, counts: days.map(d => d.contributionCount)}
            : {days: days.map(d => [d.date, d.contributionCount] as [string, number])}
    };
}

function expandContributions(cal: CompactProfilePayload['cal']): ProfileContribution[] {
    if ('days' in cal) {
        return cal.days.map(([date, count]) => new ProfileContribution(new Date(date), count));
    }
    const startMs = new Date(cal.start).getTime();
    return cal.counts.map((count, i) => new ProfileContribution(new Date(startMs + i * DAY_MS), count));
}

// One deadline for the WHOLE profile fetch — the slow-reject of the combined
// query, the split fallback chain and star pagination all share it. Separate
// clocks let the phases stack to ~27s and past Vercel's 30s kill (a killed
// function caches nothing, so the account never converged).
const PD_FETCH_BUDGET_MS = 20 * 1000;

// Accounts whose combined UserDetails is rejected by GitHub's cost estimator
// get flagged so subsequent fetches skip straight to the split (the reject
// itself costs ~6s of the budget).
const SPLIT_FLAG_TTL_SECONDS = 30 * 24 * 60 * 60;

function splitFlagKey(username: string): string {
    return `v1:pdx:${username.toLowerCase()}`;
}

// The main query only covers the first 100 repos; accounts with more were
// undercounting stars (#164). Keep summing with the lightweight star-only
// query — unbounded off Vercel, bounded on it. The budget is measured from
// the profile fetch's start, not the pagination's, so the phases can't stack.
async function paginateStars(firstPage: any, username: string, token: string, startedAt: number): Promise<number> {
    let stars: number = firstPage.nodes.reduce(
        (acc: number, curr: {stargazers: {totalCount: number}}) => acc + curr.stargazers.totalCount,
        0
    );
    let starsCursor: string | null = firstPage.pageInfo?.endCursor ?? null;
    let starsPages = 1;
    let starsHasNextPage = shouldFetchNextPage(
        !!firstPage.pageInfo?.hasNextPage,
        starsPages,
        undefined,
        startedAt,
        PD_FETCH_BUDGET_MS
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
            startedAt,
            PD_FETCH_BUDGET_MS
        );
    }
    return stars;
}

export async function getProfileDetails(username: string, token: string): Promise<ProfileDetails> {
    // Cache a COMPACT payload per username (see compressProfile). The
    // ProfileDetails instance (with real Date objects) is built after the
    // cache boundary so only plain JSON is ever stored.
    const compact = await withDataCache(`v2:pd:${username.toLowerCase()}`, async () => {
        // Measure from the REQUEST start (rotation retries share the deadline);
        // outside a request context (Action/CLI) fall back to a local clock.
        const startedAt = requestStartedAt() ?? Date.now();
        if (process.env.VERCEL && Date.now() - startedAt > PD_FETCH_BUDGET_MS) {
            // A rotation retry (or an earlier heavy phase) already spent the
            // budget — fail fast so stale rescue / the error card takes over
            // instead of a 30s FUNCTION_INVOCATION_TIMEOUT that caches nothing.
            throw new Error(`Profile fetch for ${username} timed out before completion`);
        }
        let fetchedUser: any = null;
        let totalStars: number | null = null;
        const useSplit = await kvGetFlag(splitFlagKey(username));
        if (!useSplit) {
            try {
                const res = await fetcher(token, {
                    login: username
                });
                assertNoGraphQLErrors(res, 'GetProfileDetails failed');
                fetchedUser = res.data.data.user;
            } catch (err) {
                if (!isTooExpensive(err)) throw err;
                // Remember the rejection so the next fetch skips the ~6s
                // slow-reject and goes straight to the split.
                void kvSetFlag(splitFlagKey(username), SPLIT_FLAG_TTL_SECONDS);
            }
        }
        if (fetchedUser === null) {
            // Rejected now or flagged earlier — same fields via three smaller
            // queries, with star pagination running concurrently.
            const split = await fetchUserDetailsSplit(username, token, startedAt);
            fetchedUser = split.user;
            totalStars = split.totalStars;
        }
        if (totalStars === null) {
            totalStars = await paginateStars(fetchedUser.repositories, username, token, startedAt);
        }

        return compressProfile(fetchedUser, totalStars);
    });

    const {core} = compact;
    const profileDetails = new ProfileDetails(core.id, core.name, core.email, core.createdAt);
    profileDetails.totalPublicRepos = compact.totalPublicRepos;
    profileDetails.totalStars = compact.totalStars;
    profileDetails.websiteUrl = core.websiteUrl;
    profileDetails.totalIssueContributions = compact.issues;
    profileDetails.totalPullRequestContributions = compact.prs;
    profileDetails.totalRepositoryContributions = compact.contributedTo;
    profileDetails.company = core.company;
    profileDetails.location = core.location;
    profileDetails.twitterUsername = core.twitterUsername;
    profileDetails.contributionYears = compact.years;
    profileDetails.contributions = expandContributions(compact.cal);

    return profileDetails;
}
