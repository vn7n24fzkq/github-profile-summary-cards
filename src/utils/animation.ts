// Optional, opt-in card entrance animations. These are pure declarative CSS
// (@keyframes in an injected <style>) — no JS — because the cards are embedded in
// READMEs through GitHub's camo proxy, which strips <script> but renders CSS
// animations. The animation is applied by post-processing the finished SVG
// string (see api/utils/handle-card.ts) so no card generator needs to know about
// it.
//
// Targeting model: the background rect (a direct `<rect>` child of `.gpsc-root`)
// is never animated, so it shows immediately. Everything else is animated per
// atom via these hooks:
//   - `.gpsc-item` — a content atom (title line, each detail/stats row, each
//     language legend entry). Carries a `--gpsc-i` index so presets can reveal
//     atoms one-by-one. Only ever opacity/translate — items with an SVG transform
//     attribute are wrapped so a CSS transform is safe.
//   - `.gpsc-chart` — the profile area-chart wrapper. Fades with the content in
//     the non-drawing presets; in draw/load/sequence its opacity is left alone and
//     it's revealed purely by the clip wipe (so the two never fight).
//   - `.arc` / `rect.bar` — donut arcs / histogram bars (transform-safe).
//   - `.gpsc-reveal` — inert full-size clip rect the reveal presets slide in from
//     the left so the contributions line draws on along the x-axis.

export type AnimationName = 'fade' | 'rise' | 'draw' | 'stagger' | 'load' | 'sequence' | 'tint' | 'rgb' | 'rgb-soft';

const ANIMATIONS: ReadonlySet<string> = new Set([
    'fade',
    'rise',
    'draw',
    'stagger',
    'load',
    'sequence',
    'tint',
    'rgb',
    'rgb-soft'
]);

// Each preset has a default base duration (seconds), tuned to be comfortably
// visible. Multi-step presets scale their parts off this base, so it doubles as
// the overall "speed" knob — see `duration` below.
const DEFAULT_DURATION: Record<AnimationName, number> = {
    fade: 3,
    rise: 3,
    draw: 2.5,
    stagger: 2.6,
    load: 3,
    sequence: 2.8,
    tint: 3,
    // rgb / rgb-soft are continuous loops; the duration is the colour-cycle period
    // (slower = calmer). 5s is a mellow default; bump toward the 10s cap for calmer.
    rgb: 5,
    'rgb-soft': 5
};

