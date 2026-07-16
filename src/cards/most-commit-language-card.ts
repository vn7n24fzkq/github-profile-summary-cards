import {ThemeMap, ThemeColorOverride, resolveTheme} from '../const/theme';
import {getCommitLanguage, CommitLanguages} from '../github-api/commits-per-language';
import {createDonutChartCard} from '../templates/donut-chart-card';
import {CardGenerationOptions, writeThemedCards} from '../utils/card-generation';

export const createCommitsPerLanguageCard = async function (
    username: string,
    exclude: Array<string>,
    token: string,
    options: CardGenerationOptions = {},
    excludeRepos: Array<string> = []
) {
    const statsData = await getCommitsLanguageData(username, exclude, token, excludeRepos);
    // use 2- prefix for sort in preview
    writeThemedCards('2-most-commit-language', themeName => getCommitsLanguageSVG(statsData, themeName), options);
};

export const getCommitsLanguageSVGWithThemeName = async function (
    username: string,
    themeName: string,
    exclude: Array<string>,
    token: string,
    override?: ThemeColorOverride,
    excludeRepos: Array<string> = []
): Promise<string> {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const langData = await getCommitsLanguageData(username, exclude, token, excludeRepos);
    return getCommitsLanguageSVG(langData, themeName, override);
};

const getCommitsLanguageSVG = function (
    langData: {name: string; value: number; color: string}[],
    themeName: string,
    override?: ThemeColorOverride
): string {
    if (langData.length == 0) {
        // Generic placeholder that fits inside the donut chart's legend space (~18 chars
        // per line at 14-px font); avoids "in the last year"/"for this organization"
        // overflows into the pie graphic for accounts with no recent commits.
        langData.push({
            name: 'There are no',
            value: 1,
            color: '#586e75'
        });
        langData.push({
            name: 'commits to show',
            value: 1,
            color: '#586e75'
        });
    }
    const svgString = createDonutChartCard('Top Languages by Commit', langData, resolveTheme(themeName, override));
    return svgString;
};

const getCommitsLanguageData = async function (
    username: string,
    exclude: Array<string>,
    token: string,
    excludeRepos: Array<string> = []
): Promise<{name: string; value: number; color: string}[]> {
    const commitLanguages: CommitLanguages = await getCommitLanguage(username, exclude, token, excludeRepos);
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
