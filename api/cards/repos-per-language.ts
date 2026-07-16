import {dispatchReposPerLanguageSVG} from '../../src/utils/owner-dispatch';
import {handleCard} from '../utils/handle-card';
import {parseExcludeLanguages} from '../../src/utils/translator';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) => {
    const {exclude = ''} = req.query;
    const excludeReposRaw = req.query.exclude_repos ?? '';
    if (typeof exclude !== 'string') {
        res.status(400).send('exclude must be a string');
        return;
    }
    if (typeof excludeReposRaw !== 'string') {
        res.status(400).send('exclude_repos must be a string');
        return;
    }
    const excludeArr = parseExcludeLanguages(exclude);
    // Comma-separated repo names to skip (case-insensitive), e.g. exclude_repos=dotfiles,my-fork
    const excludeReposArr = excludeReposRaw.split(',').map(val => val.trim().toLowerCase());
    return handleCard(
        req,
        res,
        'repos_per_language_card',
        (username, theme, override, token) =>
            dispatchReposPerLanguageSVG(username, theme, excludeArr, token, override, excludeReposArr),
        {
            exclude_used: String(exclude.length > 0),
            exclude_repos_used: String(excludeReposRaw.length > 0)
        }
    );
};
