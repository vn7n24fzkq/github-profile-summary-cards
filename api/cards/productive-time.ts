import {getProductiveTimeSVGWithThemeName} from '../../src/cards/productive-time-card';
import {getOwnerType} from '../../src/github-api/owner-type';
import {getErrorMsgCard} from '../utils/error-card';
import {handleCard} from '../utils/handle-card';
import type {VercelRequest, VercelResponse} from '@vercel/node';

const ORG_NOT_SUPPORTED =
    'The Productive Time card is not available for organization accounts. This card relies on per-user contribution data that GitHub does not expose at the organization level.';

export default (req: VercelRequest, res: VercelResponse) => {
    const {utcOffset: rawOffset = '0'} = req.query;
    if (typeof rawOffset !== 'string') {
        res.status(400).send('utcOffset must be a string');
        return;
    }
    // Validate + clamp to a real UTC offset range so a non-numeric value can't
    // produce an all-zero chart (NaN index) and a huge value can't grow the
    // 24-hour bucket array out of range (which throws in the template).
    const parsed = Number(rawOffset);
    const utcOffset = Number.isFinite(parsed) ? Math.min(14, Math.max(-12, parsed)) : 0;
    return handleCard(
        req,
        res,
        'productive_time_card',
        async (username, theme, override, token) => {
            const ownerType = await getOwnerType(username, token);
            if (ownerType === 'Organization') {
                return getErrorMsgCard(ORG_NOT_SUPPORTED, theme);
            }
            return getProductiveTimeSVGWithThemeName(username, theme, utcOffset, token, override);
        },
        {utcOffset: String(utcOffset)}
    );
};
