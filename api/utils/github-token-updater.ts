import {getGitHubAppSlotCount, getGitHubAppToken} from './github-app-token';

// Returns the env var name a given token index resolves from: GITHUB_TOKEN_<n>
// when set, with GITHUB_TOKEN as the index-0 fallback. Safe to log — it names
// the slot, never the token value or the account behind it.
export const getGitHubTokenName = function (index: number): string {
    const tokenName = `GITHUB_TOKEN_${index}`;
    if (process.env[tokenName]) {
        return tokenName;
    }
    if (index === 0 && process.env.GITHUB_TOKEN) {
        return 'GITHUB_TOKEN';
    }
    return tokenName;
};

export const getGitHubToken = function (index: number): string {
    if (isNaN(index)) {
        throw new Error('Token index must be a number');
    }
    const tokenName = `GITHUB_TOKEN_${index}`;
    // Fallback to GITHUB_TOKEN for index 0 if specific token not found (optional, but good for backward compat or single token setup)
    const token = process.env[tokenName] || (index === 0 ? process.env.GITHUB_TOKEN : undefined);

    if (!token) {
        throw new Error(`No more GITHUB_TOKEN can be used (Index: ${index})`);
    }

    console.log(`Using token source: ${getGitHubTokenName(index)}`);
    return token;
};

// Number of consecutively configured tokens starting from index 0. Tokens must
// be contiguous (GITHUB_TOKEN/GITHUB_TOKEN_0, GITHUB_TOKEN_1, ...) — a gap ends
// the count, matching how rotation walks the pool.
export const getGitHubTokenCount = function (): number {
    let count = 0;
    while (process.env[`GITHUB_TOKEN_${count}`] || (count === 0 && process.env.GITHUB_TOKEN)) {
        count += 1;
    }
    return count;
};

// ---- unified slot view: GitHub App installations + env PATs ----
// App installations come first (each installation token has its own hourly
// quota, independent of every PAT account and of each other); the env PATs
// follow, shifted by the App slot count. Without an App the slots are exactly
// the env PATs.
export const getGitHubTokenSlots = function (): number {
    return getGitHubAppSlotCount() + getGitHubTokenCount();
};

// Loggable slot name — 'GITHUB_APP[_n]' for App slots, env var names otherwise.
export const getGitHubTokenNameAt = function (index: number): string {
    const appSlots = getGitHubAppSlotCount();
    if (index < appSlots) {
        return appSlots === 1 ? 'GITHUB_APP' : `GITHUB_APP_${index}`;
    }
    return getGitHubTokenName(index - appSlots);
};

// Resolves the token at a slot. App slots mint (or serve the cached)
// installation token; mint failures are flagged `isTokenAcquisition` so the
// rotation treats a broken App like a rate-limited PAT — try the next slot
// instead of failing the card.
export const getGitHubTokenAt = async function (index: number): Promise<string> {
    const appSlots = getGitHubAppSlotCount();
    if (index < appSlots) {
        try {
            const token = await getGitHubAppToken(index);
            console.log(`Using token source: ${getGitHubTokenNameAt(index)}`);
            return token;
        } catch (err: any) {
            if (err && typeof err === 'object') {
                err.isTokenAcquisition = true;
            }
            throw err;
        }
    }
    return getGitHubToken(index - appSlots);
};
