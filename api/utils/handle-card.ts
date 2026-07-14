import {getGitHubToken} from './github-token-updater';
import {getErrorMsgCard} from './error-card';
import {sendAnalytics} from '../../src/utils/analytics';
import {CONST_CACHE_CONTROL} from '../../src/const/cache';
import {resolveThemeName, parseThemeColorOverride, ThemeColorOverride} from '../../src/const/theme';
import {parseAnimation, applyAnimation} from '../../src/utils/animation';
import type {VercelRequest, VercelResponse} from '@vercel/node';

// A card renderer receives the already-validated username, the resolved theme
// name, the parsed color override and a GitHub token, and returns the SVG.
export type CardRenderer = (
    username: string,
    theme: string,
    override: ThemeColorOverride,
    token: string
) => Promise<string>;

// Errors that mean "this token can't serve the request — try the next one":
// 401/403 (auth or REST primary rate limit), 429 (secondary rate limit), and
// GraphQL RATE_LIMITED (flagged by assertNoGraphQLErrors, which has no HTTP
// status). The previous 401/403-only check missed 429 and the GraphQL-200 case,
// so the multi-token rotation never engaged under real rate limits.
function isRotatableError(err: any): boolean {
    const status = err?.response?.status;
    return status === 401 || status === 403 || status === 429 || err?.isRateLimit === true;
}

// Shared request handler for every card endpoint: validates username/theme,
// resolves the theme + color overrides, runs the renderer while rotating GitHub
// tokens on rate-limit/auth errors, sets headers, fires analytics, and renders a
// friendly error card on failure.
export async function handleCard(
    req: VercelRequest,
    res: VercelResponse,
    eventName: string,
    render: CardRenderer,
    extraAnalytics: Record<string, unknown> = {}
): Promise<void> {
    const {username, theme: rawTheme = 'default'} = req.query;
    if (typeof rawTheme !== 'string') {
        res.status(400).send('theme must be a string');
        return;
    }
    if (typeof username !== 'string') {
        res.status(400).send('username must be a string');
        return;
    }
    const theme = resolveThemeName(rawTheme);
    const override = parseThemeColorOverride(req.query);
    const animation = parseAnimation(req.query.animation);

    try {
        let tokenIndex = 0;
        let token = getGitHubToken(tokenIndex);
        // Rotate through the configured tokens until one succeeds or getGitHubToken
        // throws (no token at the next index).
        while (true) {
            try {
                const cardSVG = await render(username, theme, override, token);
                res.setHeader('Content-Type', 'image/svg+xml');
                res.setHeader('Cache-Control', CONST_CACHE_CONTROL);
                res.send(applyAnimation(cardSVG, animation, req.query.duration));
                // Fire-and-forget: don't block the response on analytics.
                void sendAnalytics(eventName, {username, theme, ...extraAnalytics}, req.headers);
                return;
            } catch (err: any) {
                console.log(err.message);
                if (isRotatableError(err)) {
                    tokenIndex += 1;
                    token = getGitHubToken(tokenIndex);
                } else {
                    throw err;
                }
            }
        }
    } catch (err: any) {
        console.log(err);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(getErrorMsgCard(err.message, theme));
    }
}
