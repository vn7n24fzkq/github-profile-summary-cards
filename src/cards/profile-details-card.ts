import {ThemeMap, ThemeColorOverride, resolveTheme} from '../const/theme';
import {Icon} from '../const/icon';
import {abbreviateNumber} from 'js-abbreviation-number';
import {getProfileDetails, ProfileDetails, ProfileContribution} from '../github-api/profile-details';
import {getContributionTotals} from '../utils/contribution-history';
import {createDetailCard} from '../templates/profile-details-card';
import {CardGenerationOptions, writeThemedCards} from '../utils/card-generation';
import {buildProfileTitle} from '../utils/profile-title';

/**
 * Creates a Profile Details Card SVG.
 *
 * @param {string} username - The GitHub username.
 * @param {string} token - The GitHub API token.
 * @param {CardGenerationOptions} [options] - Optional theme/animation/displayName controls.
 * @return {Promise<void>}
 */
export const createProfileDetailsCard = async function (
    username: string,
    token: string,
    options: CardGenerationOptions = {}
) {
    const profileDetailsData = await getProfileDetailsData(username, token);
    const title = buildProfileTitle(username, profileDetailsData[0].name, options.displayName);
    // use 0- prefix for sort in preview
    writeThemedCards(
        '0-profile-details',
        themeName => getProfileDetailsSVG(title, profileDetailsData[0].contributions, profileDetailsData[1], themeName),
        options
    );
};
/**
 * Generates the SVG for the Profile Details Card.
 *
 * @param {string} username - The GitHub username.
 * @param {string} themeName - The card theme.
 * @param {string} token - The GitHub API token.
 * @param {ThemeColorOverride} [override] - Optional per-request color overrides.
 * @param {string} [displayName] - Optional override for the displayed name/title.
 * @return {Promise<string>} The SVG string.
 */
export const getProfileDetailsSVGWithThemeName = async function (
    username: string,
    themeName: string,
    token: string,
    override?: ThemeColorOverride,
    displayName?: string
): Promise<string> {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const profileDetailsData = await getProfileDetailsData(username, token);
    const title = buildProfileTitle(username, profileDetailsData[0].name, displayName);
    return getProfileDetailsSVG(title, profileDetailsData[0].contributions, profileDetailsData[1], themeName, override);
};

const getProfileDetailsSVG = function (
    title: string,
    contributionsData: ProfileContribution[],
    userDetails: {index: number; icon: string; name: string; value: string}[],
    themeName: string,
    override?: ThemeColorOverride
): string {
    const svgString = createDetailCard(`${title}`, userDetails, contributionsData, resolveTheme(themeName, override));
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
    username: string,
    token: string
): Promise<[ProfileDetails, {index: number; icon: string; name: string; value: string}[]]> {
    const profileDetails = await getProfileDetails(username, token);
    // Full history everywhere — per-year results are cached (past years are
    // immutable), so the web service can afford the same semantics as the Action.
    const {totalContributions} = await getContributionTotals(username, profileDetails.contributionYears, token);

    const userDetails: {index: number; icon: string; name: string; value: string}[] = [
        {
            index: 0,
            icon: Icon.GITHUB,
            name: 'Contributions',
            value: `${abbreviateNumber(totalContributions, 2)} Contributions on GitHub`
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
