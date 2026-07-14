// Builds the single-line title shown on the profile-details card.
//
// The title area is ~265px wide before the chart begins; at the 22px title font
// that is roughly 22 characters. Beyond that the title would overrun the chart,
// so instead of wrapping to a second line (which changes the card height) we
// elide to fit. Callers may also override the displayed name entirely.

// Single-line character budget for the title.
export const PROFILE_TITLE_MAX = 22;

// Collapse whitespace/newlines to a single space so a user-supplied name can
// never force a line break or smuggle control characters into the SVG text.
function normalize(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

// Truncate to `max` characters with a trailing ellipsis when it doesn't fit.
function clamp(text: string, max: number): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1).trimEnd()}…`;
}

// Resolve the title:
// - a non-empty `displayName` overrides the whole title (the user decides what to
//   show), clamped to the budget;
// - otherwise it's `login (name)` with the name elided so the login is always
//   shown in full and the title never overruns the chart;
// - with no name at all, just the login.
export function buildProfileTitle(login: string, name: string | null, displayName?: string | null): string {
    if (displayName && normalize(displayName)) {
        return clamp(normalize(displayName), PROFILE_TITLE_MAX);
    }
    if (!name) {
        return clamp(login, PROFILE_TITLE_MAX);
    }
    const full = `${login} (${name})`;
    if (full.length <= PROFILE_TITLE_MAX) {
        return full;
    }
    // Chars used by everything except the name: `login` + " (" + ")".
    const nameBudget = PROFILE_TITLE_MAX - (login.length + 3);
    if (nameBudget < 2) {
        // The login alone already fills (or exceeds) the budget — drop the name.
        return clamp(login, PROFILE_TITLE_MAX);
    }
    return `${login} (${clamp(normalize(name), nameBudget)})`;
}
