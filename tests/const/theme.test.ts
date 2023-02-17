import {ThemeMap} from '../../src/const/theme';

describe('Validate all theme', () => {
    it('theme colors are match the color regex', () => {
        // We validate short hex color, hex color and RGBA hex
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/;
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
