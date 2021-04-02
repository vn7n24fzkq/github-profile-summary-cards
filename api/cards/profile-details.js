const {
    getProfileDetailsSVGWithThemeName,
} = require('../../src/cards/profile-details-card');

module.exports = (req, res) => {
    const { username, theme } = req.query;
    res.setHeader('Content-Type', 'image/svg+xml');
    const cardSVG = getProfileDetailsSVGWithThemeName(username, theme);
    res.send(cardSVG);
};
