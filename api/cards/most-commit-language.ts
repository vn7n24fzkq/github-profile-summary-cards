import {getCommitsLanguageSVGWithThemeName} from '../../src/cards/most-commit-language-card';
import {changToNextGitHubToken} from '../utils/github-token-updater';
import {getErrorMsgCard} from '../utils/error-card';
import {translateLanguage} from '../../src/utils/translator';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
    let {username, theme = 'default', exclude = ''} = req.query;

    if (typeof theme !== 'string') {
        res.status(400).send('theme must be a string');
        return;
    }
    if (typeof username !== 'string') {
        res.status(400).send('username must be a string');
        return;
    }
    if (typeof exclude !== 'string') {
        res.status(400).send('exclude must be a string');
        return;
    }
    let excludeArr = <string[]>[];
    exclude.split(',').forEach(function (val) {
        const translatedLanguage = translateLanguage(val);
        excludeArr.push(translatedLanguage.toLowerCase());
    });

    try {
        let tokenIndex = 0;
        while (true) {
            try {
                const cardSVG = await getCommitsLanguageSVGWithThemeName(username, theme, excludeArr);
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
