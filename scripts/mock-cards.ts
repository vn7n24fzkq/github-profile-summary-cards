// Dev-only fixtures for local preview without a GitHub token.
//
// These call the SAME pure SVG template builders (src/templates/*) the real
// handlers use — only the data is faked — so the local preview matches
// production layout and exercises the real animation injection. Nothing here is
// imported by the Action or the Vercel handlers.
import {resolveTheme} from '../src/const/theme';
import {Icon} from '../src/const/icon';
import {createStatsCard} from '../src/templates/stats-card';
import {createDetailCard} from '../src/templates/profile-details-card';
import {createDonutChartCard} from '../src/templates/donut-chart-card';
import {createProductiveCard} from '../src/templates/productive-time-card';
import {buildProfileTitle} from '../src/utils/profile-title';

export const MOCK_CARDS = ['profile-details', 'repos-per-language', 'most-commit-language', 'stats', 'productive-time'];

// A believable language breakdown for the two donut cards. The real cards cap at
// the top 5 languages (see *-language-card.ts), so the fixture has exactly 5.
const LANGUAGES = [
    {name: 'TypeScript', value: 4200, color: '#3178c6'},
    {name: 'JavaScript', value: 2600, color: '#f1e05a'},
    {name: 'Go', value: 1500, color: '#00add8'},
    {name: 'Python', value: 1100, color: '#3572a5'},
    {name: 'Rust', value: 700, color: '#dea584'}
];

// Twelve months of contribution counts for the profile-details area chart.
// A fixed wave (no randomness) keeps the preview stable across reloads.
const contributions = Array.from({length: 12}, (_, i) => ({
    contributionCount: Math.round(60 + 40 * Math.sin(i / 1.7)),
    date: new Date(2025, i, 15)
}));

// A 24-bucket commit-by-hour histogram (local "productive time"), peaking in the
// afternoon/evening the way a real developer's usually does.
const productiveByHour = Array.from({length: 24}, (_, h) => Math.round(30 * Math.max(0, Math.sin((h - 6) / 3.8)) + 2));

const statsData = [
    {index: 0, icon: Icon.STAR, name: 'Total Stars:', value: '1.2k'},
    {index: 1, icon: Icon.COMMIT, name: '2025 Commits:', value: '3.4k'},
    {index: 2, icon: Icon.PULL_REQUEST, name: 'Total PRs:', value: '287'},
    {index: 3, icon: Icon.ISSUE, name: 'Total Issues:', value: '143'},
    {index: 4, icon: Icon.REPOS, name: 'Contributed to:', value: '56'}
];

const profileDetails = [
    {index: 0, icon: Icon.REPOS, name: 'Public repos', value: '42 Public Repos'},
    {index: 1, icon: Icon.EMAIL, name: 'Email', value: 'octocat@example.com'},
    {index: 2, icon: Icon.LOCATION, name: 'Location', value: 'Internet'},
    {index: 3, icon: Icon.LINK, name: 'Website', value: 'example.com'}
];

// Render one mock card to an SVG string. Throws on an unknown card name so the
// dev server can surface a clear 404. `displayName` previews the title override.
export function renderMockCard(card: string, themeName: string, utcOffset = 0, displayName?: string): string {
    const theme = resolveTheme(themeName);
    switch (card) {
        case 'profile-details':
            // Uses the real title builder: default is the elided "login (name)"; a
            // displayName overrides the whole title (both single-line, budget-clamped).
            return createDetailCard(
                buildProfileTitle('octocat', 'Mona Lisa', displayName),
                profileDetails,
                contributions,
                theme
            );
        case 'repos-per-language':
            return createDonutChartCard('Repos Per Language', LANGUAGES, theme);
        case 'most-commit-language':
            return createDonutChartCard('Most Commit Language', LANGUAGES, theme);
        case 'stats':
            return createStatsCard('Stats', statsData, theme);
        case 'productive-time':
            return createProductiveCard(productiveByHour, theme, utcOffset);
        default:
            throw new Error(`Unknown mock card: ${card}`);
    }
}
