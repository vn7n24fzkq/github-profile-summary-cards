import {normalizeTimeZone, createTimeZoneHourFormatter} from '../../src/utils/time-zone';

describe('time zone helpers', () => {
    it('accepts IANA zone names and returns the canonical spelling', () => {
        expect(normalizeTimeZone('Europe/Zurich')).toBe('Europe/Zurich');
        expect(normalizeTimeZone('europe/zurich')).toBe('Europe/Zurich');
        expect(normalizeTimeZone('UTC')).toBe('UTC');
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
