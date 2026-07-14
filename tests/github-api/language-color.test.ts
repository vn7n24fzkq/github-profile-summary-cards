import {RepoLanguages} from '../../src/github-api/repos-per-language';
import {CommitLanguages} from '../../src/github-api/commits-per-language';

describe('language color null handling', () => {
    it('RepoLanguages falls back to the default color when color is null', () => {
        const r = new RepoLanguages();
        r.addLanguage('X', null);
        expect(r.getLanguageMap().get('X')!.color).toBe('#586e75');
    });

    it('CommitLanguages falls back to the default color when color is null', () => {
        const c = new CommitLanguages();
        c.addLanguageCount('Y', null, 3);
        expect(c.getLanguageMap().get('Y')!.color).toBe('#586e75');
    });
});
