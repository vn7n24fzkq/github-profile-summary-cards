const { getStatsSVGWithThemeName } = require('../../src/cards/stats-card');

module.exports = async (req, res) => {
    const { username, theme } = req.query;
    const cardSVG = await getStatsSVGWithThemeName(username, theme);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(cardSVG);
};
