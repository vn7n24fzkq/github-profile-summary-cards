const ThemeMap = require('../const/theme');
const getProductiveTime = require('../github-api/productive-time');
const productiveTimeCard = require('../templates/productive-time-card');
const { writeSVG } = require('../utils/file-writer');

const createProductiveTimeCard = async function (username, timezone) {
    const productiveTimeData = await getProductiveTimeData(username, timezone);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getProductiveTimeSVG(productiveTimeData, themeName, timezone);
        // output to folder, use 4- prefix for sort in preview
        writeSVG(themeName, '4-productive-time', svgString);
    }
};

const getProductiveTimeSVGWithThemeName = async function (username, themeName, timezone) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const productiveTimeData = await getProductiveTimeData(username, timezone);
    return getProductiveTimeSVG(productiveTimeData, themeName, timezone);
};

const getProductiveTimeSVG = function (productiveTimeData, themeName, timezone) {
    const svgString = productiveTimeCard(
        productiveTimeData,
        ThemeMap.get(themeName),
        timezone
    );
    return svgString;
};

const getProductiveTimeData = async function (username, timezone) {
    const until = new Date();
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const productiveTime = await getProductiveTime(
        username,
        until.toISOString(),
        since.toISOString()
    );
    // process productiveTime
    const chartData = new Array(24);
    chartData.fill(0);
    for (const time of productiveTime) {
        const hour = new Date(time).getUTCHours(); // we use UTC+0 here
        chartData[hour] += 1;
    }

    return transferDataWithTimezone(timezone, chartData);
};

const transferDataWithTimezone = function (timezone, chartData) {
    const offset = getHourOffset(timezone)
    const newChartData = new Array(24);

    for (let i = 0; i < chartData.length; i++) {
        newChartData[(i+offset)%24] = chartData[i]
    }

    return newChartData
}

const getHourOffset = function (timezone) {
    process.env.TZ = timezone || "Europe/London"
    var lag = new Date().getTimezoneOffset()/60

    if (lag > 0) {
        return 24 - lag
    }
    return -lag
}

module.exports = {
    createProductiveTimeCard,
    getProductiveTimeSVGWithThemeName,
    transferDataWithTimezone,
};
