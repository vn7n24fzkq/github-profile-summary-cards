import ThemeMap from '../const/theme.js'
import Icon from '../const/icon.js'
import NumAbbr from 'number-abbreviate'
import moment from 'moment'
import getProfileDetails from '../github-api/profile-details.js'
import getContributionByYear from '../github-api/contributions-by-year.js'
import createDetailCard from '../templates/profile-details-card.js'
import { writeSVG } from '../utils/file-writer.js'

const createProfileDetailsCard = async function (username) {
    const userDetails = await getProfileDetails(username)
    let totalContributions = 0
    for (const year of userDetails.contributionYears) {
        totalContributions += (await getContributionByYear(username, year))
            .totalContributions
    }
    const numAbbr = new NumAbbr()
    const details = [
        {
            index: 0,
            icon: Icon.GITHUB,
            name: 'Contributions',
            value: `${numAbbr.abbreviate(
                totalContributions,
                2
            )} Contributions on GitHub`,
        },
        {
            index: 1,
            icon: Icon.REPOS,
            name: 'Public Repos',
            value: `${numAbbr.abbreviate(
                userDetails['totalPublicRepos'],
                2
            )} Public Repos`,
        },
        {
            index: 2,
            icon: Icon.CLOCK,
            name: 'JoinedAt',
            value: `Joined GitHub ${moment(userDetails['joinedAt']).fromNow()}`,
        },
    ]

    // hard code here, cuz I'm lazy
    if (userDetails['email']) {
        details.push({
            index: 3,
            icon: Icon.EMAIL,
            name: 'Email',
            value: userDetails['email'],
        })
    } else if (userDetails['company']) {
        details.push({
            index: 3,
            icon: Icon.COMPANY,
            name: 'Company',
            value: userDetails['company'],
        })
    } else if (userDetails['location']) {
        details.push({
            index: 3,
            icon: Icon.LOCATION,
            name: 'Location',
            value: userDetails['location'],
        })
    }

    const contributionsData = userDetails.contributions

    for (const themeEntry of ThemeMap.entries()) {
        const title =
            userDetails.name == null
                ? `${username}`
                : `${username} (${userDetails.name})`
        const svgString = createDetailCard(
            `${title}`,
            details,
            contributionsData,
            themeEntry[1]
        )
        // output to folder, use 0- prefix for sort in preview
        writeSVG(themeEntry[0], '0-profile-details', svgString)
    }
}

export default createProfileDetailsCard
