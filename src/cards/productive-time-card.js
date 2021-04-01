const ThemeMap = require('../const/theme');
const getProfileDetails = require('../github-api/profile-details');
const getProductiveTime = require('../github-api/productive-time');
const productiveTimeCard = require('../templates/productive-time-card');
const { writeSVG } = require('../utils/file-writer');

const createProductiveTimeCard = async function (username) {
    const userId = (await getProfileDetails(username))['id'];
    const until = new Date(); // get data until now
    const productiveTime = await getProductiveTime(
        username,
        userId,
        until.toISOString()
    );
    // process productiveTime
    const chartData = new Array(24);
    chartData.fill(0);
    for (const time of productiveTime) {
        const hour = new Date(time).getUTCHours(); // we use UTC+0 here
        chartData[hour] += 1;
    }

    for (const themeEntry of ThemeMap.entries()) {
        const svgString = productiveTimeCard(chartData, themeEntry[1]);
        // output to folder, use 4- prefix for sort in preview
        writeSVG(themeEntry[0], '4-productive-time', svgString);
    }
};

module.exports = createProductiveTimeCard;
