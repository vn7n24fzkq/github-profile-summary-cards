import {ThemeMap, sanitizeHexColor, parseThemeColorOverride, resolveTheme} from '../../src/const/theme';

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

describe('sanitizeHexColor', () => {
    it('accepts 3/4/6/8-digit hex and prefixes #', () => {
        expect(sanitizeHexColor('fff')).toBe('#fff');
        expect(sanitizeHexColor('ff00')).toBe('#ff00');
        expect(sanitizeHexColor('00aeff')).toBe('#00aeff');
        expect(sanitizeHexColor('ff4321a0')).toBe('#ff4321a0');
    });
    it('rejects invalid or unsafe values', () => {
        expect(sanitizeHexColor('ff')).toBeUndefined(); // too short
        expect(sanitizeHexColor('fffff')).toBeUndefined(); // 5 digits
        expect(sanitizeHexColor('#fff')).toBeUndefined(); // already prefixed
        expect(sanitizeHexColor('red')).toBeUndefined();
        expect(sanitizeHexColor('12345g')).toBeUndefined();
        expect(sanitizeHexColor('"/><script>')).toBeUndefined(); // no injection
        expect(sanitizeHexColor(undefined)).toBeUndefined();
        expect(sanitizeHexColor(123)).toBeUndefined();
    });
});

describe('parseThemeColorOverride', () => {
    it('maps query params to override fields', () => {
        const o = parseThemeColorOverride({
            title_color: 'ff0',
            text_color: '0ff',
            bg_color: '665544',
            border_color: 'f0f',
            icon_color: '1234ff',
            chart_color: 'ff4321a0'
        });
        expect(o).toEqual({
            title: '#ff0',
            text: '#0ff',
            background: '#665544',
            border: '#f0f',
            icon: '#1234ff',
            chart: '#ff4321a0'
        });
    });
    it('drops invalid values but keeps valid ones', () => {
        const o = parseThemeColorOverride({title_color: 'nope', bg_color: '00000000'});
        expect(o.title).toBeUndefined();
        expect(o.background).toBe('#00000000');
    });
});

describe('resolveTheme', () => {
    it('applies overrides on top of the base theme', () => {
        const base = ThemeMap.get('dark')!;
        const t = resolveTheme('dark', {background: '#123456', border: '#abcdef'});
        expect(t.background).toBe('#123456');
        expect(t.stroke).toBe('#abcdef'); // border maps to stroke
        expect(t.title).toBe(base.title); // untouched fields keep base value
    });
    it('does not mutate the shared ThemeMap entry', () => {
        const before = ThemeMap.get('dark')!.background;
        resolveTheme('dark', {background: '#000000'});
        expect(ThemeMap.get('dark')!.background).toBe(before);
    });
    it('falls back to the default theme for an unknown name', () => {
        const def = ThemeMap.get('default')!;
        expect(resolveTheme('does-not-exist').title).toBe(def.title);
    });
    it('returns the base colors when no override is given', () => {
        const base = ThemeMap.get('dark')!;
        const t = resolveTheme('dark');
        expect(t.title).toBe(base.title);
        expect(t.background).toBe(base.background);
    });
    it('preserves categorical colors from the base theme', () => {
        const base = ThemeMap.get('cwn_dark')!;
        const resolved = resolveTheme('cwn_dark');

        expect(resolved.categoricalColors).toEqual(base.categoricalColors);
    });
});
