import {createStatsCard} from '../../src/templates/stats-card';
import {Icon} from '../../src/const/icon';
import {ThemeMap} from '../../src/const/theme';

const statsData = [{index: 0, icon: Icon.STAR, name: 'Total Stars:', value: '42'}];
const theme = ThemeMap.get('default')!;

describe('stats card template', () => {
    it('renders the GitHub logo by default', () => {
        const svg = createStatsCard('Stats', statsData, theme);
        expect(svg).toContain(Icon.GITHUB);
    });

    it('omits the GitHub logo when hideLogo is set', () => {
        const svg = createStatsCard('Stats', statsData, theme, true);
        expect(svg).not.toContain(Icon.GITHUB);
        // The rest of the card still renders.
        expect(svg).toContain('Total Stars:');
    });
});
