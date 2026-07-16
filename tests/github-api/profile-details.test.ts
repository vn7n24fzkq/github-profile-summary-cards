import {getProfileDetails} from '../../src/github-api/profile-details';
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
                nodes: [{stargazers: {totalCount: 110}}, {stargazers: {totalCount: 20}}]
            },
            issues: {totalCount: 10},
            repositoriesContributedTo: {totalCount: 30},
            pullRequests: {totalCount: 40},
            contributionsCollection: {
                contributionYears: [2019, 2020],
                contributionCalendar: {
                    weeks: [
                        {
                            contributionDays: [
                                {
                                    date: '2019-09-06T00:00:00.000+00:00',
                                    contributionCount: 20
                                },
                                {
                                    date: '2019-09-07T00:00:00.000+00:00',
                                    contributionCount: 10
                                }
                            ]
                        },
                        {
                            contributionDays: [
                                {
                                    date: '2020-01-12T00:00:00.000+00:00',
                                    contributionCount: 5
                                }
                            ]
                        }
                    ]
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

describe('github api for profile details', () => {
    it('should get correct profile data', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, data);
        const profileDetails = await getProfileDetails('vn7n24fzkq', 'token');
        expect(profileDetails).toEqual({
            id: 'userID',
            name: 'vn7',
            email: 'vn7n24fzkq@gmail.com',
            createdAt: '2016-07-01T10:46:25Z',
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
                    contributionCount: 20
                },
                {
                    date: new Date('2019-09-07T00:00:00.000+00:00'),
                    contributionCount: 10
                },
                {
                    date: new Date('2020-01-12T00:00:00.000+00:00'),
                    contributionCount: 5
                }
            ]
        });
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getProfileDetails('vn7n24fzkq', 'token')).rejects.toThrow('GitHub api failed');
    });

    it('falls back to split queries when the combined document hits resource limits', async () => {
        const resourceLimit = {errors: [{message: 'Resource limits for this query exceeded.'}]};
        const u = data.data.user;
        mock.onPost('https://api.github.com/graphql').reply(config => {
            const body = JSON.parse(config.data);
            if (body.query.includes('query UserDetails(')) return [200, resourceLimit];
            if (body.query.includes('UserDetailsCore')) {
                return [
                    200,
                    {
                        data: {
                            user: {
                                id: u.id,
                                name: u.name,
                                email: u.email,
                                createdAt: u.createdAt,
                                twitterUsername: u.twitterUsername,
                                company: u.company,
                                location: u.location,
                                websiteUrl: u.websiteUrl,
                                repositories: u.repositories
                            }
                        }
                    }
                ];
            }
            if (body.query.includes('UserDetailsCalendar')) {
                return [
                    200,
                    {
                        data: {
                            user: {
                                contributionsCollection: {
                                    contributionCalendar: u.contributionsCollection.contributionCalendar
                                }
                            }
                        }
                    }
                ];
            }
            if (body.query.includes('UserDetailsYears')) {
                return [200, {data: {user: {contributionsCollection: {contributionYears: [2019, 2020]}}}}];
            }
            if (body.query.includes('UserDetailsCounts')) {
                return [
                    200,
                    {
                        data: {
                            user: {
                                repositoriesContributedTo: u.repositoriesContributedTo,
                                pullRequests: u.pullRequests,
                                issues: u.issues
                            }
                        }
                    }
                ];
            }
            return [500, {}];
        });

        const profileDetails = await getProfileDetails('antroll', 'token');
        // identical result to the combined-query path
        expect(profileDetails.totalStars).toBe(130);
        expect(profileDetails.totalPullRequestContributions).toBe(40);
        expect(profileDetails.totalRepositoryContributions).toBe(30);
        expect(profileDetails.contributionYears).toEqual([2019, 2020]);
        expect(profileDetails.contributions).toHaveLength(3);
    });

    it('merges two half-window calendars when even the calendar alone is rejected', async () => {
        const resourceLimit = {errors: [{message: 'Resource limits for this query exceeded.'}]};
        const u = data.data.user;
        const week = (date: string, count: number) => ({contributionDays: [{date, contributionCount: count}]});
        const calendarWindows: {from: string; to: string}[] = [];
        mock.onPost('https://api.github.com/graphql').reply(config => {
            const body = JSON.parse(config.data);
            const vars = body.variables ?? {};
            if (body.query.includes('query UserDetails(')) return [200, resourceLimit];
            if (body.query.includes('UserDetailsCalendar')) {
                // full trailing-year window (null from/to) rejected; halves pass
                if (!vars.from) return [200, resourceLimit];
                calendarWindows.push({from: vars.from, to: vars.to});
                const isFirstHalf = new Date(vars.from).getTime() < Date.now() - 200 * 24 * 3600 * 1000;
                return [
                    200,
                    {
                        data: {
                            user: {
                                contributionsCollection: {
                                    contributionCalendar: {
                                        weeks: [isFirstHalf ? week('2025-09-01', 4) : week('2026-03-01', 6)]
                                    }
                                }
                            }
                        }
                    }
                ];
            }
            if (body.query.includes('UserDetailsCore')) {
                return [
                    200,
                    {
                        data: {
                            user: {
                                id: u.id,
                                name: u.name,
                                email: u.email,
                                createdAt: u.createdAt,
                                twitterUsername: u.twitterUsername,
                                company: u.company,
                                location: u.location,
                                websiteUrl: u.websiteUrl,
                                repositories: u.repositories
                            }
                        }
                    }
                ];
            }
            if (body.query.includes('UserDetailsYears')) {
                return [200, {data: {user: {contributionsCollection: {contributionYears: [2025, 2026]}}}}];
            }
            if (body.query.includes('UserDetailsCounts')) {
                return [
                    200,
                    {
                        data: {
                            user: {
                                repositoriesContributedTo: u.repositoriesContributedTo,
                                pullRequests: u.pullRequests,
                                issues: u.issues
                            }
                        }
                    }
                ];
            }
            return [500, {}];
        });

        const profileDetails = await getProfileDetails('antfu', 'token');
        // both half-window days present, in order
        expect(profileDetails.contributions.map(c => c.contributionCount)).toEqual([4, 6]);

        // The two windows must be adjacent on a UTC day boundary — a mid-day
        // seam would put the boundary date into both halves' calendars.
        expect(calendarWindows).toHaveLength(2);
        const [w1, w2] = calendarWindows.sort((a, b) => a.from.localeCompare(b.from));
        expect(new Date(w1.to).getTime() + 1).toBe(new Date(w2.from).getTime());
        expect(w2.from.endsWith('T00:00:00.000Z')).toBe(true);
        expect(w1.from.endsWith('T00:00:00.000Z')).toBe(true);
        // ~1 year covered end to end
        const spanDays = (new Date(w2.to).getTime() - new Date(w1.from).getTime()) / (24 * 3600 * 1000);
        expect(spanDays).toBeGreaterThanOrEqual(363);
        expect(spanDays).toBeLessThanOrEqual(366);
        // merged daily series has no duplicate dates
        const dates = profileDetails.contributions.map(c => c.date.toISOString());
        expect(new Set(dates).size).toBe(dates.length);
    });

    it('sums stars across every repo page, not just the first 100', async () => {
        const page1 = JSON.parse(JSON.stringify(data));
        page1.data.user.repositories.pageInfo = {endCursor: 'C1', hasNextPage: true};
        const starsPage2 = {
            data: {
                user: {
                    repositories: {
                        nodes: [{stargazers: {totalCount: 7}}, {stargazers: {totalCount: 3}}],
                        pageInfo: {endCursor: null, hasNextPage: false}
                    }
                }
            }
        };
        mock.onPost('https://api.github.com/graphql')
            .replyOnce(200, page1)
            .onPost('https://api.github.com/graphql')
            .replyOnce(200, starsPage2)
            .onAny();
        const profileDetails = await getProfileDetails('vn7n24fzkq', 'token');
        // 110 + 20 from page 1, 7 + 3 from the follow-up star query
        expect(profileDetails.totalStars).toBe(140);
    });
});

