import request, {assertNoGraphQLErrors} from '../utils/request';
import {withDataCache} from '../utils/data-cache';

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

export async function getContributionByYear(
    username: string,
    year: number,
    token: string
): Promise<ConrtibutionByYear> {
    // Past years never change — cache them for much longer than the current one.
    const isPastYear = !!year && year < new Date().getFullYear();
    const raw = await withDataCache(
        `v1:cy:${username.toLowerCase()}:${year}`,
        async () => {
            const res = await fetcher(token, {
                login: username,
                from: year ? `${year}-01-01T00:00:00Z` : null,
                to: year ? `${year}-12-31T23:59:59Z` : null
            });

            assertNoGraphQLErrors(res, 'GetContributionByYear failed');

            const user = res.data.data.user;
            return {
                totalCommitContributions: user.contributionsCollection.totalCommitContributions as number,
                totalContributions: user.contributionsCollection.contributionCalendar.totalContributions as number
            };
        },
        isPastYear ? 30 * 24 * 60 * 60 : undefined
    );

    return new ConrtibutionByYear(year, raw.totalCommitContributions, raw.totalContributions);
}
