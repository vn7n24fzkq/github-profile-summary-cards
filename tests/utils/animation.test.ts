import {parseAnimation, parseDuration, applyAnimation, AnimationName} from '../../src/utils/animation';

describe('parseAnimation', () => {
    it.each(['fade', 'rise', 'draw', 'stagger', 'load'])('accepts the known preset "%s"', preset => {
        expect(parseAnimation(preset)).toBe(preset);
    });

    it('rejects unknown / empty values', () => {
        expect(parseAnimation('none')).toBeUndefined();
        expect(parseAnimation('')).toBeUndefined();
        expect(parseAnimation('spin')).toBeUndefined();
    });

    it('rejects non-string values (injection safety)', () => {
        expect(parseAnimation(undefined)).toBeUndefined();
        expect(parseAnimation(['fade'])).toBeUndefined();
        expect(parseAnimation('</style><script>alert(1)</script>')).toBeUndefined();
    });
});

describe('applyAnimation', () => {
    const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect/></svg>';

    it('returns the SVG unchanged when no preset is given', () => {
        expect(applyAnimation(SVG, undefined)).toBe(SVG);
    });

    it('injects a <style> block right after the opening <svg> tag', () => {
        const out = applyAnimation(SVG, 'fade');
        expect(out).toContain('<style>');
        expect(out).toMatch(/<svg\b[^>]*><style>/);
        // Original content is preserved.
        expect(out).toContain('<rect/>');
        expect(out).toContain('</svg>');
    });

    it('includes the preset rule and shared keyframes', () => {
        const out = applyAnimation(SVG, 'fade');
        expect(out).toContain('@keyframes gpsc-fade');
        expect(out).toContain('.gpsc-root{animation:gpsc-fade');
    });

    it('always emits a prefers-reduced-motion guard', () => {
        (['fade', 'rise', 'draw', 'stagger', 'load'] as AnimationName[]).forEach(preset => {
            expect(applyAnimation(SVG, preset)).toContain('prefers-reduced-motion:reduce');
        });
    });

    it('drives chart draw-on for the "draw" and "load" presets', () => {
        expect(applyAnimation(SVG, 'draw')).toContain('rect.bar{animation:gpsc-grow');
        expect(applyAnimation(SVG, 'load')).toContain('.arc{animation:gpsc-pop');
    });

    it('uses the preset default duration when none is supplied', () => {
        // "fade" default is 1.1s and drives the whole card in one shot.
        expect(applyAnimation(SVG, 'fade')).toContain('gpsc-fade 1.1s');
    });

    it('applies a valid duration override', () => {
        expect(applyAnimation(SVG, 'fade', '2.5')).toContain('gpsc-fade 2.5s');
    });

    it('clamps and ignores invalid duration overrides', () => {
        // Out-of-range clamps to the [0.2, 5] bounds.
        expect(applyAnimation(SVG, 'fade', '99')).toContain('gpsc-fade 5s');
        expect(applyAnimation(SVG, 'fade', '0.01')).toContain('gpsc-fade 0.2s');
        // Non-numeric / non-positive falls back to the preset default (1.1s).
        expect(applyAnimation(SVG, 'fade', 'abc')).toContain('gpsc-fade 1.1s');
        expect(applyAnimation(SVG, 'fade', '-3')).toContain('gpsc-fade 1.1s');
    });

    it('scales multi-step preset timing proportionally with duration', () => {
        // "draw" runs the bar grow for the full base duration; doubling it doubles the grow.
        expect(applyAnimation(SVG, 'draw', '2')).toContain('rect.bar{animation:gpsc-grow 2s');
    });
});

describe('parseDuration', () => {
    it('returns the fallback for missing / non-string / invalid values', () => {
        expect(parseDuration(undefined, 1.1)).toBe(1.1);
        expect(parseDuration(['2'], 1.1)).toBe(1.1);
        expect(parseDuration('abc', 1.1)).toBe(1.1);
        expect(parseDuration('0', 1.1)).toBe(1.1);
        expect(parseDuration('-2', 1.1)).toBe(1.1);
    });

    it('accepts and clamps in-range values', () => {
        expect(parseDuration('2.5', 1.1)).toBe(2.5);
        expect(parseDuration('99', 1.1)).toBe(5);
        expect(parseDuration('0.01', 1.1)).toBe(0.2);
    });
});
