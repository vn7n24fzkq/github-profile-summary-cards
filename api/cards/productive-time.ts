import {getProductiveTimeSVGWithThemeName} from '../../src/cards/productive-time-card';
import {changToNextGitHubToken} from '../utils/github-token-updater';
import {getErrorMsgCard} from '../utils/error-card';
import type {VercelRequest, VercelResponse} from '@vercel/node';

const parseUTCOffset = (offsetParam: string): number => {
    const normalized = offsetParam.replace(/:/g, '.');
    const parsed = parseFloat(normalized);
    
    if (isNaN(parsed)) {
        throw new Error(`Invalid UTC offset: ${offsetParam}. Valid examples: 8, -5.5, -3:30`);
    }
    
    if (parsed < -12 || parsed > 14) {
        throw new Error('UTC offset must be between -12 and +14');
    }
    
    return parsed;
};

export default async (req: VercelRequest, res: VercelResponse) => {
    const {username, theme = 'default', utcOffset = '0'} = req.query;
    
    if (typeof theme !== 'string') {
        return res.status(400).send('theme must be a string');
    }
    if (typeof username !== 'string') {
        return res.status(400).send('username must be a string');
    }
    if (typeof utcOffset !== 'string') {
        return res.status(400).send('utcOffset must be a string');
    }

    try {
        const validatedOffset = parseUTCOffset(utcOffset);
        
        let tokenIndex = 0;
        while (true) {
            try {
                const cardSVG = await getProductiveTimeSVGWithThemeName(
                    username,
                    theme,
                    validatedOffset
                );
                res.setHeader('Content-Type', 'image/svg+xml');
                return res.send(cardSVG);
            } catch (err: any) {
                console.error('API Error:', err.message);
                
                if (err.message.includes('Bad credentials')) {
                    changToNextGitHubToken(tokenIndex);
                    tokenIndex += 1;
                } else {
                    throw err;
                }
            }
        }
    } catch (err: any) {
        console.error('Final Error:', err);
        return res.send(getErrorMsgCard(
            `Failed to generate card: ${err.message}`,
            theme
        ));
    }
};
