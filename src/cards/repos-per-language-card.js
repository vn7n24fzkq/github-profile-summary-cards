const ThemeMap = require('../const/theme');
const getRepoLanguage = require('../github-api/repos-per-language');
const createDonutChartCard = require('../templates/donut-chart-card');
const { writeSVG } = require('../utils/file-writer');

const createReposPerLanguageCard = async function (username) {
    const langData = await getRepoLanguageData(username);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getReposPerLanguageSVG(langData, themeName);
        // output to folder, use 1- prefix for sort in preview
        writeSVG(themeName, '1-repos-per-language', svgString);
    }
};

const getReposPerLanguageSVGWithThemeName = async function (
    username,
    themeName
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const langData = await getRepoLanguageData(username);
    return getReposPerLanguageSVG(langData, themeName);
};

const getReposPerLanguageSVG = function (langData, themeName) {
    const svgString = createDonutChartCard(
        'Top Languages by Repo',
        langData,
        ThemeMap.get(themeName)
    );
    return svgString;
};

const getRepoLanguageData = async function (username) {
    const langMap = await getRepoLanguage(username);
    let langData = [];

    // make a pie data
    for (const [key, value] of langMap) {
        langData.push({
            name: key,
            value: value.count,
            color: value.color,
        });
    }
    langData.sort(function (a, b) {
        return b.value - a.value;
    });
    langData = langData.slice(0, 5); // get top 5
    return langData;
};

module.exports = createReposPerLanguageCard;
module.exports = {
    createReposPerLanguageCard,
    getReposPerLanguageSVGWithThemeName,
};
