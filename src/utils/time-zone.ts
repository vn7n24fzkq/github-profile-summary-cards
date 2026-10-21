// IANA time-zone helpers built on Node's Intl implementation. No third-party
// time-zone database is needed: giving Intl the commit's own Date and the zone
// name applies the DST rule in effect on that date.
//
// normalizeTimeZone returns the canonical zone name (e.g. "europe/zurich" ->
// "Europe/Zurich"), or null when the identifier is not valid IANA data. Callers
// that expose the zone to users (the API and the Action) validate with this
// before rendering; the card layer can then assume a valid zone.
export function normalizeTimeZone(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
        return new Intl.DateTimeFormat('en-US', {timeZone: trimmed}).resolvedOptions().timeZone;
    } catch {
        return null;
    }
}

// Build one formatter per card calculation and reuse it for every commit.
// hour12: false keeps the output in 00-23 instead of AM/PM; it also avoids
// relying on the ES2020 hourCycle typings, which this project's es6 target
// does not load.
export function createTimeZoneHourFormatter(timeZone: string): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        hour12: false
    });
}
