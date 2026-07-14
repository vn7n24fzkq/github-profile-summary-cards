import {ThemeMap, ThemeColorOverride, resolveTheme} from '../const/theme';
import {getRepoLanguages} from '../github-api/repos-per-language';
import {createDonutChartCard} from '../templates/donut-chart-card';
import {writeSVG} from '../utils/file-writer';

export const createReposPerLanguageCard = async function (username: string, exclude: Array<string>, token: string) {
    const langData = await getRepoLanguageData(username, exclude, token);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getReposPerLanguageSVG(langData, themeName);
        // output to folder, use 1- prefix for sort in preview
        writeSVG(themeName, '1-repos-per-language', svgString);
    }
};

export const getReposPerLanguageSVGWithThemeName = async function (
    username: string,
    themeName: string,
    exclude: Array<string>,
    token: string,
    override?: ThemeColorOverride
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const langData = await getRepoLanguageData(username, exclude, token);
    return getReposPerLanguageSVG(langData, themeName, override);
};

const getReposPerLanguageSVG = function (
    langData: {name: string; value: number; color: string}[],
    themeName: string,
    override?: ThemeColorOverride
) {
    if (langData.length == 0) {
        // Placeholder so accounts with no public repos/languages get a labelled
        // donut instead of a blank one (mirrors the commit-language card).
        langData.push({name: 'There are no', value: 1, color: '#586e75'});
        langData.push({name: 'repos to show', value: 1, color: '#586e75'});
    }
    const svgString = createDonutChartCard('Top Languages by Repo', langData, resolveTheme(themeName, override));
    return svgString;
};

const getRepoLanguageData = async function (username: string, exclude: Array<string>, token: string) {
    const repoLanguages = await getRepoLanguages(username, exclude, token);
    let langData = [];

    // make a pie data
    for (const [key, value] of repoLanguages.getLanguageMap()) {
        langData.push({
            name: key,
            value: value.count,
            color: value.color
        });
    }
    langData.sort(function (a, b) {
        return b.value - a.value;
    });
    langData = langData.slice(0, 5); // get top 5
    return langData;
};
