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
