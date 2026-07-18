import {getContributionByYear} from '../../src/github-api/contributions-by-year';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const data = {
    data: {
        user: {
            contributionsCollection: {
                totalCommitContributions: 30,
                contributionCalendar: {
                    totalContributions: 10
                }
            }
        }
    }
};

const error = {
    errors: [
        {
            type: 'NOT_FOUND',
            path: ['user'],
            locations: [],
            message: 'GitHub api failed'
        }
    ]
};

afterEach(() => {
    mock.reset();
});

describe('contributions count on github', () => {
    it('should get correct contributions', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, data);
        const totalContributions = await getContributionByYear('vn7n24fzkq', 2020, 'token');
        expect(totalContributions).toEqual({
            totalCommitContributions: 30,
            totalContributions: 10,
            year: 2020
        });
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getContributionByYear('vn7n24fzkq', 2020, 'token')).rejects.toThrow('GitHub api failed');
    });

    it('falls back to split queries when the combined one hits GitHub resource limits', async () => {
        const resourceLimit = {
            errors: [{type: 'EXCESSIVE_PAGINATION', message: 'Resource limits for this query exceeded.'}]
        };
        const commitsOnly = {
            data: {user: {contributionsCollection: {totalCommitContributions: 10270}}}
        };
        const calendarOnly = {
            data: {user: {contributionsCollection: {contributionCalendar: {totalContributions: 11929}}}}
        };
        mock.onPost('https://api.github.com/graphql').replyOnce(200, resourceLimit);
        // The two split queries fire in parallel; route them by operation name.
        mock.onPost('https://api.github.com/graphql').reply(config => {
            const body = JSON.parse(config.data);
            if (body.query.includes('ContributionsByYearCommits')) return [200, commitsOnly];
            if (body.query.includes('ContributionsByYearCalendar')) return [200, calendarOnly];
            return [500, {}];
        });

        const result = await getContributionByYear('gaearon', 2017, 'token');
        expect(result).toEqual({
            totalCommitContributions: 10270,
            totalContributions: 11929,
            year: 2017
        });
    });

    it('also falls back to split queries on an HTTP 502 gateway timeout', async () => {
        const commitsOnly = {
            data: {user: {contributionsCollection: {totalCommitContributions: 10270}}}
        };
        const calendarOnly = {
            data: {user: {contributionsCollection: {contributionCalendar: {totalContributions: 11929}}}}
        };
        // The combined query times out at the gateway (502) on every attempt; the
        // two split queries succeed. 502 must trigger the same split as a
        // resource-limit rejection does.
        mock.onPost('https://api.github.com/graphql').reply(config => {
            const body = JSON.parse(config.data);
            if (body.query.includes('ContributionsByYearCommits')) return [200, commitsOnly];
            if (body.query.includes('ContributionsByYearCalendar')) return [200, calendarOnly];
            return [502, {}];
        });

        const result = await getContributionByYear('gaearon', 2017, 'token');
        expect(result).toEqual({
            totalCommitContributions: 10270,
            totalContributions: 11929,
            year: 2017
        });
    }, 20000);

    it('does not split on non-resource-limit errors', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getContributionByYear('vn7n24fzkq', 2020, 'token')).rejects.toThrow('GitHub api failed');
        // one combined attempt, no fallback requests
        expect(mock.history.post).toHaveLength(1);
    });

    it('propagates errors from the split queries themselves', async () => {
        const resourceLimit = {
            errors: [{message: 'Resource limits for this query exceeded.'}]
        };
        mock.onPost('https://api.github.com/graphql').reply(200, resourceLimit);
        await expect(getContributionByYear('gaearon', 2017, 'token')).rejects.toThrow(/resource limits/i);
    });
});
