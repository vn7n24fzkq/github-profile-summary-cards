// IANA time-zone helpers built on Node's Intl implementation. No third-party
// time-zone database is needed: giving Intl the commit's own Date and the zone
// name applies the DST rule in effect on that date.
//
// Callers that expose the zone to users (the API and the Action) validate with
// this before rendering; the card layer can then assume a valid zone.
/**
 * Canonicalizes an IANA time-zone identifier.
 * @param {string} raw - User-supplied time-zone identifier.
 * @return {string | null} Canonical zone, or null when blank, invalid, or numeric.
 */
export function normalizeTimeZone(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // Intl accepts offsets such as +01:00, but those are fixed offsets without
    // DST rules, not IANA zone names.
    if (trimmed.startsWith('+') || trimmed.startsWith('-')) return null;
    try {
        return new Intl.DateTimeFormat('en-US', {timeZone: trimmed}).resolvedOptions().timeZone;
    } catch {
        return null;
    }
}

/**
 * Builds an hour formatter for one card calculation, applying DST per date.
 * @param {string} timeZone - Canonical IANA time zone.
 * @return {Intl.DateTimeFormat} Hour-only formatter in the 00-23 range.
 */
export function createTimeZoneHourFormatter(timeZone: string): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        hour12: false
    });
}
