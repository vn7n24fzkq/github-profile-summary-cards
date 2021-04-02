const {
    getProductiveTimeSVGWithThemeName,
} = require('../../src/cards/productive-time-card');

module.exports = async (req, res) => {
    const { username, theme } = req.query;
    const cardSVG = await getProductiveTimeSVGWithThemeName(username, theme);
    res.send(cardSVG);
};
