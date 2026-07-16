import {translateLanguage, parseExcludeLanguages} from '../../src/utils/translator';

describe('translateLanguage', () => {
    it('translates known aliases to the canonical language name', () => {
        expect(translateLanguage('js')).toBe('JavaScript');
        expect(translateLanguage('golang')).toBe('Go');
        expect(translateLanguage('html')).toBe('HTML');
    });

    it('capitalizes unknown languages', () => {
        expect(translateLanguage('java')).toBe('Java');
        expect(translateLanguage('HTML')).toBe('HTML');
    });
});

describe('parseExcludeLanguages', () => {
    it('lowercases languages regardless of the input casing (#281)', () => {
        expect(parseExcludeLanguages('HTML,CSS')).toEqual(['html', 'css']);
        expect(parseExcludeLanguages('html,css')).toEqual(['html', 'css']);
        expect(parseExcludeLanguages('Jupyter Notebook')).toEqual(['jupyter notebook']);
    });

    it('trims whitespace around entries', () => {
        expect(parseExcludeLanguages('HTML, CSS , Java')).toEqual(['html', 'css', 'java']);
    });

    it('resolves aliases through translateLanguage', () => {
        expect(parseExcludeLanguages('js,golang')).toEqual(['javascript', 'go']);
    });

    it('returns an empty list for empty input', () => {
        expect(parseExcludeLanguages('')).toEqual([]);
        expect(parseExcludeLanguages(' , ')).toEqual([]);
    });
});
