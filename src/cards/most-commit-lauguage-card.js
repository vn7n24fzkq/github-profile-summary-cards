const ThemeMap = require('../const/theme');
const getCommitLanguage = require('../github-api/commits-per-lauguage');
const createDonutChartCard = require('../templates/donut-chart-card');
const getProfileDetails = require('../github-api/profile-details');
const { writeSVG } = require('../utils/file-writer');

const createCommitsPerLanguageCard = async function (username) {
    const userDetails = await getProfileDetails(username);
    const langMap = new Map();
    for (const year of userDetails.contributionYears) {
        const map = await getCommitLanguage(username, year);
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

    for (const themeEntry of ThemeMap.entries()) {
        const svgString = createDonutChartCard(
            'Top Languages by Commit',
            langData,
            themeEntry[1]
        );
        // output to folder, use 2- prefix for sort in preview
        writeSVG(themeEntry[0], '2-most-commit-language', svgString);
    }
};

module.exports = createCommitsPerLanguageCard;
