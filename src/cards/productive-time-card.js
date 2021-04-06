const ThemeMap = require('../const/theme');
const getProfileDetails = require('../github-api/profile-details');
const getProductiveTime = require('../github-api/productive-time');
const productiveTimeCard = require('../templates/productive-time-card');
const { writeSVG } = require('../utils/file-writer');

const createProductiveTimeCard = async function (username) {
    const productiveTimeData = await getProductiveTimeData(username);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getProductiveTimeSVG(productiveTimeData, themeName);
        // output to folder, use 4- prefix for sort in preview
        writeSVG(themeName, '4-productive-time', svgString);
    }
};

const getProductiveTimeSVGWithThemeName = async function (username, themeName) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const productiveTimeData = await getProductiveTimeData(username);
    return getProductiveTimeSVG(productiveTimeData, themeName);
};

const getProductiveTimeSVG = function (productiveTimeData, themeName) {
    const svgString = productiveTimeCard(
        productiveTimeData,
        ThemeMap.get(themeName)
    );
    return svgString;
};

const getProductiveTimeData = async function (username) {
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

    return chartData;
};

module.exports = {
    createProductiveTimeCard,
    getProductiveTimeSVGWithThemeName,
};
