import {normalizeTimeZone} from '../src/utils/time-zone';

/**
 * Resolves the mock dev server's optional timeZone query parameter.
 * @param {string | null} raw - Raw query value, or null when omitted.
 * @return {Object} Result with either a canonical timeZone or an error.
 */
export function resolveTimeZoneQuery(raw: string | null): {timeZone?: string; error?: string} {
    if (raw === null) return {};
    const timeZone = normalizeTimeZone(raw);
    if (!timeZone) {
        return {error: 'timeZone must be a valid IANA time zone (e.g. Europe/Zurich)'};
    }
    return {timeZone};
}
