import * as crypto from 'crypto';
import axios from 'axios';

// GitHub App installation tokens: minted on demand from the App's private key,
// valid for one hour, with their own 5,000-point GraphQL quota per
// INSTALLATION — install the same App on several accounts and each
// installation is an independent quota pool, all from one credential.
//
// Configuration (Vercel env):
//   GH_APP_ID               — the App's numeric id
//   GH_APP_PRIVATE_KEY      — PEM, either verbatim (multiline / \n-escaped) or base64
//   GH_APP_INSTALLATION_IDS — optional, comma-separated; one token slot per id.
//                             Omitted: the first discovered installation is used.
//
// Minted tokens are cached in module memory per lambda instance and refreshed
// shortly before expiry — roughly two REST calls per installation per instance
// per hour. They are never logged and never written to Redis.

const REFRESH_MARGIN_MS = 5 * 60 * 1000; // re-mint when under 5 minutes left
// A hanging mint would otherwise ride the whole function invocation while the
// rotation can't move on — bound it so a slow GitHub API degrades to the PAT
// slots within a request, not at the platform timeout.
const MINT_TIMEOUT_MS = 10 * 1000;

const cachedTokens = new Map<number, {token: string; expiresAtMs: number}>();
const inflightMints = new Map<number, Promise<string>>();
let discoveredInstallationId: number | null = null;

export function isGitHubAppConfigured(): boolean {
    return Boolean(process.env.GH_APP_ID && process.env.GH_APP_PRIVATE_KEY);
}

function configuredInstallationIds(): number[] {
    return (process.env.GH_APP_INSTALLATION_IDS ?? '')
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => Number.isInteger(n) && n > 0);
}

// Slot count must be known synchronously for the rotation pool, so it comes
// from env only: one slot per configured installation id, or a single slot
// (first discovered installation) when none are pinned.
export function getGitHubAppSlotCount(): number {
    if (!isGitHubAppConfigured()) {
        return 0;
    }
    return Math.max(1, configuredInstallationIds().length);
}

// Vercel env vars arrive in several shapes: verbatim PEM, PEM with literal \n
// escapes, or base64 of the whole file. Normalize all three.
function resolvePrivateKey(): string {
    let key = process.env.GH_APP_PRIVATE_KEY ?? '';
    if (!key.includes('-----BEGIN')) {
        key = Buffer.from(key, 'base64').toString('utf8');
    }
    return key.replace(/\\n/g, '\n');
}

// A short-lived RS256 JWT identifying the App itself (not an installation).
// Node's crypto signs it directly — no jsonwebtoken dependency.
function buildAppJwt(): string {
    const now = Math.floor(Date.now() / 1000);
    const encode = (obj: object): string => Buffer.from(JSON.stringify(obj)).toString('base64url');
    // iat backdated 60s against clock drift; GitHub caps exp at 10 minutes.
    const unsigned = `${encode({alg: 'RS256', typ: 'JWT'})}.${encode({
        iat: now - 60,
        exp: now + 540,
        iss: process.env.GH_APP_ID
    })}`;
    const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(resolvePrivateKey(), 'base64url');
    return `${unsigned}.${signature}`;
}

async function appApi(method: 'get' | 'post', path: string, jwt: string): Promise<any> {
    return axios({
        url: `https://api.github.com${path}`,
        method,
        headers: {
            'User-Agent': 'github-profile-summary-cards',
            Authorization: `Bearer ${jwt}`,
            Accept: 'application/vnd.github+json'
        },
        timeout: MINT_TIMEOUT_MS
    });
}

async function resolveInstallationId(slot: number, jwt: string): Promise<number> {
    const pinned = configuredInstallationIds();
    if (pinned.length > 0) {
        return pinned[slot];
    }
    if (discoveredInstallationId !== null) {
        return discoveredInstallationId;
    }
    const res = await appApi('get', '/app/installations', jwt);
    const id = res.data?.[0]?.id;
    if (!id) {
        throw new Error('GitHub App has no installations');
    }
    discoveredInstallationId = id;
    return id;
}

async function mintInstallationToken(slot: number): Promise<string> {
    const jwt = buildAppJwt();
    const installationId = await resolveInstallationId(slot, jwt);
    const res = await appApi('post', `/app/installations/${installationId}/access_tokens`, jwt);
    const token = res.data?.token;
    if (!token) {
        throw new Error('GitHub App token mint returned no token');
    }
    cachedTokens.set(slot, {
        token,
        expiresAtMs: res.data.expires_at ? Date.parse(res.data.expires_at) : Date.now() + 55 * 60 * 1000
    });
    return token;
}

/**
 * Returns a valid installation token for an App slot, minting or refreshing as
 * needed. Concurrent callers of the same slot share one in-flight mint. Throws
 * when the App is not configured or GitHub rejects the mint — callers treat
 * that as "this slot can't serve the request" and rotate on.
 *
 * @param {number} slot - App slot index, 0 <= slot < getGitHubAppSlotCount().
 * @return {Promise<string>} The installation access token.
 */
export async function getGitHubAppToken(slot = 0): Promise<string> {
    if (!isGitHubAppConfigured()) {
        throw new Error('GitHub App is not configured');
    }
    if (slot < 0 || slot >= getGitHubAppSlotCount()) {
        throw new Error(`GitHub App slot out of range: ${slot}`);
    }
    const cached = cachedTokens.get(slot);
    if (cached && cached.expiresAtMs - Date.now() > REFRESH_MARGIN_MS) {
        return cached.token;
    }
    let mint = inflightMints.get(slot);
    if (!mint) {
        mint = mintInstallationToken(slot).finally(() => {
            inflightMints.delete(slot);
        });
        inflightMints.set(slot, mint);
    }
    return mint;
}

/** Test hook: clears module-level caches between test cases. */
export function __resetGitHubAppTokenCacheForTests(): void {
    cachedTokens.clear();
    inflightMints.clear();
    discoveredInstallationId = null;
}
