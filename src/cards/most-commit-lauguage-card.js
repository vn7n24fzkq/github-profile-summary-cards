const ThemeMap = require('../const/theme');
const getCommitLanguage = require('../github-api/commits-per-lauguage');
const createDonutChartCard = require('../templates/donut-chart-card');
const { writeSVG } = require('../utils/file-writer');

const createCommitsPerLanguageCard = async function (username) {
    const statsData = await getCommitsLanguageData(username);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getCommitsLanguageSVG(statsData, themeName);
        // output to folder, use 2- prefix for sort in preview
        writeSVG(themeName, '2-most-commit-language', svgString);
    }
};

const getCommitsLanguageSVGWithThemeName = async function (
    username,
    themeName
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const langData = await getCommitsLanguageData(username);
    return getCommitsLanguageSVG(langData, themeName);
};

const getCommitsLanguageSVG = function (langData, themeName) {
    if (langData.length == 0) {
        langData.push({
            name: 'There are no',
            value: 1,
            color: '#586e75',
        });
        langData.push({
            name: 'any commits',
            value: 1,
            color: '#586e75',
        });
        langData.push({
            name: 'in the last year',
            value: 1,
            color: '#586e75',
        });
    }
    const svgString = createDonutChartCard(
        'Top Languages by Commit',
        langData,
        ThemeMap.get(themeName)
    );
    return svgString;
};

const getCommitsLanguageData = async function (username) {
    const langMap = new Map();
    const map = await getCommitLanguage(username);
    for (const [key, value] of map) {
        if (langMap.has(key)) {
            const lang = langMap.get(key);
            lang.count += value.count;
        } else {
            langMap.set(key, {
                count: value.count,
                color: value.color == null ? '#586e75' : value.color,
            });
        }
    }
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

module.exports = {
    createCommitsPerLanguageCard,
    getCommitsLanguageSVGWithThemeName,
};
