import request from '../utils/request';

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

const fetcher = (token: string, variables: any, year: number) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query ContributionsByYear($login: String!) {
        user(login: $login) {
            ${
                year
                    ? `contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {`
                    : 'contributionsCollection {'
            }
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

export async function getContributionByYear(username: string, year: number): Promise<ConrtibutionByYear> {
    const res = await fetcher(
        process.env.GITHUB_TOKEN!,
        {
            login: username
        },
        year
    );

    if (res.data.errors) {
        throw Error(res.data.errors[0].message || 'GetContributionByYear failed');
    }

    const user = res.data.data.user;

    const result = new ConrtibutionByYear(
        year,
        user.contributionsCollection.totalCommitContributions,
        user.contributionsCollection.contributionCalendar.totalContributions
    );
    return result;
}
