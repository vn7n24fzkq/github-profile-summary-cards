import {ThemeMap, ThemeColorOverride, resolveTheme} from '../const/theme';
import {getOrganizationRepoLanguages} from '../github-api/organization-repos-per-language';
import {createDonutChartCard} from '../templates/donut-chart-card';
import {CardGenerationOptions, writeThemedCards} from '../utils/card-generation';

export const createOrganizationReposPerLanguageCard = async function (
    login: string,
    exclude: Array<string>,
    token: string,
    options: CardGenerationOptions = {},
    excludeRepos: Array<string> = []
) {
    const langData = await getOrganizationRepoLanguageData(login, exclude, token, excludeRepos);
    // use 1- prefix for sort in preview
    writeThemedCards(
        '1-repos-per-language',
        themeName => getOrganizationReposPerLanguageSVG(langData, themeName),
        options
    );
};

export const getOrganizationReposPerLanguageSVGWithThemeName = async function (
    login: string,
    themeName: string,
    exclude: Array<string>,
    token: string,
    override?: ThemeColorOverride,
    excludeRepos: Array<string> = []
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const langData = await getOrganizationRepoLanguageData(login, exclude, token, excludeRepos);
    return getOrganizationReposPerLanguageSVG(langData, themeName, override);
};

const getOrganizationReposPerLanguageSVG = function (
    langData: {name: string; value: number; color: string}[],
    themeName: string,
    override?: ThemeColorOverride
) {
    const svgString = createDonutChartCard('Top Languages by Repo', langData, resolveTheme(themeName, override));
    return svgString;
};

const getOrganizationRepoLanguageData = async function (
    login: string,
    exclude: Array<string>,
    token: string,
    excludeRepos: Array<string> = []
) {
    const repoLanguages = await getOrganizationRepoLanguages(login, exclude, token, excludeRepos);
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
