import {dispatchStatsSVG} from '../../src/utils/owner-dispatch';
import {handleCard} from '../utils/handle-card';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) => {
    // Opt-in flag to drop the big GitHub logo on the right of the stats card.
    const hideLogo = req.query.hide_logo === 'true';
    return handleCard(
        req,
        res,
        'stats_card',
        (username, theme, override, token) => dispatchStatsSVG(username, theme, token, override, hideLogo),
        {hide_logo: String(hideLogo)}
    );
};
