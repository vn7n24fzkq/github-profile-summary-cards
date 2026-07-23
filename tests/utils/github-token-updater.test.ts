import {getGitHubToken, getGitHubTokenCount, getGitHubTokenName} from '../../api/utils/github-token-updater';

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

describe('getGitHubTokenCount', () => {
    const original = {...process.env};
    beforeEach(() => {
        delete process.env.GITHUB_TOKEN;
        delete process.env.GITHUB_TOKEN_0;
        delete process.env.GITHUB_TOKEN_1;
        delete process.env.GITHUB_TOKEN_2;
    });
    afterEach(() => {
        process.env = {...original};
    });

    it('returns 0 with nothing configured', () => {
        expect(getGitHubTokenCount()).toBe(0);
    });

    it('counts the bare GITHUB_TOKEN as index 0', () => {
        process.env.GITHUB_TOKEN = 'tok0';
        expect(getGitHubTokenCount()).toBe(1);
    });

    it('counts GITHUB_TOKEN plus numbered tokens (the production shape)', () => {
        process.env.GITHUB_TOKEN = 'tok0';
        process.env.GITHUB_TOKEN_1 = 'tok1';
        expect(getGitHubTokenCount()).toBe(2);
    });

    it('stops at a gap in the numbering', () => {
        process.env.GITHUB_TOKEN_0 = 'tok0';
        process.env.GITHUB_TOKEN_2 = 'tok2';
        expect(getGitHubTokenCount()).toBe(1);
    });
});

describe('getGitHubTokenName', () => {
    const original = {...process.env};
    afterEach(() => {
        process.env = {...original};
    });

    it('prefers the numbered env var when it exists', () => {
        process.env.GITHUB_TOKEN_0 = 'tok0';
        expect(getGitHubTokenName(0)).toBe('GITHUB_TOKEN_0');
    });

    it('falls back to GITHUB_TOKEN for index 0', () => {
        delete process.env.GITHUB_TOKEN_0;
        process.env.GITHUB_TOKEN = 'tok0';
        expect(getGitHubTokenName(0)).toBe('GITHUB_TOKEN');
    });

    it('names the slot even when unset (for error logs)', () => {
        delete process.env.GITHUB_TOKEN_3;
        expect(getGitHubTokenName(3)).toBe('GITHUB_TOKEN_3');
    });
});
