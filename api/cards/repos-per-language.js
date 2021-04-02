const {
    getReposPerLanguageSVGWithThemeName,
} = require('../../src/cards/repos-per-language-card');

module.exports = async (req, res) => {
    const { username, theme } = req.query;
    const cardSVG = await getReposPerLanguageSVGWithThemeName(username, theme);
    res.send(cardSVG);
};
