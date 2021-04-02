const {
    getProfileDetailsSVGWithThemeName,
} = require('../../src/cards/profile-details-card');

module.exports = async (req, res) => {
    const { username, theme } = req.query;
    res.setHeader('Content-Type', 'image/svg+xml');
    const cardSVG = await getProfileDetailsSVGWithThemeName(username, theme);
    console.log(cardSVG);
    res.send(cardSVG);
};
