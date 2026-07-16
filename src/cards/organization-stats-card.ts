import {ThemeMap, ThemeColorOverride, resolveTheme} from '../const/theme';
import {Icon} from '../const/icon';
import {abbreviateNumber} from 'js-abbreviation-number';
import {getOrganizationDetails} from '../github-api/organization-details';
import {createStatsCard as statsCard} from '../templates/stats-card';
import {CardGenerationOptions, writeThemedCards} from '../utils/card-generation';

export const createOrganizationStatsCard = async function (
    login: string,
    token: string,
    options: CardGenerationOptions = {}
) {
    const statsData = await getOrganizationStatsData(login, token);
    // use 3- prefix for sort in preview
    writeThemedCards('3-stats', themeName => getOrganizationStatsSVG(statsData, themeName), options);
};

export const getOrganizationStatsSVGWithThemeName = async function (
    login: string,
    themeName: string,
    token: string,
    override?: ThemeColorOverride,
    hideLogo = false
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const statsData = await getOrganizationStatsData(login, token);
    return getOrganizationStatsSVG(statsData, themeName, override, hideLogo);
};

const getOrganizationStatsSVG = function (
    statsData: {index: number; icon: string; name: string; value: string}[],
    themeName: string,
    override?: ThemeColorOverride,
    hideLogo = false
) {
    const title = 'Stats';
    const svgString = statsCard(`${title}`, statsData, resolveTheme(themeName, override), hideLogo);
    return svgString;
};

const getOrganizationStatsData = async function (
    login: string,
    token: string
): Promise<{index: number; icon: string; name: string; value: string}[]> {
    const organizationDetails = await getOrganizationDetails(login, token);

    const statsData = [
        {
            index: 0,
            icon: Icon.STAR,
            name: 'Total Stars:',
            value: `${abbreviateNumber(organizationDetails.totalStars, 1)}`
        },
        {
            index: 1,
            icon: Icon.REPOS,
            name: 'Total Repos:',
            value: `${abbreviateNumber(organizationDetails.totalPublicRepos, 1)}`
        },
        {
            index: 2,
            icon: Icon.FORK,
            name: 'Total Forks:',
            value: `${abbreviateNumber(organizationDetails.totalForks, 1)}`
        },
        {
            index: 3,
            icon: Icon.ISSUE,
            name: 'Open Issues:',
            value: `${abbreviateNumber(organizationDetails.totalOpenIssues, 1)}`
        }
    ];
    return statsData;
};
