const changToNextGitHubToken = function (currentIndex) {
    const tokenName = `GITHUB_TOKEN_${currentIndex + 1}`;
    console.log(`Change to ${tokenName}`);
    process.env.GITHUB_TOKEN = process.env[tokenName];
    if (!process.env.GITHUB_TOKEN) {
        throw new Error('No more GITHUB_TOKEN can be used');
    }
};

module.exports = {
    changToNextGitHubToken,
};
