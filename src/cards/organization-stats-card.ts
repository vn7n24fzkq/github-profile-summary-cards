import {ThemeMap} from '../const/theme';
import {Icon} from '../const/icon';
import {abbreviateNumber} from 'js-abbreviation-number';
import {getOrganizationDetails} from '../github-api/organization-details';
import {createStatsCard as statsCard} from '../templates/stats-card';
import {writeSVG} from '../utils/file-writer';

export const createOrganizationStatsCard = async function (login: string, token: string) {
    const statsData = await getOrganizationStatsData(login, token);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getOrganizationStatsSVG(statsData, themeName);
        // output to folder, use 3- prefix for sort in preview
        writeSVG(themeName, '3-stats', svgString);
    }
};

export const getOrganizationStatsSVGWithThemeName = async function (login: string, themeName: string, token: string) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const statsData = await getOrganizationStatsData(login, token);
    return getOrganizationStatsSVG(statsData, themeName);
};

const getOrganizationStatsSVG = function (
    statsData: {index: number; icon: string; name: string; value: string}[],
    themeName: string
) {
    const title = 'Stats';
    const svgString = statsCard(`${title}`, statsData, ThemeMap.get(themeName)!);
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
