import {ThemeMap, Theme} from '../const/theme';
import {Icon} from '../const/icon';
import {abbreviateNumber} from 'js-abbreviation-number';
import {getProfileDetails, ProfileDetails, ProfileContribution} from '../github-api/profile-details';
import {getContributionByYear} from '../github-api/contributions-by-year';
import {createDetailCard} from '../templates/profile-details-card';
import {writeSVG} from '../utils/file-writer';

export const createProfileDetailsCard = async function (username: string) {
    const profileDetailsData = await getProfileDetailsData(username);
    for (const themeName of ThemeMap.keys()) {
        const title =
            profileDetailsData[0].name == null ? `${username}` : `${username} (${profileDetailsData[0].name})`;
        const svgString = getProfileDetailsSVG(
            title,
            profileDetailsData[0].contributions,
            profileDetailsData[1],
            themeName,
            undefined
        );
        // output to folder, use 0- prefix for sort in preview
        writeSVG(themeName, '0-profile-details', svgString);
    }
};
export const getProfileDetailsSVGWithThemeName = async function (
    username: string,
    themeName: string,
    customTheme: Theme
): Promise<string> {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const profileDetailsData = await getProfileDetailsData(username);
    const title = profileDetailsData[0].name == null ? `${username}` : `${username} (${profileDetailsData[0].name})`;
    return getProfileDetailsSVG(title, profileDetailsData[0].contributions, profileDetailsData[1], themeName, customTheme);
};

const getProfileDetailsSVG = function (
    title: string,
    contributionsData: ProfileContribution[],
    userDetails: {index: number; icon: string; name: string; value: string}[],
    themeName: string,
    customTheme: Theme | undefined
): string {
    let theme = { ...ThemeMap.get(themeName)! };
    if (customTheme !== undefined) {
        if (customTheme.title) theme.title = "#" + customTheme.title;
        if (customTheme.text) theme.text = "#" + customTheme.text;
        if (customTheme.background) theme.background = "#" + customTheme.background;
        if (customTheme.stroke) { theme.stroke = "#" + customTheme.stroke; theme.strokeOpacity = 1; }
        if (customTheme.icon) theme.icon = "#" + customTheme.icon;
        if (customTheme.chart) theme.chart = "#" + customTheme.chart;
    }
    const svgString = createDetailCard(`${title}`, userDetails, contributionsData, theme);
    return svgString;
};

const getProfileDateJoined = function (profileDetails: ProfileDetails): string {
    const s = (unit: number) => {
        return unit === 1 ? '' : 's';
    };

    const now = Date.now();
    const created = new Date(profileDetails.createdAt);
    const diff = new Date(now - created.getTime());
    const years = diff.getUTCFullYear() - new Date(0).getUTCFullYear();
    const months = diff.getUTCMonth() - new Date(0).getUTCMonth();
    const days = diff.getUTCDate() - new Date(0).getUTCDate();
    return years
        ? `${years} year${s(years)} ago`
        : months
        ? `${months} month${s(months)} ago`
        : `${days} day${s(days)} ago`;
};

const getProfileDetailsData = async function (
    username: string
): Promise<[ProfileDetails, {index: number; icon: string; name: string; value: string}[]]> {
    const profileDetails = await getProfileDetails(username);
    let totalContributions = 0;
    if (process.env.VERCEL) {
        // If running on vercel, we only calculate for last 1 year to avoid hobby timeout limit
        profileDetails.contributionYears = profileDetails.contributionYears.slice(0, 1);
        for (const year of profileDetails.contributionYears) {
            totalContributions += (await getContributionByYear(username, year)).totalContributions;
        }
    } else {
        for (const year of profileDetails.contributionYears) {
            totalContributions += (await getContributionByYear(username, year)).totalContributions;
        }
    }

    const userDetails: {index: number; icon: string; name: string; value: string}[] = [
        // If running on vercel, we only display for last 1 year contributions count
        !process.env.VERCEL
            ? {
                  index: 0,
                  icon: Icon.GITHUB,
                  name: 'Contributions',
                  value: `${abbreviateNumber(totalContributions, 2)} Contributions on GitHub`
              }
            : {
                  index: 0,
                  icon: Icon.GITHUB,
                  name: 'Contributions',
                  value: `${abbreviateNumber(totalContributions, 2)} Contributions in ${
                      profileDetails.contributionYears[0]
                  }`
              },
        {
            index: 1,
            icon: Icon.REPOS,
            name: 'Public Repos',
            value: `${abbreviateNumber(profileDetails.totalPublicRepos, 2)} Public Repos`
        },
        {
            index: 2,
            icon: Icon.CLOCK,
            name: 'JoinedAt',
            value: `Joined GitHub ${getProfileDateJoined(profileDetails)}`
        }
    ];

    // hard code here, cuz I'm lazy
    if (profileDetails.email) {
        userDetails.push({
            index: 3,
            icon: Icon.EMAIL,
            name: 'Email',
            value: profileDetails['email']
        });
    } else if (profileDetails.company) {
        userDetails.push({
            index: 3,
            icon: Icon.COMPANY,
            name: 'Company',
            value: profileDetails['company']
        });
    } else if (profileDetails.location) {
        userDetails.push({
            index: 3,
            icon: Icon.LOCATION,
            name: 'Location',
            value: profileDetails['location']
        });
    }

    return [profileDetails, userDetails];
};
