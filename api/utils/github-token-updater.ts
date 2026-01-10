export const getGitHubToken = function (index: number): string {
    const tokenName = `GITHUB_TOKEN_${index}`;
    // Fallback to GITHUB_TOKEN for index 0 if specific token not found (optional, but good for backward compat or single token setup)
    const token = process.env[tokenName] || (index === 0 ? process.env.GITHUB_TOKEN : undefined);

    if (!token) {
        throw new Error(`No more GITHUB_TOKEN can be used (Index: ${index})`);
    }
    if (isNaN(index)) {
        throw new Error('Token index must be a number');
    }

    // Explicitly determine which token source is used for logging
    const source = process.env[tokenName]
        ? tokenName
        : index === 0 && process.env.GITHUB_TOKEN
          ? 'GITHUB_TOKEN'
          : 'Unknown';
    console.log(`Using token source: ${source}`);
    return token;
};
