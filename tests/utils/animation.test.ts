import {parseAnimation, applyAnimation, AnimationName} from '../../src/utils/animation';

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
});
