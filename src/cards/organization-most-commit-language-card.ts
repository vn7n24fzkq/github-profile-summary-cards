import {ThemeMap, ThemeColorOverride, resolveTheme} from '../const/theme';
import {CommitLanguages} from '../github-api/commits-per-language';
import {getOrganizationCommitLanguage} from '../github-api/organization-commits-per-language';
import {createDonutChartCard} from '../templates/donut-chart-card';
import {CardGenerationOptions, writeThemedCards} from '../utils/card-generation';

export const createOrganizationCommitsPerLanguageCard = async function (
    login: string,
    exclude: Array<string>,
    token: string,
    options: CardGenerationOptions = {}
) {
    const langData = await getOrganizationCommitsLanguageData(login, exclude, token);
    // use 2- prefix for sort in preview
    writeThemedCards(
        '2-most-commit-language',
        themeName => getOrganizationCommitsLanguageSVG(langData, themeName),
        options
    );
};

export const getOrganizationCommitsLanguageSVGWithThemeName = async function (
    login: string,
    themeName: string,
    exclude: Array<string>,
    token: string,
    override?: ThemeColorOverride
): Promise<string> {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const langData = await getOrganizationCommitsLanguageData(login, exclude, token);
    return getOrganizationCommitsLanguageSVG(langData, themeName, override);
};

const getOrganizationCommitsLanguageSVG = function (
    langData: {name: string; value: number; color: string}[],
    themeName: string,
    override?: ThemeColorOverride
): string {
    if (langData.length == 0) {
        // Generic placeholder; matches the user variant exactly so both flows render
        // the same "no commits" donut.
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

const getOrganizationCommitsLanguageData = async function (
    login: string,
    exclude: Array<string>,
    token: string
): Promise<{name: string; value: number; color: string}[]> {
    const commitLanguages: CommitLanguages = await getOrganizationCommitLanguage(login, exclude, token);
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
