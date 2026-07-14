import {resolveThemeNames, writeThemedCards} from '../../src/utils/card-generation';
import {ThemeMap} from '../../src/const/theme';
import {writeSVG} from '../../src/utils/file-writer';

jest.mock('../../src/utils/file-writer');
const mockWriteSVG = writeSVG as jest.Mock;

describe('resolveThemeNames', () => {
    it('returns every theme when none is pinned', () => {
        expect(resolveThemeNames()).toHaveLength(ThemeMap.size);
        expect(resolveThemeNames('')).toHaveLength(ThemeMap.size);
    });

    it('returns just the pinned theme when it exists', () => {
        expect(resolveThemeNames('github_dark')).toEqual(['github_dark']);
    });

    it('throws on an unknown theme', () => {
        expect(() => resolveThemeNames('not-a-theme')).toThrow(/does not exist/);
    });
});

describe('writeThemedCards', () => {
    beforeEach(() => jest.resetAllMocks());

    const build = (themeName: string) => `<svg data-theme="${themeName}"><g class="gpsc-root"></g></svg>`;

    it('writes one card per theme with no animation by default', () => {
        writeThemedCards('3-stats', build);
        expect(mockWriteSVG).toHaveBeenCalledTimes(ThemeMap.size);
        // No animation injected.
        for (const call of mockWriteSVG.mock.calls) {
            expect(call[2]).not.toContain('@keyframes');
        }
    });

    it('writes only the pinned theme when THEME is set', () => {
        writeThemedCards('3-stats', build, {theme: 'github_dark'});
        expect(mockWriteSVG).toHaveBeenCalledTimes(1);
        expect(mockWriteSVG).toHaveBeenCalledWith('github_dark', '3-stats', expect.stringContaining('data-theme'));
    });

    it('bakes the animation into every generated theme when ANIMATION is set', () => {
        writeThemedCards('3-stats', build, {animation: 'load'});
        expect(mockWriteSVG).toHaveBeenCalledTimes(ThemeMap.size);
        for (const call of mockWriteSVG.mock.calls) {
            expect(call[2]).toContain('.gpsc-item{animation:gpsc-fade');
        }
    });

    it('supports pinning a theme AND an animation together', () => {
        writeThemedCards('3-stats', build, {theme: 'dracula', animation: 'fade'});
        expect(mockWriteSVG).toHaveBeenCalledTimes(1);
        const [themeName, file, svg] = mockWriteSVG.mock.calls[0];
        expect(themeName).toBe('dracula');
        expect(file).toBe('3-stats');
        expect(svg).toContain('@keyframes gpsc-fade');
    });
});