// Bounds for the user-supplied `duration` override (seconds). Wide enough to go
// snappy or slow (e.g. a mellow 10s rgb colour cycle), clamped so a hostile value
// can't freeze the card or spin it absurdly slowly.
const MIN_DURATION = 0.2;
const MAX_DURATION = 10;

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
@keyframes gpsc-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes gpsc-pop{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:scale(1)}}
@keyframes gpsc-wipe{from{transform:translateX(calc(-1 * var(--gpsc-w,420px)))}to{transform:translateX(0)}}
@keyframes gpsc-tint{from{filter:sepia(.7) saturate(4) hue-rotate(-70deg)}to{filter:sepia(0) saturate(1) hue-rotate(0)}}
@keyframes gpsc-rgb{0%{filter:hue-rotate(0deg) saturate(1)}50%{filter:hue-rotate(180deg) saturate(1.7)}100%{filter:hue-rotate(360deg) saturate(1)}}`;

// Trim floating-point noise from computed seconds (e.g. 0.44000000001 -> "0.44").
const s = (seconds: number): string => `${Number(seconds.toFixed(3))}s`;

// Per-item stagger delay: index (`--gpsc-i`, default 0) times a base step.
const itemDelay = (step: number): string => `calc(var(--gpsc-i,0) * ${s(step)})`;

// Chart-element transform helpers (bars grow from the bottom, arcs/segments pop
// from their centre, the reveal clip wipes from the left).
const GROW = 'transform-box:fill-box;transform-origin:center bottom';
const POP = 'transform-box:fill-box;transform-origin:center';

// Each preset is a function of the base duration `d` (seconds). Presets never
// touch `.gpsc-root` or its background `<rect>` (both stay put — the card frame
// shows immediately); they animate the content atoms instead. Multi-step presets
// express their part durations/delays as fractions of `d` so the whole sequence
// scales uniformly when `d` changes.
const PRESETS: Record<AnimationName, (d: number) => string> = {
    // Content atoms and charts simply fade in over the background.
    fade: d => `.gpsc-item,.gpsc-chart,.arc,rect.bar{animation:gpsc-fade ${s(d)} ease both}`,
    // Same, but atoms also slide up a touch, lightly staggered.
    rise: d =>
        `.gpsc-item,.gpsc-chart,.arc,rect.bar{animation:gpsc-rise ${s(d)} cubic-bezier(.2,.7,.3,1) both ${itemDelay(d * 0.05)}}`,
    // Atoms fade while the charts "draw": bars grow, arcs pop, the line wipes in.
    // (The area chart's opacity is left alone here — the clip wipe is its reveal.)
    draw: d =>
        `.gpsc-item{animation:gpsc-fade ${s(d * 0.5)} ease both}` +
        `.arc{animation:gpsc-pop ${s(d * 0.6)} ease both;${POP}}` +
        `rect.bar{animation:gpsc-grow ${s(d)} cubic-bezier(.2,.7,.3,1) both;${GROW}}` +
        `.gpsc-reveal{animation:gpsc-wipe ${s(d)} linear both}`,
    // Every content atom fades in, one after another (background stays put).
    stagger: d =>
        `.gpsc-item,.gpsc-chart,.arc,rect.bar{animation:gpsc-fade ${s(d * 0.6)} ease both ${itemDelay(d * 0.08)}}`,
    // Coordinated "loading → loaded": atoms stagger in over the background, then
    // the charts draw on.
    load: d =>
        `.gpsc-item{animation:gpsc-fade ${s(d * 0.4)} ease both ${itemDelay(d * 0.06)}}` +
        `.arc{animation:gpsc-pop ${s(d * 0.4)} ease both ${s(d * 0.45)};${POP}}` +
        `rect.bar{animation:gpsc-grow ${s(d * 0.5)} cubic-bezier(.2,.7,.3,1) both ${s(d * 0.45)};${GROW}}` +
        `.gpsc-reveal{animation:gpsc-wipe ${s(d * 0.6)} linear both ${s(d * 0.4)}}`,
    // Strict one-by-one reveal: title lines and every row/language reveal in index
    // order, then the line wipes in along the axis AFTER them (the clip carries the
    // chart's --gpsc-i so its delay lines up with the rows, not t=0 — otherwise the
    // line would already be half-revealed when the chart appears).
    sequence: d =>
        `.gpsc-item{animation:gpsc-fade ${s(d * 0.3)} ease both ${itemDelay(d * 0.12)}}` +
        `.arc{animation:gpsc-pop ${s(d * 0.35)} ease both ${itemDelay(d * 0.12)};${POP}}` +
        `rect.bar{animation:gpsc-grow ${s(d * 0.3)} cubic-bezier(.2,.7,.3,1) both ${itemDelay(d * 0.035)};${GROW}}` +
        `.gpsc-reveal{animation:gpsc-wipe ${s(d * 0.9)} linear both ${itemDelay(d * 0.12)}}`,
    // "tint": a one-shot colour entrance — atoms fade in while their colours sweep
    // from a shifted, more saturated hue to their final values (a soft colour settle
    // over the background). Distinct from the looping rgb presets.
    tint: d =>
        `.gpsc-item,.gpsc-chart,.arc,rect.bar{animation:gpsc-fade ${s(d * 0.5)} ease both,gpsc-tint ${s(d)} ease both}`,
    // "rgb": a continuous "gaming RGB" loop — the whole card's colours cycle through
    // the spectrum and back (hue-rotate 0→360) with a mid-cycle saturation pulse for
    // depth, rotating the chosen theme's own colours. It intentionally animates the
    // whole `.gpsc-root` (border/background included).
    rgb: d => `.gpsc-root{animation:gpsc-rgb ${s(d)} linear infinite}`,
    // "rgb-soft": the same continuous colour cycle, but only on the content — the
    // background/frame keeps its theme colour.
    'rgb-soft': d => `.gpsc-item,.gpsc-chart,.arc,rect.bar{animation:gpsc-rgb ${s(d)} linear infinite}`
};

// Respect users who prefer reduced motion — they get the final (un-animated) card.
const REDUCED_MOTION = `@media (prefers-reduced-motion:reduce){.gpsc-root,.gpsc-root *,.gpsc-item,.gpsc-chart,rect.bar,.arc,.gpsc-reveal{animation:none!important}}`;

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
