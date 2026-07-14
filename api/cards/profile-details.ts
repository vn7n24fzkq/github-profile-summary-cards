import {dispatchProfileDetailsSVG} from '../../src/utils/owner-dispatch';
import {handleCard} from '../utils/handle-card';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) => {
    // Optional override for the displayed name/title (elided to fit; see
    // buildProfileTitle). Ignored when not a string.
    const displayName = typeof req.query.name === 'string' ? req.query.name : undefined;
    return handleCard(req, res, 'profile_details_card', (username, theme, override, token) =>
        dispatchProfileDetailsSVG(username, theme, token, override, displayName)
    );
};
