import {getGitHubToken} from '../../api/utils/github-token-updater';

describe('getGitHubToken', () => {
    const original = {...process.env};
    afterEach(() => {
        process.env = {...original};
    });

    it('throws for a NaN index (guard runs before token lookup)', () => {
        expect(() => getGitHubToken(NaN)).toThrow('Token index must be a number');
    });

    it('falls back to GITHUB_TOKEN for index 0', () => {
        process.env.GITHUB_TOKEN = 'tok0';
        delete process.env.GITHUB_TOKEN_0;
        expect(getGitHubToken(0)).toBe('tok0');
    });

    it('returns GITHUB_TOKEN_n for index n', () => {
        process.env.GITHUB_TOKEN_2 = 'tok2';
        expect(getGitHubToken(2)).toBe('tok2');
    });

    it('throws when no token exists at the given index', () => {
        delete process.env.GITHUB_TOKEN;
        delete process.env.GITHUB_TOKEN_5;
        expect(() => getGitHubToken(5)).toThrow('No more GITHUB_TOKEN');
    });
});
