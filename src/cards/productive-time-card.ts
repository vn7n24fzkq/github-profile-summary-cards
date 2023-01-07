import {ThemeMap} from '../const/theme';
import {getProductiveTime} from '../github-api/productive-time';
import {createProductiveCard as productiveTimeCard} from '../templates/productive-time-card';
import {writeSVG} from '../utils/file-writer';

export const createProductiveTimeCard = async function (username: string, utcOffset: number) {
    const productiveTimeData = await getProductiveTimeData(username, utcOffset);
    for (const themeName of ThemeMap.keys()) {
        const svgString = getProductiveTimeSVG(productiveTimeData, themeName, utcOffset);
        // output to folder, use 4- prefix for sort in preview
        writeSVG(themeName, '4-productive-time', svgString);
    }
};

export const getProductiveTimeSVGWithThemeName = async function (
    username: string,
    themeName: string,
    utcOffset: number
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const productiveTimeData = await getProductiveTimeData(username, utcOffset);
    return getProductiveTimeSVG(productiveTimeData, themeName, utcOffset);
};

const getProductiveTimeSVG = function (
    productiveTimeData: Array<number>,
    themeName: string,
    utcOffset: number
): string {
    const svgString = productiveTimeCard(productiveTimeData, ThemeMap.get(themeName)!, utcOffset);
    return svgString;
};

const adjustOffset = function (offset: number, RoundRobin: {offset: number}): number {
    if (offset % 1 == 0) {
        return offset;
        // offset % 1 should be 0.3 or 0.7 but its js and it gives 0.29999 or -0.299999 thats why this frankenstein
    } else if ((offset % 1 > 0.29 && offset % 1 < 0.31) || (offset % 1 < -0.29 && offset % 1 > -0.31)) {
        // toggle up and down between hour
        RoundRobin.offset = (RoundRobin.offset + 1) % 2;
        return RoundRobin.offset === 0 ? Math.floor(offset) : Math.ceil(offset);
    } else if ((offset % 1 > 0.44 && offset % 1 < 0.46) || (offset % 1 < -0.44 && offset % 1 > -0.45)) {
        // distrubute 1 : 3 ratio for 0.45 utc time
        RoundRobin.offset = (RoundRobin.offset + 1) % 4;
        return RoundRobin.offset === 0 ? Math.floor(offset) : Math.ceil(offset);
    } else {
        // flood down , if utc is given right it will never be executed
        return Math.floor(offset);
    }
};

const getProductiveTimeData = async function (username: string, utcOffset: number): Promise<Array<number>> {
    const until = new Date();
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const productiveTime = await getProductiveTime(username, until.toISOString(), since.toISOString());
    // process productiveTime
    const chartData = new Array(24);
    chartData.fill(0);
    const roundRobin = {
        offset: 0
    };
    for (const time of productiveTime.productiveDate) {
        const hour = new Date(time).getUTCHours(); // We use UTC+0 here
        const afterOffset = adjustOffset(Number(hour) + Number(utcOffset), roundRobin); // Add offset to hour
        // convert afterOffset to 0-23
        if (afterOffset < 0) {
            // if afterOffset is negative, we need to add 24 to get the correct hour
            chartData[24 + afterOffset] += 1;
        } else if (afterOffset > 23) {
            // if afterOffset is greater than 23, we need to subtract 24 to get the correct hour
            chartData[afterOffset - 24] += 1;
        } else {
            // if afterOffset is between 0 and 23, we can use it as the hour
            chartData[afterOffset] += 1;
        }
    }

    return chartData;
};
