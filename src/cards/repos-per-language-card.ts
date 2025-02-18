import {ThemeMap, Theme} from '../const/theme';
import {getRepoLanguages} from '../github-api/repos-per-language';
import {createDonutChartCard} from '../templates/donut-chart-card';
import {writeSVG} from '../utils/file-writer';

export const createReposPerLanguageCard = async function (username: string, exclude: Array<string>) {
    const langData = await getRepoLanguageData(username, exclude);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getReposPerLanguageSVG(langData, themeName, undefined);
        // output to folder, use 1- prefix for sort in preview
        writeSVG(themeName, '1-repos-per-language', svgString);
    }
};

export const getReposPerLanguageSVGWithThemeName = async function (
    username: string,
    themeName: string,
    customTheme: Theme,
    exclude: Array<string>
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const langData = await getRepoLanguageData(username, exclude);
    return getReposPerLanguageSVG(langData, themeName, customTheme);
};

const getReposPerLanguageSVG = function (
    langData: { name: string; value: number; color: string }[],
    themeName: string,
    customTheme: Theme | undefined
) {
    let theme = { ...ThemeMap.get(themeName)! };
    if (customTheme !== undefined) {
        if (customTheme.title) theme.title = "#" + customTheme.title;
        if (customTheme.text) theme.text = "#" + customTheme.text;
        if (customTheme.background) theme.background = "#" + customTheme.background;
        if (customTheme.stroke) { theme.stroke = "#" + customTheme.stroke; theme.strokeOpacity = 1; }
        if (customTheme.icon) theme.icon = "#" + customTheme.icon;
        if (customTheme.chart) theme.chart = "#" + customTheme.chart;
    }
    const svgString = createDonutChartCard('Top Languages by Repo', langData, theme);
    return svgString;
};

const getRepoLanguageData = async function (username: string, exclude: Array<string>) {
    const repoLanguages = await getRepoLanguages(username, exclude);
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
