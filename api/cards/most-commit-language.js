const {
    getCommitsLanguageSVGWithThemeName,
} = require('../../src/cards/most-commit-lauguage-card');

module.exports = async (req, res) => {
    const { username, theme } = req.query;
    const cardSVG = await getCommitsLanguageSVGWithThemeName(username, theme);
    res.send(cardSVG);
};