import {getCommitLanguageAllYears, getContributionYears} from '../../src/github-api/commits-per-language';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

function yearData(nodes: unknown[]) {
    return {
        data: {
            user: {
                contributionsCollection: {
                    commitContributionsByRepository: nodes
                }
            }
        }
    };
}

const rust99 = {
    repository: {name: 'a', nameWithOwner: 'u/a', primaryLanguage: {name: 'Rust', color: '#dea584'}},
    contributions: {totalCount: 99}
};
const js84 = {
    repository: {name: 'b', nameWithOwner: 'u/b', primaryLanguage: {name: 'JavaScript', color: '#f1e05a'}},
    contributions: {totalCount: 84}
};
const rust100 = {
    repository: {name: 'c', nameWithOwner: 'u/c', primaryLanguage: {name: 'Rust', color: '#dea584'}},
    contributions: {totalCount: 100}
};
const jupyter75 = {
    repository: {name: 'd', nameWithOwner: 'u/d', primaryLanguage: {name: 'Jupyter Notebook', color: '#f18e33'}},
    contributions: {totalCount: 75}
};
const noLang = {
    repository: {name: 'e', nameWithOwner: 'u/e', primaryLanguage: null},
    contributions: {totalCount: 100}
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
    delete process.env.VERCEL;
});

describe('commit contributions on github (full history)', () => {
    it('should get correct commit contributions for a single year', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, yearData([rust99, js84, rust100, jupyter75, noLang]));
        const langs = await getCommitLanguageAllYears('vn7n24fzkq', [], 'token', [], [2026]);
        expect(langs).toEqual({
            languageMap: new Map([
                ['Rust', {color: '#dea584', count: 199, name: 'Rust'}],
                ['JavaScript', {color: '#f1e05a', count: 84, name: 'JavaScript'}],
                ['Jupyter Notebook', {color: '#f18e33', count: 75, name: 'Jupyter Notebook'}]
            ])
        });
    });

    it('merges language counts across years', async () => {
        mock.onPost('https://api.github.com/graphql')
            .replyOnce(200, yearData([rust99, js84]))
            .onPost('https://api.github.com/graphql')
            .replyOnce(200, yearData([rust100, jupyter75]))
            .onAny();
        const langs = await getCommitLanguageAllYears('vn7n24fzkq', [], 'token', [], [2026, 2025]);
        const map = langs.getLanguageMap();
        expect(map.get('Rust')?.count).toBe(199);
        expect(map.get('JavaScript')?.count).toBe(84);
        expect(map.get('Jupyter Notebook')?.count).toBe(75);
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getCommitLanguageAllYears('vn7n24fzkq', [], 'token', [], [2026])).rejects.toThrow(
            'GitHub api failed'
        );
    });

    it('should do a case-insensitive comparison for language exclusion', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, yearData([rust99, js84, jupyter75]));
        const langs = await getCommitLanguageAllYears('vn7n24fzkq', ['jupyter notebook'], 'token', [], [2026]);
        expect([...langs.getLanguageMap().keys()]).toEqual(['Rust', 'JavaScript']);
    });

    it('excludes repos by name or owner/name (case-insensitive)', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, yearData([rust99, js84, jupyter75]));
        const langs = await getCommitLanguageAllYears('vn7n24fzkq', [], 'token', ['a', 'u/b'], [2026]);
        expect([...langs.getLanguageMap().keys()]).toEqual(['Jupyter Notebook']);
    });

    it('throws on Vercel when the time budget is exhausted mid-history', async () => {
        process.env.VERCEL = '1';
        mock.onPost('https://api.github.com/graphql').reply(200, yearData([rust99]));
        const nowSpy = jest.spyOn(Date, 'now');
        const base = 1_784_000_000_000;
        nowSpy.mockReturnValueOnce(base); // startedAt
        nowSpy.mockReturnValueOnce(base); // first budget check passes → chunk 1 runs
        nowSpy.mockReturnValue(base + 60_000); // second check: budget blown mid-history
        try {
            await expect(
                getCommitLanguageAllYears('vn7n24fzkq', [], 'token', [], [2026, 2025, 2024, 2023, 2022, 2021])
            ).rejects.toThrow('timed out');
            // the first chunk of 5 years was actually fetched before the throw
            expect(mock.history.post.length).toBe(5);
        } finally {
            nowSpy.mockRestore();
        }
    });
});

describe('getContributionYears', () => {
    it('returns the contribution years', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, {
            data: {user: {contributionsCollection: {contributionYears: [2026, 2025, 2021]}}}
        });
        await expect(getContributionYears('vn7n24fzkq', 'token')).resolves.toEqual([2026, 2025, 2021]);
    });

    it('throws when the api fails', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getContributionYears('vn7n24fzkq', 'token')).rejects.toThrow('GitHub api failed');
    });
});
