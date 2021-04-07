const {
    getReposPerLanguageSVGWithThemeName,
} = require('../../src/cards/repos-per-language-card');
const { changToNextGitHubToken } = require('../utils/github-token-updater');
const { getErrorMsgCard } = require('../utils/error-card');

module.exports = async (req, res) => {
    const { username, theme } = req.query;
    try {
        let tokenIndex = 0;
        while (true) {
            tokenIndex += 1;
            try {
                const cardSVG = await getReposPerLanguageSVGWithThemeName(
                    username,
                    theme
                );
                res.setHeader('Content-Type', 'image/svg+xml');
                res.send(cardSVG);
                return;
            } catch (err) {
                console.log(err);
                // We update github token and try again, until getNextGitHubToken throw an Error
                changToNextGitHubToken(tokenIndex);
            }
        }
    } catch (err) {
        console.log(err);
        res.send(getErrorMsgCard(err.message, theme));
    }
};
