// Generates the static preview cards used by the README from local mock data —
// no GitHub token, no API calls, so the README never hits the hosted API's rate
// limit. Animations are baked into the committed SVGs (they still play in the
// README via GitHub's image proxy). Re-run with `npm run generate:preview` and
// commit the results whenever the mock data, themes, or animations change.
import {mkdirSync, writeFileSync} from 'fs';
import {renderMockCard} from './mock-cards';
import {applyAnimation, AnimationName} from '../src/utils/animation';

const ROOT = 'docs/preview';

function write(relPath: string, svg: string): void {
    const full = `${ROOT}/${relPath}`;
    mkdirSync(full.slice(0, full.lastIndexOf('/')), {recursive: true});
    writeFileSync(full, svg);
}

function render(card: string, theme: string, animation?: AnimationName): string {
    return applyAnimation(renderMockCard(card, theme, 8), animation);
}

// 1. Theme showcase — profile-details per theme (the ones the README table lists),
// no animation so the grid stays calm and it's about the colours.
const THEME_TABLE = [
    'default',
    '2077',
    'dracula',
    'github',
    'github_dark',
    'gruvbox',
    'monokai',
    'nord_bright',
    'nord_dark',
    'radical',
    'solarized',
    'solarized_dark',
    'tokyonight',
    'vue',
    'zenburn',
    'transparent'
];
for (const theme of THEME_TABLE) {
    write(`themes/${theme}.svg`, render('profile-details', theme));
}

// 2. Hero — all five cards in one theme with the `load` entrance animation.
const HERO: [string, string][] = [
    ['profile-details', '0-profile-details'],
    ['repos-per-language', '1-repos-per-language'],
    ['most-commit-language', '2-most-commit-language'],
    ['stats', '3-stats'],
    ['productive-time', '4-productive-time']
];
for (const [card, file] of HERO) {
    write(`hero/${file}.svg`, render(card, 'solarized', 'load'));
}

// 3. Animation showcase — one representative card per preset (baked-in animation).
const SHOWCASE: [AnimationName, string][] = [
    ['fade', 'stats'],
    ['rise', 'stats'],
    ['draw', 'productive-time'],
    ['stagger', 'profile-details'],
    ['load', 'profile-details'],
    ['sequence', 'repos-per-language'],
    ['tint', 'stats'],
    ['rgb', 'stats'],
    ['rgb-soft', 'profile-details']
];
for (const [animation, card] of SHOWCASE) {
    write(`animations/${animation}.svg`, render(card, 'github_dark', animation));
}

// 4. One plain card per endpoint for the "How to use (API)" doc section, so even
// those examples don't hit the live API.
const API_CARDS = ['profile-details', 'repos-per-language', 'most-commit-language', 'stats', 'productive-time'];
for (const card of API_CARDS) {
    write(`api/${card}.svg`, render(card, 'nord_bright'));
}

console.info(
    `Generated preview assets under ${ROOT}/ (${THEME_TABLE.length} themes, ${HERO.length} hero, ${SHOWCASE.length} animations).`
);
