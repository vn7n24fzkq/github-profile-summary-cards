import {translateLanguage, parseExcludeLanguages} from '../../src/utils/translator';

describe('translateLanguage', () => {
    it('translates known aliases to the canonical language name', () => {
        expect(translateLanguage('js')).toBe('JavaScript');
        expect(translateLanguage('golang')).toBe('Go');
        expect(translateLanguage('html')).toBe('HTML');
    });

    it('translates aliases regardless of input casing', () => {
        expect(translateLanguage('JS')).toBe('JavaScript');
        expect(translateLanguage('GoLang')).toBe('Go');
        expect(translateLanguage('CABAL')).toBe('Cabal Config');
        expect(translateLanguage('AUTOIT3')).toBe('AutoIt');
    });

    it('does not treat Object.prototype properties as aliases', () => {
        expect(translateLanguage('toString')).toBe('ToString');
        expect(translateLanguage('constructor')).toBe('Constructor');
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

    it('resolves aliases regardless of input casing', () => {
        expect(parseExcludeLanguages('JS,GOLANG,CABAL,AUTOIT3')).toEqual([
            'javascript',
            'go',
            'cabal config',
            'autoit'
        ]);
        expect(parseExcludeLanguages('Js,GoLang,Cabal,AutoIt3')).toEqual([
            'javascript',
            'go',
            'cabal config',
            'autoit'
        ]);
    });

    it('handles Object.prototype property names as normal languages', () => {
        expect(parseExcludeLanguages('toString,constructor')).toEqual(['tostring', 'constructor']);
    });

    it('returns an empty list for empty input', () => {
        expect(parseExcludeLanguages('')).toEqual([]);
        expect(parseExcludeLanguages(' , ')).toEqual([]);
    });
});
