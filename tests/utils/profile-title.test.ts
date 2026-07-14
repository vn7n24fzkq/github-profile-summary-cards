import {buildProfileTitle, PROFILE_TITLE_MAX} from '../../src/utils/profile-title';

describe('buildProfileTitle', () => {
    it('shows "login (name)" in full when it fits', () => {
        expect(buildProfileTitle('octocat', 'Mona')).toBe('octocat (Mona)');
    });

    it('shows just the login when there is no name', () => {
        expect(buildProfileTitle('octocat', null)).toBe('octocat');
        expect(buildProfileTitle('octocat', '')).toBe('octocat');
    });

    it('elides a long name (never the login) to a single line within budget', () => {
        const out = buildProfileTitle('octocat', 'Mona Lisa Octocat the Third');
        expect(out.startsWith('octocat (')).toBe(true);
        expect(out.endsWith('…)')).toBe(true);
        expect(out).not.toContain('\n');
        expect(out.length).toBeLessThanOrEqual(PROFILE_TITLE_MAX);
    });

    it('drops the name and shows the login when the login alone fills the budget', () => {
        const longLogin = 'a-very-long-github-login';
        expect(buildProfileTitle(longLogin, 'Some Name')).toBe(longLogin.slice(0, PROFILE_TITLE_MAX - 1) + '…');
    });

    it('lets a displayName override the whole title', () => {
        expect(buildProfileTitle('octocat', 'Mona', 'Casper')).toBe('Casper');
    });

    it('clamps and single-lines an override, ignoring blank ones', () => {
        expect(buildProfileTitle('octocat', 'Mona', '   ')).toBe('octocat (Mona)');
        expect(buildProfileTitle('octocat', 'Mona', 'Line1\nLine2')).toBe('Line1 Line2');
        const long = buildProfileTitle('octocat', 'Mona', 'x'.repeat(50));
        expect(long.length).toBeLessThanOrEqual(PROFILE_TITLE_MAX);
        expect(long.endsWith('…')).toBe(true);
    });
});
