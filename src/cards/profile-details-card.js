const ThemeMap = require('../const/theme');
const Icons = require('../const/icon');
const NumAbbr = require('number-abbreviate');
const moment = require('moment');
const getProfileDetails = require('../github-api/profile-details');
const getContributionByYear = require('../github-api/contributions-by-year');
const createDetailCard = require('../templates/profile-details-card');
const { writeSVG } = require('../utils/file-writer');

const createProfileDetailsCard = async function (username) {
    const profileDetailsData = await getProfileDetailsData(username);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getProfileDetailsSVG(profileDetailsData, themeName);
        // output to folder, use 0- prefix for sort in preview
        writeSVG(themeName, '0-profile-details', svgString);
    }
};
const getProfileDetailsSVGWithThemeName = async function (username, themeName) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const profileDetailsData = await getProfileDetailsData(username);
    return getProfileDetailsSVG(profileDetailsData, themeName);
};

const getProfileDetailsSVG = function (profileDetailsData, themeName) {
    const contributionsData = profileDetailsData.contributions;
    const title =
        profileDetailsData.name == null
            ? `${profileDetailsData.username}`
            : `${profileDetailsData.username} (${profileDetailsData.name})`;
    const svgString = createDetailCard(
        `${title}`,
        profileDetailsData.userDetails,
        contributionsData,
        ThemeMap.get(themeName)
    );
    return svgString;
};

const getProfileDetailsData = async function (username) {
    const profileDetails = await getProfileDetails(username);
    profileDetails.username = username;
    let totalContributions = 0;
    if (process.env.VERCEL) {
        // If running on vercel, we only calculate for last 1 year to avoid hobby timeout limit
        profileDetails.contributionYears = profileDetails.contributionYears.slice(
            0,
            1
        );
        for (const year of profileDetails.contributionYears) {
            totalContributions += (await getContributionByYear(username, year))
                .totalContributions;
        }
    } else {
        for (const year of profileDetails.contributionYears) {
            totalContributions += (await getContributionByYear(username, year))
                .totalContributions;
        }
    }
    const numAbbr = new NumAbbr();
    profileDetails.userDetails = [
        // If running on vercel, we only display for last 1 year contributions count
        !process.env.VERCEL
            ? {
                  index: 0,
                  icon: Icons.GITHUB,
                  name: 'Contributions',
                  value: `${numAbbr.abbreviate(
                      totalContributions,
                      2
                  )} Contributions on GitHub`,
              }
            : {
                  index: 0,
                  icon: Icons.GITHUB,
                  name: 'Contributions',
                  value: `${numAbbr.abbreviate(
                      totalContributions,
                      2
                  )} Contributions in ${profileDetails.contributionYears[0]}`,
              },
        {
            index: 1,
            icon: Icons.REPOS,
            name: 'Public Repos',
            value: `${numAbbr.abbreviate(
                profileDetails['totalPublicRepos'],
                2
            )} Public Repos`,
        },
        {
            index: 2,
            icon: Icons.CLOCK,
            name: 'JoinedAt',
            value: `Joined GitHub ${moment(
                profileDetails['joinedAt']
            ).fromNow()}`,
        },
    ];

    // hard code here, cuz I'm lazy
    if (profileDetails['email']) {
        profileDetails.userDetails.push({
            index: 3,
            icon: Icons.EMAIL,
            name: 'Email',
            value: profileDetails['email'],
        });
    } else if (profileDetails['company']) {
        profileDetails.userDetails.push({
            index: 3,
            icon: Icons.COMPANY,
            name: 'Company',
            value: profileDetails['company'],
        });
    } else if (profileDetails['location']) {
        profileDetails.userDetails.push({
            index: 3,
            icon: Icons.LOCATION,
            name: 'Location',
            value: profileDetails['location'],
        });
    }

    return profileDetails;
};

module.exports = {
    createProfileDetailsCard,
    getProfileDetailsSVGWithThemeName,
};
