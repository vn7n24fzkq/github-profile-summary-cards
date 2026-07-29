import {handleCard, redactBackingAccount, tokenPoolStartIndex} from '../../api/utils/handle-card';
import {__resetGitHubAppTokenCacheForTests} from '../../api/utils/github-app-token';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type {VercelRequest, VercelResponse} from '@vercel/node';

jest.mock('../../src/utils/analytics', () => ({
    sendAnalytics: jest.fn().mockResolvedValue(undefined),
    resolveSource: jest.fn().mockReturnValue('other')
}));
jest.mock('../../api/utils/error-reporter', () => ({
    reportUnexpectedError: jest.fn().mockResolvedValue(undefined),
    shipErrorRecord: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('@vercel/functions', () => ({waitUntil: jest.fn()}));

describe('redactBackingAccount', () => {
    it('replaces the account id in GitHub rate-limit messages', () => {
        expect(redactBackingAccount('API rate limit already exceeded for user ID 12345.')).toBe(
            'API rate limit already exceeded for the backing account.'
        );
    });

    it('is case-insensitive and replaces every occurrence', () => {
        expect(redactBackingAccount('USER ID 1 then user id 2')).toBe('the backing account then the backing account');
    });

    it('leaves unrelated messages untouched', () => {
        expect(redactBackingAccount('Could not resolve to a User')).toBe('Could not resolve to a User');
    });
});

describe('tokenPoolStartIndex', () => {
    it('is deterministic and stays within the pool', () => {
        for (const count of [1, 2, 3, 7]) {
            for (const name of ['octocat', 'torvalds', 'a', 'Some-User_123']) {
                const idx = tokenPoolStartIndex(name, count);
                expect(idx).toBe(tokenPoolStartIndex(name, count));
                expect(idx).toBeGreaterThanOrEqual(0);
                expect(idx).toBeLessThan(count);
            }
        }
    });

    it('ignores username casing', () => {
        expect(tokenPoolStartIndex('OctoCat', 2)).toBe(tokenPoolStartIndex('octocat', 2));
    });

    it('spreads different usernames across the pool', () => {
        const seen = new Set<number>();
        for (let c = 97; c <= 122; c++) {
            seen.add(tokenPoolStartIndex(String.fromCharCode(c), 2));
        }
        expect(seen).toEqual(new Set([0, 1]));
    });
});

describe('handleCard token rotation', () => {
    const originalEnv = {...process.env};

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GITHUB_TOKEN = 'tok0';
        process.env.GITHUB_TOKEN_1 = 'tok1';
        delete process.env.GITHUB_TOKEN_2;
    });

    afterEach(() => {
        process.env = {...originalEnv};
    });

    const makeReq = (username: string) => ({query: {username}, headers: {}}) as unknown as VercelRequest;

    const makeRes = () => {
        const res: any = {
            headers: {} as Record<string, string>,
            body: undefined as unknown,
            setHeader(name: string, value: string) {
                this.headers[name] = value;
            },
            send(body: unknown) {
                this.body = body;
            },
            status: jest.fn().mockReturnThis()
        };
        return res as VercelResponse & {body: string; headers: Record<string, string>};
    };

    const rateLimitError = () => {
        const err: any = new Error('API rate limit already exceeded for user ID 12345.');
        err.isRateLimit = true;
        return err;
    };

    it('starts at the username-pinned token, not always index 0', async () => {
        const render = jest.fn().mockResolvedValue('<svg/>');
        const res = makeRes();
        const username = 'octocat';
        await handleCard(makeReq(username), res, 'test_card', render);

        const expectedFirst = tokenPoolStartIndex(username, 2) === 0 ? 'tok0' : 'tok1';
        expect(render).toHaveBeenCalledTimes(1);
        expect(render.mock.calls[0][3]).toBe(expectedFirst);
        expect(res.body).toContain('<svg');
    });

    it('wraps around the pool when the pinned token is rate limited', async () => {
        const render = jest.fn().mockRejectedValueOnce(rateLimitError()).mockResolvedValueOnce('<svg/>');
        const res = makeRes();
        await handleCard(makeReq('octocat'), res, 'test_card', render);

        expect(render).toHaveBeenCalledTimes(2);
        const tokensTried = render.mock.calls.map(call => call[3]);
        expect(new Set(tokensTried)).toEqual(new Set(['tok0', 'tok1']));
        expect(res.body).toContain('<svg');
    });

    it('stops after one full lap and renders the rate-limited card', async () => {
        const render = jest.fn().mockRejectedValue(rateLimitError());
        const res = makeRes();
        await handleCard(makeReq('octocat'), res, 'test_card', render);

        // Exactly one attempt per configured token — no third lap.
        expect(render).toHaveBeenCalledTimes(2);
        expect(res.body).toContain('rate limited');
        expect(res.body).not.toContain('12345');
    });

    it('does not rotate on non-rotatable errors and never leaks the account id', async () => {
        const err: any = new Error('boom for user ID 98765');
        const render = jest.fn().mockRejectedValue(err);
        const res = makeRes();
        await handleCard(makeReq('octocat'), res, 'test_card', render);

        expect(render).toHaveBeenCalledTimes(1);
        expect(res.body).toContain('temporarily unavailable');
        expect(res.body).not.toContain('98765');
        // The in-place redaction cleans the message before it reaches any sink.
        expect(err.message).toBe('boom for the backing account');
    });
});

// The App slot participates in the same rotation: a working App serves cards,
// a broken App (mint failure) rotates to the PATs instead of failing the card.
describe('handleCard with a GitHub App slot', () => {
    // Created per test: restore() detaches the adapter from axios, so a
    // suite-level instance would leave later tests running unmocked.
    let mock: InstanceType<typeof MockAdapter>;
    const originalEnv = {...process.env};

    // Pool: [GITHUB_APP, GITHUB_TOKEN, GITHUB_TOKEN_1]. Pick a username whose
    // hash pins it to the App slot so the App path is exercised first.
    const appPinnedUser = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel'].find(
        name => tokenPoolStartIndex(name, 3) === 0
    ) as string;

    beforeEach(() => {
        jest.clearAllMocks();
        mock = new MockAdapter(axios);
        __resetGitHubAppTokenCacheForTests();
        process.env.GITHUB_TOKEN = 'tok0';
        process.env.GITHUB_TOKEN_1 = 'tok1';
        process.env.GH_APP_ID = '12345';
        process.env.GH_APP_PRIVATE_KEY = 'not-a-real-key';
        process.env.GH_APP_INSTALLATION_IDS = '777';
    });

    afterEach(() => {
        process.env = {...originalEnv};
        mock.restore();
    });

    const makeReq = (username: string) => ({query: {username}, headers: {}}) as any;
    const makeRes = () => {
        const res: any = {
            body: undefined,
            setHeader() {},
            send(body: unknown) {
                this.body = body;
            },
            status: jest.fn().mockReturnThis()
        };
        return res;
    };

    it('sanity: a username is pinned to the App slot', () => {
        expect(appPinnedUser).toBeDefined();
    });

    it('rotates to the PATs when the App token mint fails', async () => {
        // The bogus private key makes the mint throw before any HTTP happens —
        // an isTokenAcquisition failure, which must rotate, not fail the card.
        const render = jest.fn().mockResolvedValue('<svg/>');
        const res = makeRes();
        await handleCard(makeReq(appPinnedUser), res, 'test_card', render);

        expect(render).toHaveBeenCalledTimes(1);
        expect(['tok0', 'tok1']).toContain(render.mock.calls[0][3]);
        expect(res.body).toContain('<svg');
    });

    it('counts the App slot in the exhaustion lap', async () => {
        const err: any = new Error('API rate limit exceeded');
        err.isRateLimit = true;
        const render = jest.fn().mockRejectedValue(err);
        const res = makeRes();
        await handleCard(makeReq(appPinnedUser), res, 'test_card', render);

        // App mint fails (1 acquisition attempt, no render) + 2 PAT renders
        // rate-limited = one full lap of 3 slots, then the rate-limited card.
        expect(render).toHaveBeenCalledTimes(2);
        expect(res.body).toContain('rate limited');
    });
});
