const {
    getProfileDetailsSVGWithThemeName,
} = require('../../src/cards/profile-details-card');

module.exports = async (req, res) => {
    const { username, theme } = req.query;
    const cardSVG = await getProfileDetailsSVGWithThemeName(username, theme);
    res.send(cardSVG);
};
