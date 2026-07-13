import {getErrorMsgCard} from '../../api/utils/error-card';
import {resolveThemeName, FALLBACK_THEME_NAME, ThemeMap} from '../../src/const/theme';

describe('resolveThemeName', () => {
    it('returns the input when it is a known theme', () => {
        expect(resolveThemeName('default')).toBe('default');
    });

    it('falls back to the default theme for an unknown name', () => {
        expect(resolveThemeName('definitely-not-a-real-theme')).toBe(FALLBACK_THEME_NAME);
    });

    it('falls back for the empty string', () => {
        expect(resolveThemeName('')).toBe(FALLBACK_THEME_NAME);
    });

    it('the fallback theme exists in ThemeMap', () => {
        expect(ThemeMap.has(FALLBACK_THEME_NAME)).toBe(true);
    });
});

describe('error card', () => {
    // Extract the message body text elements (everything inside the inner <g> panel, excluding the card title).
    function extractMessageLines(svg: string): string[] {
        const innerGroup = svg.match(/<g[^>]*translate\(30,20\)[^>]*>([\s\S]*?)<\/g>/);
        if (!innerGroup) return [];
        const lines = innerGroup[1].match(/<text[^>]*>([^<]+)<\/text>/g) ?? [];
        return lines.map(t => t.replace(/<[^>]+>/g, ''));
    }

    it('should render a short message on a single line', () => {
        const svg = getErrorMsgCard('Boom', 'default');
        expect(svg).toContain('<svg');
        const lines = extractMessageLines(svg);
        expect(lines).toEqual(['Boom']);
    });

    it('should wrap a long message across multiple text elements at word boundaries', () => {
        const longMsg =
            'A very long error message that should be wrapped across multiple lines because it definitely exceeds the maximum line width of forty characters configured for the card.';
        const svg = getErrorMsgCard(longMsg, 'default');
        expect(svg).toContain('<svg');
        const lines = extractMessageLines(svg);
        expect(lines.length).toBeGreaterThan(2);
        // Re-joining the line contents should reconstruct the original message word-for-word
        const reconstructed = lines.join(' ').replace(/\s+/g, ' ').trim();
        expect(reconstructed).toBe(longMsg);
        // No line should exceed the wrap width
        for (const line of lines) {
            expect(line.length).toBeLessThanOrEqual(40);
        }
    });

    it('should split a single token that exceeds the wrap width', () => {
        const longToken = 'a'.repeat(95); // 95 > 2 * MAX_CHARS_PER_LINE (40)
        const msg = `prefix ${longToken} suffix`;
        const svg = getErrorMsgCard(msg, 'default');
        const lines = extractMessageLines(svg);
        // Every emitted line must respect the wrap width even when a single token is too long.
        for (const line of lines) {
            expect(line.length).toBeLessThanOrEqual(40);
        }
        // The full token characters survive, in order, when the lines are concatenated.
        const flattened = lines.join('').replace(/\s+/g, '');
        expect(flattened).toBe(`prefix${longToken}suffix`);
    });

    it('should not crash when given an unknown theme name', () => {
        // Regression: previously `ThemeMap.get('not-a-theme')!` returned undefined and the
        // subsequent `theme.title = 'red'` threw, leaking a 500 instead of an error card.
        expect(() => getErrorMsgCard('Boom', 'not-a-real-theme')).not.toThrow();
        const svg = getErrorMsgCard('Boom', 'not-a-real-theme');
        expect(svg).toContain('<svg');
        expect(extractMessageLines(svg)).toEqual(['Boom']);
    });

    it('should not mutate the shared ThemeMap entry when overriding the title', () => {
        // Regression: previously the function did `const theme = ThemeMap.get(...)!`
        // followed by `theme.title = 'red'`, which permanently turned the title
        // colour of that theme red for every subsequent render in the same process.
        const originalTitle = ThemeMap.get('default')!.title;
        getErrorMsgCard('Boom', 'default');
        expect(ThemeMap.get('default')!.title).toBe(originalTitle);
    });
});
