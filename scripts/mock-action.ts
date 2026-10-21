// Token-free local exercise of the GitHub Action's OUTPUT pipeline.
//
// It runs the exact writeThemedCards() the Action uses — theme filtering,
// animation injection, duration, name override, and file writing (+ the preview
// markdown) — but feeds it the local mock fixtures instead of GitHub API data.
// So you can eyeball the generated profile-summary-card-output/ folder (open the
// SVGs / README.md) without a token.
//
// Controls mirror the Action inputs, passed as env vars:
//   THEME=github_dark ANIMATION=sequence DURATION=4 NAME="Casper" UTC_OFFSET=8 npm run test:action
//   TIME_ZONE=Europe/Zurich npm run test:action   # overrides UTC_OFFSET
//
// Leave THEME empty to generate every theme (like the Action's default).
import {writeThemedCards, resolveThemeNames, CardGenerationOptions} from '../src/utils/card-generation';
import {parseAnimation} from '../src/utils/animation';
import {generatePreviewMarkdown, OUTPUT_PATH} from '../src/utils/file-writer';
import {normalizeTimeZone} from '../src/utils/time-zone';
import {renderMockCard, MOCK_CARDS} from './mock-cards';

const themeInput = (process.env.THEME ?? '').trim() || undefined;
const animationInput = (process.env.ANIMATION ?? '').trim();
const animation = parseAnimation(animationInput);
if (animationInput && !animation) {
    console.warn(`ANIMATION "${animationInput}" is not a supported value; generating without animation.`);
}
const duration = (process.env.DURATION ?? '').trim() || undefined;
const displayName = (process.env.NAME ?? '').trim() || undefined;
const utcOffset = Number(process.env.UTC_OFFSET ?? '0') || 0;
const timeZoneInput = (process.env.TIME_ZONE ?? '').trim();
const timeZone = timeZoneInput ? normalizeTimeZone(timeZoneInput) ?? undefined : undefined;
if (timeZoneInput && !timeZone) {
    console.error(`TIME_ZONE "${timeZoneInput}" is not a valid IANA time zone (e.g. Europe/Zurich).`);
    process.exit(1);
}

const options: CardGenerationOptions = {theme: themeInput, animation, duration, displayName};

// Same output filenames (and sort-prefixes) the real card generators use.
const FILE_NAMES: Record<string, string> = {
    'profile-details': '0-profile-details',
    'repos-per-language': '1-repos-per-language',
    'most-commit-language': '2-most-commit-language',
    stats: '3-stats',
    'productive-time': '4-productive-time'
};

// resolveThemeNames throws on an unknown THEME (mirrors the Action's fail-fast).
const themes = resolveThemeNames(themeInput);
console.info(
    `Mock Action: theme=${themeInput ?? 'all'} animation=${animation ?? 'none'} ` +
        `duration=${duration ?? 'default'} name=${displayName ?? 'default'} ` +
        `timeZone=${timeZone ?? '(UTC offset)'}`
);
console.info(`Generating ${themes.length} theme(s): ${themes.join(', ')}`);

for (const card of MOCK_CARDS) {
    writeThemedCards(
        FILE_NAMES[card],
        themeName => renderMockCard(card, themeName, utcOffset, displayName, timeZone),
        options
    );
}
generatePreviewMarkdown(false, 'User');

console.info(`Done. Open ${OUTPUT_PATH}README.md (or a theme folder) to inspect the generated cards.`);
