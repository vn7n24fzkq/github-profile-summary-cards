import {ThemeMap, ThemeColorOverride, resolveTheme} from '../const/theme';
import {Icon} from '../const/icon';
import {abbreviateNumber} from 'js-abbreviation-number';
import {getProfileDetails} from '../github-api/profile-details';
import {getContributionTotals} from '../utils/contribution-history';
import {createStatsCard as statsCard} from '../templates/stats-card';
import {CardGenerationOptions, writeThemedCards} from '../utils/card-generation';

export const createStatsCard = async function (username: string, token: string, options: CardGenerationOptions = {}) {
    const statsData = await getStatsData(username, token);
    // use 3- prefix for sort in preview
    writeThemedCards('3-stats', themeName => getStatsSVG(statsData, themeName), options);
};

export const getStatsSVGWithThemeName = async function (
    username: string,
    themeName: string,
    token: string,
    override?: ThemeColorOverride,
    hideLogo = false
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const statsData = await getStatsData(username, token);
    return getStatsSVG(statsData, themeName, override, hideLogo);
};

const getStatsSVG = function (
    StatsData: {index: number; icon: string; name: string; value: string}[],
    themeName: string,
    override?: ThemeColorOverride,
    hideLogo = false
) {
    const title = 'Stats';
    const svgString = statsCard(`${title}`, StatsData, resolveTheme(themeName, override), hideLogo);
    return svgString;
};

const getStatsData = async function (
    username: string,
    token: string
): Promise<{index: number; icon: string; name: string; value: string}[]> {
    const profileDetails = await getProfileDetails(username, token);
    const totalStars = profileDetails.totalStars;
    const totalPullRequestContributions = profileDetails.totalPullRequestContributions;
    const totalIssueContributions = profileDetails.totalIssueContributions;
    const totalRepositoryContributions = profileDetails.totalRepositoryContributions;

    // Full history everywhere — per-year results are cached (past years are
    // immutable), so the web service can afford the same semantics as the Action.
    const {totalCommitContributions} = await getContributionTotals(username, profileDetails.contributionYears, token);

    const statsData = [
        {
            index: 0,
            icon: Icon.STAR,
            name: 'Total Stars:',
            value: `${abbreviateNumber(totalStars, 1)}`
        },
        {
            index: 1,
            icon: Icon.COMMIT,
            name: 'Total Commits:',
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
