import {transferDataWithTimezone} from '../../src/cards/productive-time-card';

describe('Validate chart data with timezone set', () => {
    it('validate chart data depending on the correct timezone', () => {
        const chartData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        const timezone = 'Asia/Shanghai';
        const newChartData = transferDataWithTimezone(timezone, chartData);

        const expectedChartData = [
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            21,
            22,
            23,
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7
        ];
        expect(new Set(newChartData)).toEqual(new Set(expectedChartData));
    });

    it('validate chart data depending on the null timezone', () => {
        const chartData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        const newChartData = transferDataWithTimezone('', chartData);

        const expectedChartData = [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            21,
            22,
            23
        ];
        expect(new Set(newChartData)).toEqual(new Set(expectedChartData));
    });
});
