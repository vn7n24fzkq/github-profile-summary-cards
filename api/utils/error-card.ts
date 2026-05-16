import {Card} from '../../src/templates/card';
import {Theme, ThemeMap} from '../../src/const/theme';

const MAX_CHARS_PER_LINE = 40;
const LINE_HEIGHT = 18;

function wrapMessage(msg: string, maxChars: number): string[] {
    const words = msg.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
        if (current.length === 0) {
            current = word;
        } else if (current.length + 1 + word.length <= maxChars) {
            current += ' ' + word;
        } else {
            lines.push(current);
            current = word;
        }
    }
    if (current.length > 0) {
        lines.push(current);
    }
    return lines;
}

export const getErrorMsgCard = function (msg: string, themeName: string) {
    const theme: Theme = ThemeMap.get(themeName)!;
    theme.title = 'red';

    const card = new Card('ERROR!!!', 340, 200, theme);
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
