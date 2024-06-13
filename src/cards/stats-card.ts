import {ThemeMap, Theme} from '../const/theme';
import {Icon} from '../const/icon';
import {abbreviateNumber} from 'js-abbreviation-number';
import {getProfileDetails} from '../github-api/profile-details';
import {getContributionByYear} from '../github-api/contributions-by-year';
import {createStatsCard as statsCard} from '../templates/stats-card';
import {writeSVG} from '../utils/file-writer';

export const createStatsCard = async function (username: string) {
    const statsData = await getStatsData(username);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getStatsSVG(statsData, themeName, undefined);
        // output to folder, use 3- prefix for sort in preview
        writeSVG(themeName, '3-stats', svgString);
    }
};

export const getStatsSVGWithThemeName = async function (
    username: string,
    themeName: string,
    customTheme: Theme
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const statsData = await getStatsData(username);
    return getStatsSVG(statsData, themeName, customTheme);
};

const getStatsSVG = function (
    StatsData: {index: number; icon: string; name: string; value: string}[],
    themeName: string,
    customTheme: Theme | undefined
) {
    const title = 'Stats';
    let theme = { ...ThemeMap.get(themeName)! };
    if (customTheme !== undefined) {
        if (customTheme.title) theme.title = "#" + customTheme.title;
        if (customTheme.text) theme.text = "#" + customTheme.text;
        if (customTheme.background) theme.background = "#" + customTheme.background;
        if (customTheme.stroke) { theme.stroke = "#" + customTheme.stroke; theme.strokeOpacity = 1; }
        if (customTheme.icon) theme.icon = "#" + customTheme.icon;
        if (customTheme.chart) theme.chart = "#" + customTheme.chart;
    }
    const svgString = statsCard(`${title}`, StatsData, theme);
    return svgString;
};

const getStatsData = async function (
    username: string
): Promise<{index: number; icon: string; name: string; value: string}[]> {
    const profileDetails = await getProfileDetails(username);
    const totalStars = profileDetails.totalStars;
    let totalCommitContributions = 0;
    const totalPullRequestContributions = profileDetails.totalPullRequestContributions;
    const totalIssueContributions = profileDetails.totalIssueContributions;

    const totalRepositoryContributions = profileDetails.totalRepositoryContributions;
    if (process.env.VERCEL) {
        // If running on vercel, we only calculate for last 1 year to avoid Vercel timeout limit
        profileDetails.contributionYears = profileDetails.contributionYears.slice(0, 1);
        for (const year of profileDetails.contributionYears) {
            const contributions = await getContributionByYear(username, year);
            totalCommitContributions += contributions.totalCommitContributions;
        }
    } else {
        for (const year of profileDetails.contributionYears) {
            const contributions = await getContributionByYear(username, year);
            totalCommitContributions += contributions.totalCommitContributions;
        }
    }

    const statsData = [
        {
            index: 0,
            icon: Icon.STAR,
            name: 'Total Stars:',
            value: `${abbreviateNumber(totalStars, 1)}`
        },
        // If running on vercel, we only display for last 1 year commits count
        !process.env.VERCEL
            ? {
                  index: 1,
                  icon: Icon.COMMIT,
                  name: 'Total Commits:',
                  value: `${abbreviateNumber(totalCommitContributions, 1)}`
              }
            : {
                  index: 1,
                  icon: Icon.COMMIT,
                  name: `${profileDetails.contributionYears[0]} Commits:`,
                  value: `${abbreviateNumber(totalCommitContributions, 1)}`
              },
        {
            index: 2,
            icon: Icon.PULL_REQUEST,
            name: 'Total PRs:',
            value: `${abbreviateNumber(totalPullRequestContributions, 1)}`
        },
        {
            index: 3,
            icon: Icon.ISSUE,
            name: 'Total Issues:',
            value: `${abbreviateNumber(totalIssueContributions, 1)}`
        },
        {
            index: 4,
            icon: Icon.REPOS,
            name: 'Contributed to:',
            value: `${abbreviateNumber(totalRepositoryContributions, 1)}`
        }
    ];
    return statsData;
};
