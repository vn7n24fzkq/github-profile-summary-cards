import {parseAnimation, parseDuration, applyAnimation, AnimationName} from '../../src/utils/animation';

describe('parseAnimation', () => {
    it.each(['fade', 'rise', 'draw', 'stagger', 'load', 'sequence', 'tint', 'rgb', 'rgb-soft'])(
        'accepts the known preset "%s"',
        preset => {
            expect(parseAnimation(preset)).toBe(preset);
        }
    );

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
        expect(out).toContain('.gpsc-item');
        expect(out).toContain('gpsc-fade');
    });

    // The entrance presets (everything except the continuous "rgb" loop) must leave
    // the card frame/background untouched so it shows immediately.
    it('entrance presets never animate the card frame (background shows immediately)', () => {
        (['fade', 'rise', 'draw', 'stagger', 'load', 'sequence', 'tint'] as AnimationName[]).forEach(preset => {
            const out = applyAnimation(SVG, preset);
            expect(out).not.toMatch(/\.gpsc-root\s*\{/);
            expect(out).not.toContain('.gpsc-root>rect');
        });
    });

    it('rgb is a continuous whole-card colour loop', () => {
        const out = applyAnimation(SVG, 'rgb');
        expect(out).toContain('@keyframes gpsc-rgb');
        expect(out).toContain('.gpsc-root{animation:gpsc-rgb');
        expect(out).toContain('infinite');
    });

    it('rgb-soft cycles the content but leaves the card frame fixed', () => {
        const out = applyAnimation(SVG, 'rgb-soft');
        expect(out).toContain('gpsc-rgb');
        expect(out).toContain('infinite');
        // Content classes cycle; the whole root does not.
        expect(out).toContain('.gpsc-item,.gpsc-chart,.arc,rect.bar{animation:gpsc-rgb');
        expect(out).not.toMatch(/\.gpsc-root\s*\{/);
    });

    it('always emits a prefers-reduced-motion guard', () => {
        (['fade', 'rise', 'draw', 'stagger', 'load', 'sequence', 'tint', 'rgb', 'rgb-soft'] as AnimationName[]).forEach(
            preset => {
                expect(applyAnimation(SVG, preset)).toContain('prefers-reduced-motion:reduce');
            }
        );
    });

    it('drives chart draw-on for the "draw" and "load" presets', () => {
        expect(applyAnimation(SVG, 'draw')).toContain('rect.bar{animation:gpsc-grow');
        expect(applyAnimation(SVG, 'load')).toContain('.arc{animation:gpsc-pop');
    });

    it('staggers chart elements by --gpsc-i and wipes the area for "sequence"', () => {
        const out = applyAnimation(SVG, 'sequence');
        // Per-item stagger references the index custom property.
        expect(out).toContain('calc(var(--gpsc-i,0) *');
        expect(out).toContain('.arc{animation:gpsc-pop');
        expect(out).toContain('rect.bar{animation:gpsc-grow');
        // Area reveal wipes the clip rect in from the left.
        expect(out).toContain('.gpsc-reveal{animation:gpsc-wipe');
        expect(out).toContain('@keyframes gpsc-wipe');
    });

    it('sweeps colours for the "tint" preset', () => {
        const out = applyAnimation(SVG, 'tint');
        expect(out).toContain('@keyframes gpsc-tint');
        expect(out).toContain('gpsc-tint');
    });

    it('scales sequence stagger step with duration', () => {
        // The per-index arc delay unit is d*0.12; at d=2 that is 0.24s.
        expect(applyAnimation(SVG, 'sequence', '2')).toContain('calc(var(--gpsc-i,0) * 0.24s)');
    });

    it('uses the preset default duration when none is supplied', () => {
        // "fade" default is 3s.
        expect(applyAnimation(SVG, 'fade')).toContain('gpsc-fade 3s');
    });

    it('applies a valid duration override', () => {
        expect(applyAnimation(SVG, 'fade', '2.5')).toContain('gpsc-fade 2.5s');
    });

    it('clamps and ignores invalid duration overrides', () => {
        // Out-of-range clamps to the [0.2, 10] bounds.
        expect(applyAnimation(SVG, 'fade', '99')).toContain('gpsc-fade 10s');
        expect(applyAnimation(SVG, 'fade', '0.01')).toContain('gpsc-fade 0.2s');
        // Non-numeric / non-positive falls back to the preset default (3s).
        expect(applyAnimation(SVG, 'fade', 'abc')).toContain('gpsc-fade 3s');
        expect(applyAnimation(SVG, 'fade', '-3')).toContain('gpsc-fade 3s');
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
        expect(parseDuration('99', 1.1)).toBe(10);
        expect(parseDuration('0.01', 1.1)).toBe(0.2);
    });
});
