import {createProductiveTimeCard, getProductiveTimeData} from '../../src/cards/productive-time-card';
import {getProductiveTime} from '../../src/github-api/productive-time';
import {writeSVG} from '../../src/utils/file-writer';

jest.mock('../../src/github-api/productive-time');
jest.mock('../../src/utils/file-writer');

const mockGetProductiveTime = getProductiveTime as jest.Mock;
const mockWriteSVG = writeSVG as jest.Mock;

const commitDates = (...dates: string[]) => ({productiveDate: dates});

describe('productive time time-zone bucketing', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('uses standard time (CET, UTC+1) for a winter commit', async () => {
        mockGetProductiveTime.mockResolvedValue(commitDates('2024-01-15T10:30:00Z'));

        const chartData = await getProductiveTimeData('octocat', 0, 'token', 'Europe/Zurich');

        expect(chartData[11]).toBe(1);
    });

    it('uses daylight time (CEST, UTC+2) for a summer commit', async () => {
        mockGetProductiveTime.mockResolvedValue(commitDates('2024-07-15T10:30:00Z'));

        const chartData = await getProductiveTimeData('octocat', 0, 'token', 'Europe/Zurich');

        expect(chartData[12]).toBe(1);
    });

    it('handles the spring-forward transition', async () => {
        mockGetProductiveTime.mockResolvedValue(
            commitDates(
                '2024-03-31T00:30:00Z', // 01:30 CET, before the jump
                '2024-03-31T01:30:00Z' // 03:30 CEST, after the jump
            )
        );

        const chartData = await getProductiveTimeData('octocat', 0, 'token', 'Europe/Zurich');

        expect(chartData[1]).toBe(1);
        expect(chartData[3]).toBe(1);
    });

    it('handles the fall-back transition', async () => {
        mockGetProductiveTime.mockResolvedValue(
            commitDates(
                '2024-10-27T00:30:00Z', // 02:30 CEST
                '2024-10-27T01:30:00Z' // 02:30 CET, one offset later
            )
        );

        const chartData = await getProductiveTimeData('octocat', 0, 'token', 'Europe/Zurich');

        // Both wall-clock times are 02:xx, but only because the zone offset changed.
        // A fixed-offset implementation would put them in different buckets.
        expect(chartData[2]).toBe(2);
    });

    it('maps zoned midnight to bucket 0', async () => {
        mockGetProductiveTime.mockResolvedValue(commitDates('2024-01-15T23:30:00Z'));

        const chartData = await getProductiveTimeData('octocat', 0, 'token', 'Europe/Zurich');

        expect(chartData[0]).toBe(1);
        expect(chartData[23]).toBe(0);
    });

    it('prefers the time zone over the UTC offset when both are supplied', async () => {
        mockGetProductiveTime.mockResolvedValue(commitDates('2024-07-15T10:30:00Z'));

        const chartData = await getProductiveTimeData('octocat', 5, 'token', 'Europe/Zurich');

        expect(chartData[12]).toBe(1); // 12:30 CEST
        expect(chartData[15]).toBe(0); // not 15:30, which +5 would produce
    });

    it('preserves the legacy UTC offset behavior', async () => {
        mockGetProductiveTime.mockResolvedValue(commitDates('2024-07-15T10:30:00Z'));

        const chartData = await getProductiveTimeData('octocat', 5, 'token');

        expect(chartData[15]).toBe(1);
    });

    it('keeps the raw-data fetch independent of the selected time zone', async () => {
        mockGetProductiveTime.mockResolvedValue(commitDates('2024-01-15T10:30:00Z'));

        await getProductiveTimeData('octocat', 8, 'token', 'Europe/Zurich');
        await getProductiveTimeData('octocat', 8, 'token', 'America/New_York');

        // The shared Redis key is per-user: the zone is applied after the cache.
        expect(mockGetProductiveTime.mock.calls[0]).toEqual(mockGetProductiveTime.mock.calls[1]);
    });

    it('writes the time-zone title when generating a card', async () => {
        mockGetProductiveTime.mockResolvedValue(commitDates('2024-01-15T10:30:00Z'));

        await createProductiveTimeCard('octocat', 0, 'token', {theme: 'default'}, 'Europe/Zurich');

        expect(mockWriteSVG).toHaveBeenCalledWith(
            'default',
            '4-productive-time',
            expect.stringContaining('Commits (Europe/Zurich)')
        );
    });
});
