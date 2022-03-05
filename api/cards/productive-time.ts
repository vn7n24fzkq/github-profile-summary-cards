import {getProductiveTimeSVGWithThemeName} from '../../src/cards/productive-time-card';
import {changToNextGitHubToken} from '../utils/github-token-updater';
import {getErrorMsgCard} from '../utils/error-card';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
    const {username, theme = 'default', timezone = 'Europe/London'} = req.query;
    try {
        let tokenIndex = 0;
        while (true) {
            try {
                const cardSVG = await getProductiveTimeSVGWithThemeName(username, theme, timezone);
                res.setHeader('Content-Type', 'image/svg+xml');
                res.send(cardSVG);
                return;
            } catch (err: any) {
                console.log(err.message);
                // We update github token and try again, until getNextGitHubToken throw an Error
                changToNextGitHubToken(tokenIndex);
                tokenIndex += 1;
            }
        }
    } catch (err: any) {
        console.log(err);
        res.send(getErrorMsgCard(err.message, theme));
    }
};
