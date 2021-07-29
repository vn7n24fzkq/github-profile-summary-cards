const {
    getProductiveTimeSVGWithThemeName,
} = require('../../src/cards/productive-time-card');
const { changToNextGitHubToken } = require('../utils/github-token-updater');
const { getErrorMsgCard } = require('../utils/error-card');

module.exports = async (req, res) => {
    const { username, theme="default" } = req.query;
    try {
        let tokenIndex = 0;
        while (true) {
            try {
                const cardSVG = await getProductiveTimeSVGWithThemeName(
                    username,
                    theme
                );
                res.setHeader('Content-Type', 'image/svg+xml');
                res.send(cardSVG);
                return;
            } catch (err) {
                console.log(err.message);
                // We update github token and try again, until getNextGitHubToken throw an Error
                changToNextGitHubToken(tokenIndex);
                tokenIndex += 1;
            }
        }
    } catch (err) {
        console.log(err);
        res.send(getErrorMsgCard(err.message, theme));
    }
};
