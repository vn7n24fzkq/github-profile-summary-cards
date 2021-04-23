const ThemeMap = require('../const/theme');
const Icons = require('../const/icon');
const NumAbbr = require('number-abbreviate');
const getProfileDetails = require('../github-api/profile-details');
const getContributionByYear = require('../github-api/contributions-by-year');
const statsCard = require('../templates/stats-card');
const { writeSVG } = require('../utils/file-writer');

const createStatsCard = async function (username) {
    const statsData = await getStatsData(username);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getStatsSVG(statsData, themeName);
        // output to folder, use 3- prefix for sort in preview
        writeSVG(themeName, '3-stats', svgString);
    }
};

const getStatsSVGWithThemeName = async function (username, themeName) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const statsData = await getStatsData(username);
    return getStatsSVG(statsData, themeName);
};

const getStatsSVG = function (StatsData, themeName) {
    const title = 'Stats';
    const svgString = statsCard(`${title}`, StatsData, ThemeMap.get(themeName));
    return svgString;
};

const getStatsData = async function (username) {
    const profileDetails = await getProfileDetails(username);
    const totalStars = profileDetails.totalStars;
    let totalCommitContributions = 0;
    const totalPullRequestContributions =
        profileDetails.totalPullRequestContributions;
    const totalIssueContributions = profileDetails.totalIssueContributions;

    const totalRepositoryContributions =
        profileDetails.totalRepositoryContributions;
    if (process.env.VERCEL) {
        // If running on vercel, we only calculate for last 1 year to avoid hobby timeout limit
        profileDetails.contributionYears = profileDetails.contributionYears.slice(
            0,
            1
        );
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

    const numAbbr = new NumAbbr();
    const statsData = [
        {
            index: 0,
            icon: Icons.STAR,
            name: 'Total Stars:',
            value: `${numAbbr.abbreviate(totalStars, 1)}`,
        },
        // If running on vercel, we only display for last 1 year commits count
        !process.env.VERCEL
            ? {
                  index: 1,
                  icon: Icons.COMMIT,
                  name: 'Total Commits:',
                  value: `${numAbbr.abbreviate(totalCommitContributions, 1)}`,
              }
            : {
                  index: 1,
                  icon: Icons.COMMIT,
                  name: `${profileDetails.contributionYears[0]} Commits:`,
                  value: `${numAbbr.abbreviate(totalCommitContributions, 1)}`,
              },
        {
            index: 2,
            icon: Icons.PULL_REQUEST,
            name: 'Total PRs:',
            value: `${numAbbr.abbreviate(totalPullRequestContributions, 1)}`,
        },
        {
            index: 3,
            icon: Icons.ISSUE,
            name: 'Total Issues:',
            value: `${numAbbr.abbreviate(totalIssueContributions, 1)}`,
        },
        {
            index: 4,
            icon: Icons.REPOS,
            name: 'Contributed to:',
            value: `${numAbbr.abbreviate(totalRepositoryContributions, 1)}`,
        },
    ];
    return statsData;
};

module.exports = {
    createStatsCard,
    getStatsSVGWithThemeName,
};
