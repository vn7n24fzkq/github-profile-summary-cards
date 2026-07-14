// Optional, opt-in card entrance animations. These are pure declarative CSS
// (@keyframes in an injected <style>) — no JS — because the cards are embedded in
// READMEs through GitHub's camo proxy, which strips <script> but renders CSS
// animations. The animation is applied by post-processing the finished SVG
// string (see api/utils/handle-card.ts) so no card generator needs to know about
// it. Elements are targeted via the `.gpsc-root` wrapper (src/templates/card.ts),
// the `.bar` / `.arc` chart classes, the per-item `--gpsc-i` index custom
// property (set on each arc/bar for "one-by-one" staggering), and the
// `.gpsc-reveal` clip rect (an inert full-size clip the reveal preset wipes in).

export type AnimationName = 'fade' | 'rise' | 'draw' | 'stagger' | 'load' | 'sequence' | 'hue';

const ANIMATIONS: ReadonlySet<string> = new Set(['fade', 'rise', 'draw', 'stagger', 'load', 'sequence', 'hue']);

// Each preset has a default base duration (seconds), tuned to be comfortably
// visible. Multi-step presets scale their parts off this base, so it doubles as
// the overall "speed" knob — see `duration` below.
const DEFAULT_DURATION: Record<AnimationName, number> = {
    fade: 1.1,
    rise: 1.1,
    draw: 1.3,
    stagger: 1.2,
    load: 1.8,
    sequence: 2,
    hue: 1.4
};

// Bounds for the user-supplied `duration` override (seconds). Wide enough to go
// snappy or slow-mo, clamped so a hostile value can't freeze or spin the card.
const MIN_DURATION = 0.2;
const MAX_DURATION = 5;

// Whitelist the animation query parameter (enum). Unknown/absent values disable
// animation, so a bad value can never inject anything into the SVG.
export function parseAnimation(value: unknown): AnimationName | undefined {
    return typeof value === 'string' && ANIMATIONS.has(value) ? (value as AnimationName) : undefined;
}

// Parse the optional `duration` override (seconds). Falls back to the preset's
// default for missing / non-numeric / out-of-range input, and clamps otherwise.
export function parseDuration(value: unknown, fallback: number): number {
    const n = typeof value === 'string' ? Number(value) : NaN;
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.min(MAX_DURATION, Math.max(MIN_DURATION, n));
}

// Shared keyframes used across presets.
const KEYFRAMES = `
@keyframes gpsc-fade{from{opacity:0}to{opacity:1}}
@keyframes gpsc-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes gpsc-slideup{from{transform:translateY(16px)}to{transform:translateY(0)}}
@keyframes gpsc-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes gpsc-pop{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:scale(1)}}
@keyframes gpsc-wipe{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes gpsc-hue{from{filter:hue-rotate(-35deg) saturate(1.6)}to{filter:hue-rotate(0) saturate(1)}}`;

// Trim floating-point noise from computed seconds (e.g. 0.44000000001 -> "0.44").
const s = (seconds: number): string => `${Number(seconds.toFixed(3))}s`;

// Each preset is a function of the base duration `d` (seconds); multi-step
// presets express their part durations/delays as fractions of `d` so the whole
// sequence scales uniformly when `d` changes.
const PRESETS: Record<AnimationName, (d: number) => string> = {
    fade: d => `.gpsc-root{animation:gpsc-fade ${s(d)} ease both}`,
    rise: d => `.gpsc-root{animation:gpsc-rise ${s(d)} cubic-bezier(.2,.7,.3,1) both}`,
    draw: d =>
        `.gpsc-root{animation:gpsc-fade ${s(d * 0.4)} ease both}` +
        `rect.bar{animation:gpsc-grow ${s(d)} cubic-bezier(.2,.7,.3,1) both;transform-box:fill-box;transform-origin:center bottom}` +
        `.arc{animation:gpsc-pop ${s(d * 0.6)} ease both;transform-box:fill-box;transform-origin:center}`,
    stagger: d =>
        `.gpsc-root>rect{animation:gpsc-fade ${s(d * 0.45)} ease both}` +
        `.gpsc-root>text{animation:gpsc-fade ${s(d * 0.5)} ease both ${s(d * 0.2)}}` +
        `.gpsc-root>g{animation:gpsc-fade ${s(d * 0.55)} ease both ${s(d * 0.4)}}`,
    // "load": a coordinated loading→loaded assembly — the card slides up while its
    // background, title and body fade in one after another, then the charts draw on.
    load: d =>
        `.gpsc-root{animation:gpsc-slideup ${s(d * 0.45)} cubic-bezier(.2,.7,.3,1) both}` +
        `.gpsc-root>rect{animation:gpsc-fade ${s(d * 0.3)} ease both}` +
        `.gpsc-root>text{animation:gpsc-fade ${s(d * 0.35)} ease both ${s(d * 0.15)}}` +
        `.gpsc-root>g{animation:gpsc-fade ${s(d * 0.4)} ease both ${s(d * 0.3)}}` +
        `rect.bar{animation:gpsc-grow ${s(d * 0.5)} cubic-bezier(.2,.7,.3,1) both ${s(d * 0.45)};transform-box:fill-box;transform-origin:center bottom}` +
        `.arc{animation:gpsc-pop ${s(d * 0.35)} ease both ${s(d * 0.55)};transform-box:fill-box;transform-origin:center}`,
    // "sequence": chart elements reveal one-by-one — donut arcs pop and bars grow in
    // index order (via --gpsc-i), and the contributions area wipes in along the
    // x-axis (via the .gpsc-reveal clip). The card itself just fades in quickly.
    sequence: d =>
        `.gpsc-root{animation:gpsc-fade ${s(d * 0.2)} ease both}` +
        `.arc{animation:gpsc-pop ${s(d * 0.35)} calc(var(--gpsc-i,0) * ${s(d * 0.12)}) ease both;transform-box:fill-box;transform-origin:center}` +
        `rect.bar{animation:gpsc-grow ${s(d * 0.3)} calc(var(--gpsc-i,0) * ${s(d * 0.035)}) cubic-bezier(.2,.7,.3,1) both;transform-box:fill-box;transform-origin:center bottom}` +
        `.gpsc-reveal{animation:gpsc-wipe ${s(d * 0.9)} linear both;transform-box:fill-box;transform-origin:left}`,
    // "hue": the whole card fades in while its colours sweep from a shifted, more
    // saturated hue to their final values — a soft gradient-like colour settle.
    hue: d => `.gpsc-root{animation:gpsc-fade ${s(d * 0.5)} ease both,gpsc-hue ${s(d)} ease both}`
};

// Respect users who prefer reduced motion — they get the final (un-animated) card.
const REDUCED_MOTION = `@media (prefers-reduced-motion:reduce){.gpsc-root,.gpsc-root *,rect.bar,.arc,.gpsc-reveal{animation:none!important}}`;

// Inject the animation CSS into an already-rendered card SVG string. Returns the
// SVG unchanged for an unknown/absent preset. `durationRaw` is the raw query
// value; it falls back to the preset's default when missing/invalid.
export function applyAnimation(svg: string, name: AnimationName | undefined, durationRaw?: unknown): string {
    if (!name) return svg;
    const d = parseDuration(durationRaw, DEFAULT_DURATION[name]);
    const css = `${KEYFRAMES}${PRESETS[name](d)}${REDUCED_MOTION}`;
    // Insert a <style> block right after the opening <svg ...> tag (there is exactly
    // one root <svg> in a card).
    return svg.replace(/(<svg\b[^>]*>)/, `$1<style>${css}</style>`);
}
