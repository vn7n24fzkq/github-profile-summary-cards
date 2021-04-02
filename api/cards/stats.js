const { getStatsSVGWithThemeName } = require('../../src/cards/stats-card');

module.exports = async (req, res) => {
    const { username, theme } = req.query;
    const cardSVG = await getStatsSVGWithThemeName(username, theme);
    res.send(cardSVG);
};
