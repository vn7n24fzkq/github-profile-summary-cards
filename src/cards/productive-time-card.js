import ThemeMap from '../const/theme.js'
import getProfileDetails from '../github-api/profile-details.js'
import getProductiveTime from '../github-api/productive-time.js'
import productiveTimeCard from '../templates/productive-time-card.js'
import { writeSVG } from '../utils/file-writer.js'

const createProductiveTimeCard = async function (username) {
    const userId = (await getProfileDetails(username))['id']
    const until = new Date() // get data until now
    const productiveTime = await getProductiveTime(
        username,
        userId,
        until.toISOString()
    )
    // process productiveTime
    const chartData = new Array(24)
    chartData.fill(0)
    for (const time of productiveTime) {
        const hour = new Date(time).getUTCHours() // we use UTC+0 here
        chartData[hour] += 1
    }

    for (const themeEntry of ThemeMap.entries()) {
        const svgString = productiveTimeCard(chartData, themeEntry[1])
        // output to folder, use 4- prefix for sort in preview
        writeSVG(themeEntry[0], '4-productive-time', svgString)
    }
}

export default createProductiveTimeCard
