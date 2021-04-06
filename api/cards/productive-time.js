const {
    getProductiveTimeSVGWithThemeName,
} = require('../../src/cards/productive-time-card');

module.exports = async (req, res) => {
    const { username, theme } = req.query;
    const cardSVG = await getProductiveTimeSVGWithThemeName(username, theme);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(cardSVG);
};
