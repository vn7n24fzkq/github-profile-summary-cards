import getContributionByYear from '../../src/github-api/contributions-by-year';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const data = {
    data: {
        user: {
            contributionsCollection: {
                totalCommitContributions: 30,
                contributionCalendar: {
                    totalContributions: 10,
                },
            },
        },
    },
};

const error = {
    errors: [
        {
            type: 'NOT_FOUND',
            path: ['user'],
            locations: [],
            message: 'GitHub api failed',
        },
    ],
};

afterEach(() => {
    mock.reset();
});

describe('contributions count on github', () => {
    it('should get correct contributions', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, data);
        const totalContributions = await getContributionByYear(
            'vn7n24fzkq',
            2020
        );
        expect(totalContributions).toStrictEqual({
            totalCommitContributions: 30,
            totalContributions: 10,
        });
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getContributionByYear('vn7n24fzkq', 2020)).rejects.toThrow(
            'GitHub api failed'
        );
    });
});
