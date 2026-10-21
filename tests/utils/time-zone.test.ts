import {normalizeTimeZone, createTimeZoneHourFormatter} from '../../src/utils/time-zone';

describe('time zone helpers', () => {
    it('accepts IANA zone names and returns the canonical spelling', () => {
        expect(normalizeTimeZone('Europe/Zurich')).toBe('Europe/Zurich');
        expect(normalizeTimeZone('europe/zurich')).toBe('Europe/Zurich');
        expect(normalizeTimeZone('America/New_York')).toBe('America/New_York');
        expect(normalizeTimeZone('UTC')).toBe('UTC');
        expect(normalizeTimeZone('Etc/GMT+5')).toBe('Etc/GMT+5');
    });

    it.each([
        '+01:00',
        '-05:00',
        '+0100',
        '-0500',
        '+01',
        '-05',
        '+00',
        '-00',
        '+0000',
        '-0000',
        '+00:00',
        '-00:00',
        '+0130',
        '-0530',
        '+01:30',
        '-05:30',
        '+23:59',
        '-23:59'
    ])('rejects numeric offset %p', raw => {
        expect(normalizeTimeZone(raw)).toBeNull();
    });

    it('rejects a numeric offset after leading whitespace', () => {
        expect(normalizeTimeZone(' +01:00')).toBeNull();
    });

    it.each(['', '   ', 'Not/AZone', 'Europe/Zurich/Extra'])('rejects invalid zone %p', raw => {
        expect(normalizeTimeZone(raw)).toBeNull();
    });

    it('creates a formatter that applies standard and daylight time per date', () => {
        const formatter = createTimeZoneHourFormatter('Europe/Zurich');

        // CET (UTC+1) in January, CEST (UTC+2) in July.
        expect(formatter.format(new Date('2024-01-15T10:30:00Z'))).toBe('11');
        expect(formatter.format(new Date('2024-07-15T10:30:00Z'))).toBe('12');
    });

    it('formats midnight as 00 rather than 24', () => {
        const formatter = createTimeZoneHourFormatter('Europe/Zurich');
        expect(formatter.format(new Date('2024-01-15T23:30:00Z'))).toBe('00');
    });
});
