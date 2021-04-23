const ThemeMap = require('../src/const/theme');

module.exports = async (req, res) => {
    const themes = Array.from(ThemeMap.keys());
    res.send({ themes: themes });
};
