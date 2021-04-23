import getProfileDetails from '../../src/github-api/profile-details';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const data = {
    data: {
        user: {
            id: 'userID',
            name: 'vn7',
            email: 'vn7n24fzkq@gmail.com',
            createdAt: '2016-07-01T10:46:25Z',
            twitterUsername: null,
            company: 'vn7',
            location: 'Taiwan',
            websiteUrl: null,
            repositories: {
                totalCount: 30,
                nodes: [
                    { stargazers: { totalCount: 110 } },
                    { stargazers: { totalCount: 20 } },
                ],
            },
            issues: { totalCount: 10 },
            repositoriesContributedTo: { totalCount: 30 },
            pullRequests: { totalCount: 40 },
            contributionsCollection: {
                contributionYears: [2019, 2020],
                contributionCalendar: {
                    weeks: [
                        {
                            contributionDays: [
                                {
                                    date: '2019-09-06T00:00:00.000+00:00',
                                    contributionCount: 20,
                                },
                                {
                                    date: '2019-09-07T00:00:00.000+00:00',
                                    contributionCount: 10,
                                },
                            ],
                        },
                        {
                            contributionDays: [
                                {
                                    date: '2020-01-12T00:00:00.000+00:00',
                                    contributionCount: 5,
                                },
                            ],
                        },
                    ],
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

describe('github api for profile details', () => {
    it('should get correct profile data', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, data);
        const profileDetails = await getProfileDetails('vn7n24fzkq');
        expect(profileDetails).toStrictEqual({
            id: 'userID',
            name: 'vn7',
            email: 'vn7n24fzkq@gmail.com',
            joinedAt: '2016-07-01T10:46:25Z',
            company: 'vn7',
            location: 'Taiwan',
            websiteUrl: null,
            twitterUsername: null,
            contributionYears: [2019, 2020],
            totalPublicRepos: 30,
            totalStars: 130,
            totalIssueContributions: 10,
            totalPullRequestContributions: 40,
            totalRepositoryContributions: 30,
            contributions: [
                {
                    date: new Date('2019-09-06T00:00:00.000+00:00'),
                    contributionCount: 20,
                },
                {
                    date: new Date('2019-09-07T00:00:00.000+00:00'),
                    contributionCount: 10,
                },
                {
                    date: new Date('2020-01-12T00:00:00.000+00:00'),
                    contributionCount: 5,
                },
            ],
        });
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getProfileDetails('vn7n24fzkq')).rejects.toThrow(
            'GitHub api failed'
        );
    });
});
