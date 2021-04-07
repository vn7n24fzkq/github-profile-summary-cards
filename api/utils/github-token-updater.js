const changToNextGitHubToken = function (currentIndex) {
    process.env.GITHUB_TOKEN = process.env[`GITHUB_TOKEN${currentIndex + 1}`];
    if (!process.env.GITHUB_TOKEN) {
        throw new Error('No more GITHUB_TOKEN can be used');
    }
};

module.exports = {
    changToNextGitHubToken,
};
