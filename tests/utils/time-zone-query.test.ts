import {resolveTimeZoneQuery} from '../../scripts/time-zone-query';

describe('mock dev server time-zone query', () => {
    it('treats an omitted parameter as no time zone', () => {
        expect(resolveTimeZoneQuery(null)).toEqual({});
    });

    it('returns a canonical zone for a valid parameter', () => {
        expect(resolveTimeZoneQuery('europe/zurich')).toEqual({timeZone: 'Europe/Zurich'});
    });

    it.each(['', '   ', 'Not/AZone', '+01:00'])('rejects invalid parameter %p', raw => {
        expect(resolveTimeZoneQuery(raw)).toEqual({
            error: 'timeZone must be a valid IANA time zone (e.g. Europe/Zurich)'
        });
    });
});
