// Optional, opt-in card entrance animations. These are pure declarative CSS
// (@keyframes in an injected <style>) — no JS — because the cards are embedded in
// READMEs through GitHub's camo proxy, which strips <script> but renders CSS
// animations. The animation is applied by post-processing the finished SVG
// string (see api/utils/handle-card.ts) so no card generator needs to know about
// it. Elements are targeted via the `.gpsc-root` wrapper (src/templates/card.ts)
// and the existing `.bar` / `.arc` chart classes.

export type AnimationName = 'fade' | 'rise' | 'draw' | 'stagger' | 'load';

const ANIMATIONS: ReadonlySet<string> = new Set(['fade', 'rise', 'draw', 'stagger', 'load']);

// Whitelist the animation query parameter (enum). Unknown/absent values disable
// animation, so a bad value can never inject anything into the SVG.
export function parseAnimation(value: unknown): AnimationName | undefined {
    return typeof value === 'string' && ANIMATIONS.has(value) ? (value as AnimationName) : undefined;
}

// Shared keyframes used across presets.
const KEYFRAMES = `
@keyframes gpsc-fade{from{opacity:0}to{opacity:1}}
@keyframes gpsc-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes gpsc-slideup{from{transform:translateY(16px)}to{transform:translateY(0)}}
@keyframes gpsc-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes gpsc-pop{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:scale(1)}}`;

const PRESETS: Record<AnimationName, string> = {
    fade: `.gpsc-root{animation:gpsc-fade .9s ease both}`,
    rise: `.gpsc-root{animation:gpsc-rise .8s cubic-bezier(.2,.7,.3,1) both}`,
    draw:
        `.gpsc-root{animation:gpsc-fade .5s ease both}` +
        `rect.bar{animation:gpsc-grow .9s cubic-bezier(.2,.7,.3,1) both;transform-box:fill-box;transform-origin:center bottom}` +
        `.arc{animation:gpsc-pop .6s ease both;transform-box:fill-box;transform-origin:center}`,
    stagger:
        `.gpsc-root>rect{animation:gpsc-fade .5s ease both}` +
        `.gpsc-root>text{animation:gpsc-fade .6s ease both .12s}` +
        `.gpsc-root>g{animation:gpsc-fade .7s ease both .24s}`,
    // "load": a coordinated loading→loaded assembly — the card slides up while its
    // background, title and body fade in one after another, then the charts draw on.
    load:
        `.gpsc-root{animation:gpsc-slideup .7s cubic-bezier(.2,.7,.3,1) both}` +
        `.gpsc-root>rect{animation:gpsc-fade .5s ease both}` +
        `.gpsc-root>text{animation:gpsc-fade .6s ease both .16s}` +
        `.gpsc-root>g{animation:gpsc-fade .7s ease both .3s}` +
        `rect.bar{animation:gpsc-grow .8s cubic-bezier(.2,.7,.3,1) both .4s;transform-box:fill-box;transform-origin:center bottom}` +
        `.arc{animation:gpsc-pop .55s ease both .45s;transform-box:fill-box;transform-origin:center}`
};

// Respect users who prefer reduced motion — they get the final (un-animated) card.
const REDUCED_MOTION = `@media (prefers-reduced-motion:reduce){.gpsc-root,.gpsc-root *,rect.bar,.arc{animation:none!important}}`;

// Inject the animation CSS into an already-rendered card SVG string. Returns the
// SVG unchanged for an unknown/absent preset.
export function applyAnimation(svg: string, name: AnimationName | undefined): string {
    if (!name) return svg;
    const css = `${KEYFRAMES}${PRESETS[name]}${REDUCED_MOTION}`;
    // Insert a <style> block right after the opening <svg ...> tag (there is exactly
    // one root <svg> in a card).
    return svg.replace(/(<svg\b[^>]*>)/, `$1<style>${css}</style>`);
}
