import {dispatchProfileDetailsSVG} from '../../src/utils/owner-dispatch';
import {handleCard} from '../utils/handle-card';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) =>
    handleCard(req, res, 'profile_details_card', (username, theme, override, token) =>
        dispatchProfileDetailsSVG(username, theme, token, override)
    );
