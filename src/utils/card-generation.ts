import {ThemeMap} from '../const/theme';
import {AnimationName, applyAnimation} from './animation';
import {writeSVG} from './file-writer';

// Options for the GitHub Action card generators. Both are optional so the
// historic behaviour (all themes, no animation) is preserved when unset.
export interface CardGenerationOptions {
    // Restrict generation to a single theme; when unset, every theme is generated.
    theme?: string;
    // Bake an entrance animation into the generated SVGs; when unset, no animation.
    animation?: AnimationName;
    // Animation speed (seconds), passed straight to applyAnimation; when unset the
    // preset's default duration is used. Ignored when there's no animation.
    duration?: string;
    // Override the displayed name/title on the profile-details card; when unset,
    // the default `login (name)` is used. Ignored by the other card types.
    displayName?: string;
}

// Resolve which theme(s) to generate: a single validated theme when the caller
// pins one, otherwise every theme. Throws on an unknown theme so the Action can
// fail fast with a clear message rather than silently producing nothing.
export function resolveThemeNames(theme?: string): string[] {
    if (theme) {
        if (!ThemeMap.has(theme)) {
            throw new Error(`Theme "${theme}" does not exist`);
        }
        return [theme];
    }
    return [...ThemeMap.keys()];
}

// Shared card-writing loop for the Action path: build each requested theme's SVG,
// apply the optional entrance animation, and write it to the output folder.
export function writeThemedCards(
    fileName: string,
    buildSVG: (themeName: string) => string,
    options: CardGenerationOptions = {}
): void {
    for (const themeName of resolveThemeNames(options.theme)) {
        writeSVG(themeName, fileName, applyAnimation(buildSVG(themeName), options.animation, options.duration));
    }
}
