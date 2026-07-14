import {ThemeMap, ThemeColorOverride, resolveTheme} from '../const/theme';
import {Icon} from '../const/icon';
import {abbreviateNumber} from 'js-abbreviation-number';
import {getOrganizationDetails, OrganizationDetails} from '../github-api/organization-details';
import {createDetailCard} from '../templates/profile-details-card';
import {CardGenerationOptions, writeThemedCards} from '../utils/card-generation';
import {buildProfileTitle} from '../utils/profile-title';

const ORG_CHART_CAPTION = 'repos created over time';

/**
 * Creates a Profile Details Card SVG for a GitHub organization.
 *
 * @param {string} login - The GitHub organization login.
 * @param {string} token - The GitHub API token.
 * @param {CardGenerationOptions} [options] - Optional theme/animation/displayName controls.
 * @return {Promise<void>}
 */
export const createOrganizationProfileDetailsCard = async function (
    login: string,
    token: string,
    options: CardGenerationOptions = {}
) {
    const profileDetailsData = await getOrganizationProfileDetailsData(login, token);
    const title = buildProfileTitle(login, profileDetailsData[0].name, options.displayName);
    // use 0- prefix for sort in preview
    writeThemedCards(
        '0-profile-details',
        themeName => getOrganizationProfileDetailsSVG(title, profileDetailsData[2], profileDetailsData[1], themeName),
        options
    );
};

/**
 * Generates the SVG for an Organization Profile Details Card.
 *
 * @param {string} login - The GitHub organization login.
 * @param {string} themeName - The card theme.
 * @param {string} token - The GitHub API token.
 * @param {ThemeColorOverride} [override] - Optional per-request color overrides.
 * @param {string} [displayName] - Optional override for the displayed name/title.
 * @return {Promise<string>} The SVG string.
 */
export const getOrganizationProfileDetailsSVGWithThemeName = async function (
    login: string,
    themeName: string,
    token: string,
    override?: ThemeColorOverride,
    displayName?: string
): Promise<string> {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const profileDetailsData = await getOrganizationProfileDetailsData(login, token);
    const title = buildProfileTitle(login, profileDetailsData[0].name, displayName);
    return getOrganizationProfileDetailsSVG(title, profileDetailsData[2], profileDetailsData[1], themeName, override);
};

const getOrganizationProfileDetailsSVG = function (
    title: string,
    chartData: {contributionCount: number; date: Date}[],
    orgDetails: {index: number; icon: string; name: string; value: string}[],
    themeName: string,
    override?: ThemeColorOverride
): string {
    const svgString = createDetailCard(
        `${title}`,
        orgDetails,
        chartData,
        resolveTheme(themeName, override),
        ORG_CHART_CAPTION
    );
    return svgString;
};

const getOrganizationDateCreated = function (organizationDetails: OrganizationDetails): string {
    const s = (unit: number) => {
        return unit === 1 ? '' : 's';
    };

    const now = Date.now();
    const created = new Date(organizationDetails.createdAt);
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

const getOrganizationProfileDetailsData = async function (
    login: string,
    token: string
): Promise<
    [
        OrganizationDetails,
        {index: number; icon: string; name: string; value: string}[],
        {contributionCount: number; date: Date}[]
    ]
> {
    const organizationDetails = await getOrganizationDetails(login, token);

    const orgDetails: {index: number; icon: string; name: string; value: string}[] = [
        {
            index: 0,
            icon: Icon.REPOS,
            name: 'Public Repos',
            value: `${abbreviateNumber(organizationDetails.totalPublicRepos, 2)} Public Repos`
        },
        {
            index: 1,
            icon: Icon.CLOCK,
            name: 'CreatedAt',
            value: `Created on GitHub ${getOrganizationDateCreated(organizationDetails)}`
        }
    ];

    if (organizationDetails.email) {
        orgDetails.push({
            index: 2,
            icon: Icon.EMAIL,
            name: 'Email',
            value: organizationDetails.email
        });
    } else if (organizationDetails.location) {
        orgDetails.push({
            index: 2,
            icon: Icon.LOCATION,
            name: 'Location',
            value: organizationDetails.location
        });
    } else if (organizationDetails.websiteUrl) {
        orgDetails.push({
            index: 2,
            icon: Icon.LINK,
            name: 'Website',
            value: organizationDetails.websiteUrl
        });
    }

    const chartData = organizationDetails.repoCreatedAt
        .slice()
        .sort((a, b) => a.getTime() - b.getTime())
        .map(d => ({contributionCount: 1, date: d}));

    return [organizationDetails, orgDetails, chartData];
};
