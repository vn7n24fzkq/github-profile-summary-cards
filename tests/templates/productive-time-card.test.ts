import {createProductiveCard} from '../../src/templates/productive-time-card';
import {ThemeMap} from '../../src/const/theme';

const chartData = new Array(24).fill(0);
const theme = ThemeMap.get('default')!;

describe('productive time card template', () => {
    it('keeps the legacy UTC offset title when no time zone is supplied', () => {
        const svg = createProductiveCard(chartData, theme, 8);
        expect(svg).toContain('Commits (UTC +8.00)');
    });

    it('shows the time-zone name instead of the UTC offset in time-zone mode', () => {
        const svg = createProductiveCard(chartData, theme, 8, 'Europe/Zurich');
        expect(svg).toContain('Commits (Europe/Zurich)');
        expect(svg).not.toContain('UTC +8.00');
    });
});
