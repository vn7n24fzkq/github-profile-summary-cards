import {dispatchStatsSVG} from '../../src/utils/owner-dispatch';
import {handleCard} from '../utils/handle-card';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) =>
    handleCard(req, res, 'stats_card', (username, theme, override, token) =>
        dispatchStatsSVG(username, theme, token, override)
    );
