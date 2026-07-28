import * as crypto from 'crypto';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
    isGitHubAppConfigured,
    getGitHubAppSlotCount,
    getGitHubAppToken,
    __resetGitHubAppTokenCacheForTests
} from '../../api/utils/github-app-token';

const mock = new MockAdapter(axios);

// A real (throwaway) keypair so the RS256 signature can be verified for real.
const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {type: 'spki', format: 'pem'},
    privateKeyEncoding: {type: 'pkcs8', format: 'pem'}
});

const originalEnv = {...process.env};

function configureApp(extra: Record<string, string> = {}): void {
    process.env.GH_APP_ID = '12345';
    process.env.GH_APP_PRIVATE_KEY = privateKey;
    delete process.env.GH_APP_INSTALLATION_IDS;
    Object.assign(process.env, extra);
}

function decodeJwt(authHeader: string): {header: any; payload: any; verified: boolean} {
    const jwt = authHeader.replace(/^Bearer /, '');
    const [h, p, s] = jwt.split('.');
    const verified = crypto
        .createVerify('RSA-SHA256')
        .update(`${h}.${p}`)
        .verify(publicKey, Buffer.from(s, 'base64url'));
    return {
        header: JSON.parse(Buffer.from(h, 'base64url').toString()),
        payload: JSON.parse(Buffer.from(p, 'base64url').toString()),
        verified
    };
}

afterEach(() => {
    mock.reset();
    process.env = {...originalEnv};
    __resetGitHubAppTokenCacheForTests();
});

describe('isGitHubAppConfigured / slot count', () => {
    it('is off without env config', () => {
        delete process.env.GH_APP_ID;
        delete process.env.GH_APP_PRIVATE_KEY;
        expect(isGitHubAppConfigured()).toBe(false);
        expect(getGitHubAppSlotCount()).toBe(0);
    });

    it('is one slot when configured without pinned installations', () => {
        configureApp();
        expect(isGitHubAppConfigured()).toBe(true);
        expect(getGitHubAppSlotCount()).toBe(1);
    });

    it('is one slot per pinned installation id', () => {
        configureApp({GH_APP_INSTALLATION_IDS: '111, 222'});
        expect(getGitHubAppSlotCount()).toBe(2);
    });

    it('ignores malformed installation ids', () => {
        configureApp({GH_APP_INSTALLATION_IDS: 'abc, -1, 333'});
        expect(getGitHubAppSlotCount()).toBe(1);
    });
});

describe('getGitHubAppToken', () => {
    it('mints via a verifiable RS256 app JWT and discovers the installation', async () => {
        configureApp();
        let mintAuth = '';
        mock.onGet('https://api.github.com/app/installations').reply(200, [{id: 777}]);
        mock.onPost('https://api.github.com/app/installations/777/access_tokens').reply(config => {
            mintAuth = String(config.headers?.Authorization);
            return [201, {token: 'ghs_app_token', expires_at: new Date(Date.now() + 3600_000).toISOString()}];
        });

        await expect(getGitHubAppToken()).resolves.toBe('ghs_app_token');
        const {header, payload, verified} = decodeJwt(mintAuth);
        expect(verified).toBe(true);
        expect(header.alg).toBe('RS256');
        expect(payload.iss).toBe('12345');
        expect(payload.exp - payload.iat).toBeLessThanOrEqual(600);
    });

    it('serves the cached token without re-minting until near expiry', async () => {
        configureApp({GH_APP_INSTALLATION_IDS: '777'});
        let mints = 0;
        mock.onPost('https://api.github.com/app/installations/777/access_tokens').reply(() => {
            mints += 1;
            return [201, {token: 'ghs_cached', expires_at: new Date(Date.now() + 3600_000).toISOString()}];
        });

        await getGitHubAppToken();
        await getGitHubAppToken();
        expect(mints).toBe(1);
    });

    it('re-mints when the cached token is inside the refresh margin', async () => {
        configureApp({GH_APP_INSTALLATION_IDS: '777'});
        let mints = 0;
        mock.onPost('https://api.github.com/app/installations/777/access_tokens').reply(() => {
            mints += 1;
            // expires within the 5-minute margin, so the next call re-mints
            return [201, {token: `ghs_${mints}`, expires_at: new Date(Date.now() + 60_000).toISOString()}];
        });

        await expect(getGitHubAppToken()).resolves.toBe('ghs_1');
        await expect(getGitHubAppToken()).resolves.toBe('ghs_2');
        expect(mints).toBe(2);
    });

    it('coalesces concurrent callers into one mint', async () => {
        configureApp({GH_APP_INSTALLATION_IDS: '777'});
        let mints = 0;
        mock.onPost('https://api.github.com/app/installations/777/access_tokens').reply(() => {
            mints += 1;
            return [201, {token: 'ghs_once', expires_at: new Date(Date.now() + 3600_000).toISOString()}];
        });

        const [a, b, c] = await Promise.all([getGitHubAppToken(), getGitHubAppToken(), getGitHubAppToken()]);
        expect([a, b, c]).toEqual(['ghs_once', 'ghs_once', 'ghs_once']);
        expect(mints).toBe(1);
    });

    it('keeps per-installation tokens and quotas separate', async () => {
        configureApp({GH_APP_INSTALLATION_IDS: '111,222'});
        mock.onPost('https://api.github.com/app/installations/111/access_tokens').reply(201, {
            token: 'ghs_first',
            expires_at: new Date(Date.now() + 3600_000).toISOString()
        });
        mock.onPost('https://api.github.com/app/installations/222/access_tokens').reply(201, {
            token: 'ghs_second',
            expires_at: new Date(Date.now() + 3600_000).toISOString()
        });

        await expect(getGitHubAppToken(0)).resolves.toBe('ghs_first');
        await expect(getGitHubAppToken(1)).resolves.toBe('ghs_second');
    });

    it('accepts a base64-encoded private key', async () => {
        configureApp({GH_APP_INSTALLATION_IDS: '777'});
        process.env.GH_APP_PRIVATE_KEY = Buffer.from(privateKey).toString('base64');
        mock.onPost('https://api.github.com/app/installations/777/access_tokens').reply(201, {
            token: 'ghs_b64',
            expires_at: new Date(Date.now() + 3600_000).toISOString()
        });
        await expect(getGitHubAppToken()).resolves.toBe('ghs_b64');
    });

    it('throws when unconfigured, out of range, or uninstalled', async () => {
        delete process.env.GH_APP_ID;
        await expect(getGitHubAppToken()).rejects.toThrow('not configured');

        configureApp({GH_APP_INSTALLATION_IDS: '777'});
        await expect(getGitHubAppToken(5)).rejects.toThrow('out of range');

        delete process.env.GH_APP_INSTALLATION_IDS;
        mock.onGet('https://api.github.com/app/installations').reply(200, []);
        await expect(getGitHubAppToken()).rejects.toThrow('no installations');
    });
});
