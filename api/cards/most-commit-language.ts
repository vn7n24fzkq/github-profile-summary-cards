import {dispatchMostCommitLanguageSVG} from '../../src/utils/owner-dispatch';
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
    // Comma-separated repo names to skip (case-insensitive). Entries may be
    // `repo` or `owner/repo` — commit contributions can live in others' repos.
    const excludeReposArr = excludeReposRaw.split(',').map(val => val.trim().toLowerCase());
    return handleCard(req, res, 'most_commit_language_card', (username, theme, override, token) =>
        dispatchMostCommitLanguageSVG(username, theme, excludeArr, token, override, excludeReposArr)
    );
};
