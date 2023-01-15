import {ThemeMap} from '../const/theme';
import {getCommitLanguage, CommitLanguages} from '../github-api/commits-per-language';
import {createDonutChartCard} from '../templates/donut-chart-card';
import {writeSVG} from '../utils/file-writer';

export const createCommitsPerLanguageCard = async function (username: string, exclude: Array<string>) {
    const statsData = await getCommitsLanguageData(username, exclude);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getCommitsLanguageSVG(statsData, themeName);
        // output to folder, use 2- prefix for sort in preview
        writeSVG(themeName, '2-most-commit-language', svgString);
    }
};

export const getCommitsLanguageSVGWithThemeName = async function (
    username: string,
    themeName: string,
    exclude: Array<string>
): Promise<string> {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const langData = await getCommitsLanguageData(username, exclude);
    return getCommitsLanguageSVG(langData, themeName);
};

const getCommitsLanguageSVG = function (
    langData: {name: string; value: number; color: string}[],
    themeName: string
): string {
    if (langData.length == 0) {
        langData.push({
            name: 'There are no',
            value: 1,
            color: '#586e75'
        });
        langData.push({
            name: 'any commits',
            value: 1,
            color: '#586e75'
        });
        langData.push({
            name: 'in the last year',
            value: 1,
            color: '#586e75'
        });
    }
    const svgString = createDonutChartCard('Top Languages by Commit', langData, ThemeMap.get(themeName)!);
    return svgString;
};

const getCommitsLanguageData = async function (
    username: string,
    exclude: Array<string>
): Promise<{name: string; value: number; color: string}[]> {
    const commitLanguages: CommitLanguages = await getCommitLanguage(username, exclude);
    let langData = [];

    // make a pie data
    for (const [key, value] of commitLanguages.getLanguageMap()) {
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