describe('compact profile cache payload', () => {
    it('reconstructs consecutive daily contributions across a year boundary', async () => {
        const consecutive = JSON.parse(JSON.stringify(data));
        consecutive.data.user.contributionsCollection.contributionCalendar.weeks = [
            {
                contributionDays: [
                    {date: '2025-12-30', contributionCount: 1},
                    {date: '2025-12-31', contributionCount: 2},
                    {date: '2026-01-01', contributionCount: 3},
                    {date: '2026-01-02', contributionCount: 4}
                ]
            }
        ];
        mock.onPost('https://api.github.com/graphql').reply(200, consecutive);
        const pd = await getProfileDetails('someone', 'token');
        expect(pd.contributions.map(c => c.date.toISOString().slice(0, 10))).toEqual([
            '2025-12-30',
            '2025-12-31',
            '2026-01-01',
            '2026-01-02'
        ]);
        expect(pd.contributions.map(c => c.contributionCount)).toEqual([1, 2, 3, 4]);
    });

    it('keeps non-consecutive days intact via the explicit fallback', async () => {
        // the base fixture has gaps (2019-09-06/07 then 2020-01-12)
        mock.onPost('https://api.github.com/graphql').reply(200, data);
        const pd = await getProfileDetails('someone', 'token');
        expect(pd.contributions.map(c => c.date.toISOString().slice(0, 10))).toEqual([
            '2019-09-06',
            '2019-09-07',
            '2020-01-12'
        ]);
    });
});
