import {ThemeMap, ThemeColorOverride, resolveTheme} from '../const/theme';
import {getProductiveTime} from '../github-api/productive-time';
import {createProductiveCard as productiveTimeCard} from '../templates/productive-time-card';
import {CardGenerationOptions, writeThemedCards} from '../utils/card-generation';

export const createProductiveTimeCard = async function (
    username: string,
    utcOffset: number,
    token: string,
    options: CardGenerationOptions = {}
) {
    const productiveTimeData = await getProductiveTimeData(username, utcOffset, token);
    // use 4- prefix for sort in preview
    writeThemedCards(
        '4-productive-time',
        themeName => getProductiveTimeSVG(productiveTimeData, themeName, utcOffset),
        options
    );
};

export const getProductiveTimeSVGWithThemeName = async function (
    username: string,
    themeName: string,
    utcOffset: number,
    token: string,
    override?: ThemeColorOverride
) {
    if (!ThemeMap.has(themeName)) throw new Error('Theme does not exist');
    const productiveTimeData = await getProductiveTimeData(username, utcOffset, token);
    return getProductiveTimeSVG(productiveTimeData, themeName, utcOffset, override);
};

const getProductiveTimeSVG = function (
    productiveTimeData: Array<number>,
    themeName: string,
    utcOffset: number,
    override?: ThemeColorOverride
): string {
    const svgString = productiveTimeCard(productiveTimeData, resolveTheme(themeName, override), utcOffset);
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

const getProductiveTimeData = async function (
    username: string,
    utcOffset: number,
    token: string
): Promise<Array<number>> {
    // Round the 1-year window to UTC day boundaries: the values feed the
    // data-cache key, and millisecond-precision timestamps made the key unique
    // per request — productive-time never cache-hit and littered Redis with
    // throwaway keys. Day granularity costs <1 day of data on a 365-day window.
    const until = new Date();
    until.setUTCHours(24, 0, 0, 0); // end of the current UTC day
    const since = new Date(until);
    since.setUTCFullYear(since.getUTCFullYear() - 1);
    const productiveTime = await getProductiveTime(username, until.toISOString(), since.toISOString(), token);
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
