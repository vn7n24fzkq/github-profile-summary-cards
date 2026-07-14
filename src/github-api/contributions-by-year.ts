import request, {assertNoGraphQLErrors} from '../utils/request';

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
    const res = await fetcher(token, {
        login: username,
        from: year ? `${year}-01-01T00:00:00Z` : null,
        to: year ? `${year}-12-31T23:59:59Z` : null
    });

    assertNoGraphQLErrors(res, 'GetContributionByYear failed');

    const user = res.data.data.user;

    const result = new ConrtibutionByYear(
        year,
        user.contributionsCollection.totalCommitContributions,
        user.contributionsCollection.contributionCalendar.totalContributions
    );
    return result;
}
