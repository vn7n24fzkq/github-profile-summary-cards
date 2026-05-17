import {ThemeMap} from '../const/theme';
import {getOrganizationRepoLanguages} from '../github-api/organization-repos-per-language';
import {createDonutChartCard} from '../templates/donut-chart-card';
import {writeSVG} from '../utils/file-writer';

export const createOrganizationReposPerLanguageCard = async function (
    login: string,
    exclude: Array<string>,
    token: string
) {
    const langData = await getOrganizationRepoLanguageData(login, exclude, token);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getOrganizationReposPerLanguageSVG(langData, themeName);
        // output to folder, use 1- prefix for sort in preview
        writeSVG(themeName, '1-repos-per-language', svgString);
    }
};

export const getOrganizationReposPerLanguageSVGWithThemeName = async function (
    login: string,
    themeName: string,
    exclude: Array<string>,
    token: string
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const langData = await getOrganizationRepoLanguageData(login, exclude, token);
    return getOrganizationReposPerLanguageSVG(langData, themeName);
};

const getOrganizationReposPerLanguageSVG = function (
    langData: {name: string; value: number; color: string}[],
    themeName: string
) {
    const svgString = createDonutChartCard('Top Languages by Repo', langData, ThemeMap.get(themeName)!);
    return svgString;
};

const getOrganizationRepoLanguageData = async function (login: string, exclude: Array<string>, token: string) {
    const repoLanguages = await getOrganizationRepoLanguages(login, exclude, token);
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
