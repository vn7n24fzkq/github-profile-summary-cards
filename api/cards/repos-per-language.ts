import {dispatchReposPerLanguageSVG} from '../../src/utils/owner-dispatch';
import {handleCard} from '../utils/handle-card';
import {parseExcludeLanguages} from '../../src/utils/translator';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) => {
    const {exclude = ''} = req.query;
    if (typeof exclude !== 'string') {
        res.status(400).send('exclude must be a string');
        return;
    }
    const excludeArr = parseExcludeLanguages(exclude);
    return handleCard(req, res, 'repos_per_language_card', (username, theme, override, token) =>
        dispatchReposPerLanguageSVG(username, theme, excludeArr, token, override)
    );
};
