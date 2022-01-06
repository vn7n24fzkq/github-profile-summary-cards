import {ThemeMap} from '../../src/const/theme';

describe('Validate all theme', () => {
    it('theme colors are match the color regex', () => {
        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        for (const theme of ThemeMap.values()) {
            expect(theme.title).toMatch(colorRegex);
            expect(theme.text).toMatch(colorRegex);
            expect(theme.background).toMatch(colorRegex);
            expect(theme.stroke).toMatch(colorRegex);
            expect(theme.icon).toMatch(colorRegex);
            expect(theme.chart).toMatch(colorRegex);
        }
    });
});
