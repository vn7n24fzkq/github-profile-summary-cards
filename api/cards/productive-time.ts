import {getProductiveTimeSVGWithThemeName} from '../../src/cards/productive-time-card';
import {getGitHubToken} from '../utils/github-token-updater';
import {getErrorMsgCard} from '../utils/error-card';
import {sendAnalytics} from '../../src/utils/analytics';
import {CONST_CACHE_CONTROL} from '../../src/const/cache';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
    const {username, theme = 'default', utcOffset = '0'} = req.query;
    if (typeof theme !== 'string') {
        res.status(400).send('theme must be a string');
        return;
    }
    if (typeof username !== 'string') {
        res.status(400).send('username must be a string');
        return;
    }
    if (typeof utcOffset !== 'string') {
        res.status(400).send('utcOffset must be a string');
        return;
    }
    try {
        let token = getGitHubToken(0);
        let tokenIndex = 0;
        while (true) {
            try {
                const cardSVG = await getProductiveTimeSVGWithThemeName(username, theme, Number(utcOffset), token);
                await sendAnalytics('productive-time-card', {username, theme, utcOffset}, req.headers);
                res.setHeader('Content-Type', 'image/svg+xml');
                res.setHeader('Cache-Control', CONST_CACHE_CONTROL);
                res.send(cardSVG);
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
        res.send(getErrorMsgCard(err.message, theme));
    }
};
