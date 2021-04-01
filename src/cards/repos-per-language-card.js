const ThemeMap = require('../const/theme');
const getRepoLanguage = require('../github-api/repos-per-language');
const createDonutChartCard = require('../templates/donut-chart-card');
const { writeSVG } = require('../utils/file-writer');

const createReposPerLanguageCard = async function (username) {
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

    for (const themeEntry of ThemeMap.entries()) {
        const svgString = createDonutChartCard(
            'Top Languages by Repo',
            langData,
            themeEntry[1]
        );
        // output to folder, use 1- prefix for sort in preview
        writeSVG(themeEntry[0], '1-repos-per-language', svgString);
    }
};

module.exports = createReposPerLanguageCard;
