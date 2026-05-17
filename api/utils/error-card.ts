import {Card} from '../../src/templates/card';
import {Theme, ThemeMap, resolveThemeName} from '../../src/const/theme';

const MAX_CHARS_PER_LINE = 40;
const LINE_HEIGHT = 18;

function wrapMessage(msg: string, maxChars: number): string[] {
    const words = msg.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
        // Pre-slice any token longer than maxChars (e.g. unbroken usernames in
        // GitHub error messages) so the panel never overflows. Whole-chunk
        // slices flush as their own lines; the trailing remainder falls back
        // to the normal whitespace-greedy logic below.
        let remaining = word;
        while (remaining.length > maxChars) {
            if (current.length > 0) {
                lines.push(current);
                current = '';
            }
            lines.push(remaining.slice(0, maxChars));
            remaining = remaining.slice(maxChars);
        }
        if (remaining.length === 0) continue;
        if (current.length === 0) {
            current = remaining;
        } else if (current.length + 1 + remaining.length <= maxChars) {
            current += ' ' + remaining;
        } else {
            lines.push(current);
            current = remaining;
        }
    }
    if (current.length > 0) {
        lines.push(current);
    }
    return lines;
}

export const getErrorMsgCard = function (msg: string, themeName: string) {
    // Defensive: an invalid theme name would otherwise blow up the error card itself.
    const baseTheme: Theme = ThemeMap.get(resolveThemeName(themeName))!;
    // Clone before overriding the title — `ThemeMap.get` returns the shared instance,
    // so mutating it would leak the red error-title colour into every subsequent
    // render of that theme for the lifetime of the process.
    const renderTheme: Theme = {...baseTheme, title: 'red'};

    const card = new Card('ERROR!!!', 340, 200, renderTheme);
    const svg = card.getSVG();
    const panel = svg.append('g').attr('transform', `translate(30,20)`);
    const lines = wrapMessage(msg, MAX_CHARS_PER_LINE);
    lines.forEach((line, i) => {
        panel
            .append('text')
            .attr('y', `${card.yPadding + i * LINE_HEIGHT}`)
            .style('font-size', `14px`)
            .style('fill', 'red')
            .text(line);
    });

    return card.toString();
};
