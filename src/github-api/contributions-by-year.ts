import request, {assertNoGraphQLErrors, GraphQLError} from '../utils/request';
import {withDataCache, jitteredSeconds, PrimedReads} from '../utils/data-cache';

const DAY = 24 * 60 * 60;

export class ConrtibutionByYear {
    year: number;
    totalCommitContributions: number;
    totalContributions: number;
    constructor(year: number, totalCommitContributions: number, totalContributions: number) {
        this.year = year;
        this.totalCommitContributions = totalCommitContributions;
        this.totalContributions = totalContributions;
    }
}

const fetcher = (token: string, variables: any) => {
    // Pass the year window as GraphQL variables ($from/$to) instead of
    // interpolating the year into the query string. Null from/to falls back to
    // GitHub's default range (the past year).
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query ContributionsByYear($login: String!, $from: DateTime, $to: DateTime) {
        user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
                totalCommitContributions
                contributionCalendar {
                    totalContributions
                }
            }
        }
      }
      `,
            variables
        }
    );
};

// Split variants of the query above. GitHub's cost estimator rejects the
// combined query with "Resource limits for this query exceeded" for some
// mega-contribution user-years (e.g. gaearon 2017: >10k commits) while each
// field queried on its own succeeds — same data, two cheaper documents.
const commitCountFetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query ContributionsByYearCommits($login: String!, $from: DateTime, $to: DateTime) {
        user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
                totalCommitContributions
            }
        }
      }
      `,
            variables
        }
    );
};

const calendarTotalFetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query ContributionsByYearCalendar($login: String!, $from: DateTime, $to: DateTime) {
        user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
                contributionCalendar {
                    totalContributions
                }
            }
        }
      }
      `,
            variables
        }
    );
};

/**
 * Cache key for one (user, year) contribution total — exported so callers
 * iterating many years can batch-read them with primeDataCache.
 *
 * @param {string} username - The GitHub login.
 * @param {number} year - The contribution year.
 * @return {string} The cache key.
 */
export function contributionYearCacheKey(username: string, year: number): string {
    return `v1:cy:${username.toLowerCase()}:${year}`;
}

export async function getContributionByYear(
    username: string,
    year: number,
    token: string,
    primed?: PrimedReads
): Promise<ConrtibutionByYear> {
    // Past years never change — cache them for much longer than the current one.
    // The fresh window is jittered per key (90d ± 15d) so keys cached in the
    // same burst don't all expire together; retention stays 10d past fresh so
    // the stale-rescue window survives a slow re-fetch cycle.
    const isPastYear = !!year && year < new Date().getFullYear();
    const key = contributionYearCacheKey(username, year);
    const freshSeconds = jitteredSeconds(key, 90 * DAY, 15 * DAY);
    const raw = await withDataCache(
        key,
        async () => {
            const variables = {
                login: username,
                from: year ? `${year}-01-01T00:00:00Z` : null,
                to: year ? `${year}-12-31T23:59:59Z` : null
            };
            try {
                const res = await fetcher(token, variables);
                assertNoGraphQLErrors(res, 'GetContributionByYear failed');
                const user = res.data.data.user;
                return {
                    totalCommitContributions: user.contributionsCollection.totalCommitContributions as number,
                    totalContributions: user.contributionsCollection.contributionCalendar.totalContributions as number
                };
            } catch (err) {
                if (!(err as GraphQLError).isResourceLimit) throw err;
                // Combined document rejected for this mega-contribution year —
                // fetch the same two numbers with one query each.
                const [commitsRes, calendarRes] = await Promise.all([
                    commitCountFetcher(token, variables),
                    calendarTotalFetcher(token, variables)
                ]);
                assertNoGraphQLErrors(commitsRes, 'GetContributionByYear (split commits) failed');
                assertNoGraphQLErrors(calendarRes, 'GetContributionByYear (split calendar) failed');
                return {
                    totalCommitContributions: commitsRes.data.data.user.contributionsCollection
                        .totalCommitContributions as number,
                    totalContributions: calendarRes.data.data.user.contributionsCollection.contributionCalendar
                        .totalContributions as number
                };
            }
        },
        isPastYear ? {freshSeconds, retentionSeconds: freshSeconds + 10 * DAY, primed} : {primed}
    );

    return new ConrtibutionByYear(year, raw.totalCommitContributions, raw.totalContributions);
}
