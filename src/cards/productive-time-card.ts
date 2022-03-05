import {ThemeMap} from '../const/theme';
import {getProductiveTime} from '../github-api/productive-time';
import {createProductiveCard as productiveTimeCard} from '../templates/productive-time-card';
import {writeSVG} from '../utils/file-writer';

export const createProductiveTimeCard = async function (username: string, timezone: string) {
    const productiveTimeData = await getProductiveTimeData(username, timezone);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getProductiveTimeSVG(productiveTimeData, themeName, timezone);
        // output to folder, use 4- prefix for sort in preview
        writeSVG(themeName, '4-productive-time', svgString);
    }
};

export const getProductiveTimeSVGWithThemeName = async function (
    username: string,
    themeName: string,
    timezone: string
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const productiveTimeData = await getProductiveTimeData(username, timezone);
    return getProductiveTimeSVG(productiveTimeData, themeName, timezone);
};

const getProductiveTimeSVG = function (productiveTimeData: Array<number>, themeName: string, timezone: string): string {
    const svgString = productiveTimeCard(productiveTimeData, ThemeMap.get(themeName)!, timezone);
    return svgString;
};

const getProductiveTimeData = async function (username: string, timezone: string): Promise<Array<number>> {
    const until = new Date();
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const productiveTime = await getProductiveTime(username, until.toISOString(), since.toISOString());
    // process productiveTime
    const chartData = new Array(24);
    chartData.fill(0);
    for (const time of productiveTime.productiveDate) {
        const hour = new Date(time).getUTCHours(); // we use UTC+0 here
        chartData[hour] += 1;
    }

    return transferDataWithTimezone(timezone, chartData);
};

export const transferDataWithTimezone = function (timezone: string, chartData: number[]): Array<number> {
    const offset = getHourOffset(timezone);
    const newChartData = new Array(24);

    for (let i = 0; i < chartData.length; i++) {
        newChartData[(i + offset) % 24] = chartData[i];
    }

    return newChartData;
};

const getHourOffset = function (timezone: string) {
    process.env.TZ = timezone || 'Europe/London';
    const lag = new Date().getTimezoneOffset() / 60;

    if (lag > 0) {
        return 24 - lag;
    }
    return -lag;
};
