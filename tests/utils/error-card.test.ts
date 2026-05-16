import {getErrorMsgCard} from '../../api/utils/error-card';

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
});
