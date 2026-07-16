import {getContributionTotals} from '../../src/utils/contribution-history';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

function reply(commits: number, total: number) {
    return {
        data: {
            user: {
                contributionsCollection: {
                    totalCommitContributions: commits,
                    contributionCalendar: {totalContributions: total}
                }
            }
        }
    };
}

afterEach(() => {
    mock.reset();
    delete process.env.VERCEL;
});

describe('getContributionTotals', () => {
    it('sums every contribution year', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, reply(100, 150));
        const totals = await getContributionTotals('user', [2026, 2025, 2024], 'token');
        expect(totals).toEqual({totalCommitContributions: 300, totalContributions: 450});
    });

    it('produces identical totals with and without VERCEL (semantics never change)', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, reply(10, 20));
        const off = await getContributionTotals('user', [2026, 2025], 'token');
        process.env.VERCEL = '1';
        const on = await getContributionTotals('user', [2026, 2025], 'token');
        expect(on).toEqual(off);
    });

    it('returns zeros for an account with no contribution years', async () => {
        const totals = await getContributionTotals('user', [], 'token');
        expect(totals).toEqual({totalCommitContributions: 0, totalContributions: 0});
        expect(mock.history.post.length).toBe(0);
    });

    it('throws on Vercel when the time budget is exhausted mid-history', async () => {
        process.env.VERCEL = '1';
        mock.onPost('https://api.github.com/graphql').reply(200, reply(1, 1));
        const nowSpy = jest.spyOn(Date, 'now');
        const base = 1_784_000_000_000;
        nowSpy.mockReturnValueOnce(base); // startedAt
        nowSpy.mockReturnValueOnce(base); // first budget check passes → chunk 1 runs
        nowSpy.mockReturnValue(base + 60_000); // second check: budget blown mid-history
        try {
            await expect(getContributionTotals('user', [2026, 2025, 2024, 2023, 2022, 2021], 'token')).rejects.toThrow(
                'timed out'
            );
            // the first chunk of 5 years was actually fetched before the throw
            expect(mock.history.post.length).toBe(5);
        } finally {
            nowSpy.mockRestore();
        }
    });

    it('ignores the budget off Vercel', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, reply(1, 1));
        const nowSpy = jest.spyOn(Date, 'now');
        const base = 1_784_000_000_000;
        nowSpy.mockReturnValueOnce(base);
        nowSpy.mockReturnValue(base + 60_000);
        try {
            const totals = await getContributionTotals('user', [2026, 2025, 2024, 2023, 2022, 2021], 'token');
            expect(totals.totalCommitContributions).toBe(6);
        } finally {
            nowSpy.mockRestore();
        }
    });

    it('propagates fetch errors', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, {
            errors: [{type: 'NOT_FOUND', path: ['user'], locations: [], message: 'GitHub api failed'}]
        });
        await expect(getContributionTotals('user', [2026], 'token')).rejects.toThrow('GitHub api failed');
    });
});
