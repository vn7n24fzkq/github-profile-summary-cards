import {getStatsSVGWithThemeName} from '../../src/cards/stats-card';
import {getGitHubToken} from '../utils/github-token-updater';
import {getErrorMsgCard} from '../utils/error-card';
import {sendAnalytics} from '../../src/utils/analytics';
import {CONST_CACHE_CONTROL} from '../../src/const/cache';
import {resolveThemeName} from '../../src/const/theme';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
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
    try {
        let token = getGitHubToken(0);
        let tokenIndex = 0;
        while (true) {
            try {
                const cardSVG = await getStatsSVGWithThemeName(username, theme, token);
                res.setHeader('Content-Type', 'image/svg+xml');
                res.setHeader('Cache-Control', CONST_CACHE_CONTROL);
                res.send(cardSVG);
                // Fire-and-forget: don't block the response on analytics
                void sendAnalytics('stats_card', {username, theme}, req.headers);
                return;
            } catch (err: any) {
                console.log(err.message);
                // We update github token and try again, until getNextGitHubToken throw an Error
                if (err.response && (err.response.status === 403 || err.response.status === 401)) {
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
};
