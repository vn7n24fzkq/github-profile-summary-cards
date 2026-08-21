import {JSDOM} from 'jsdom';
import {Theme} from '../../src/const/theme';
import {createDonutChartCard} from '../../src/templates/donut-chart-card';

const data = [
    {name: 'A', value: 5, color: '#ff0000'},
    {name: 'B', value: 4, color: '#00ff00'},
    {name: 'C', value: 3, color: '#0000ff'}
];

function getLegendColors(svg: string): Array<string | null> {
    const document = new JSDOM(svg, {contentType: 'image/svg+xml'}).window.document;

    return Array.from(document.querySelectorAll('rect.gpsc-item')).map(element => element.getAttribute('fill'));
}

function getArcColors(svg: string): string[] {
    const document = new JSDOM(svg, {contentType: 'image/svg+xml'}).window.document;

    return Array.from(document.querySelectorAll<SVGElement>('g.arc path')).map(element => element.style.fill);
}

describe('donut chart categorical colors', () => {
    it('uses source colors when the theme has no categorical colors', () => {
        const theme = new Theme('#ffffff', '#ffffff', '#000000', '#000000', 0, '#ffffff', '#ffffff');
        const svg = createDonutChartCard('Test', data, theme);

        expect(getLegendColors(svg)).toEqual(['#ff0000', '#00ff00', '#0000ff']);
        expect(getArcColors(svg)).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    });

    it('uses theme categorical colors when provided', () => {
        const theme = new Theme('#ffffff', '#ffffff', '#000000', '#000000', 0, '#ffffff', '#ffffff', [
            '#ffffff',
            '#b3b3b3',
            '#666666'
        ]);
        const svg = createDonutChartCard('Test', data, theme);

        expect(getLegendColors(svg)).toEqual(['#ffffff', '#b3b3b3', '#666666']);
        expect(getArcColors(svg)).toEqual(['#ffffff', '#b3b3b3', '#666666']);
    });
});
