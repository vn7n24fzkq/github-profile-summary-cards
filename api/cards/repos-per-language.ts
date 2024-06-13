import {getReposPerLanguageSVGWithThemeName} from '../../src/cards/repos-per-language-card';
import {changToNextGitHubToken} from '../utils/github-token-updater';
import {getErrorMsgCard} from '../utils/error-card';
import {translateLanguage} from '../../src/utils/translator';
import {Theme} from '../../src/const/theme';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
    let {
        username,
        theme = 'default',
        exclude = '',
        title_color = '',
        text_color = '',
        bg_color = '',
        border_color = '',
        icon_color = '',
        chart_color = ''
    } = req.query;

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
    if (typeof title_color !== 'string') {
        res.status(400).send('title_color must be a string');
        return;
    }
    if (typeof text_color !== 'string') {
        res.status(400).send('text_color must be a string');
        return;
    }
    if (typeof bg_color !== 'string') {
        res.status(400).send('bg_color must be a string');
        return;
    }
    if (typeof border_color !== 'string') {
        res.status(400).send('border_color must be a string');
        return;
    }
    if (typeof icon_color !== 'string') {
        res.status(400).send('icon_color must be a string');
        return;
    }
    if (typeof chart_color !== 'string') {
        res.status(400).send('chart_color must be a string');
        return;
    }
    let customTheme = new Theme(
        title_color,
        text_color,
        bg_color,
        border_color,
        -1,  // strokeOpacity is not used in custom themes
        icon_color,
        chart_color
    );
    let excludeArr = <string[]>[];
    exclude.split(',').forEach(function (val) {
        excludeArr.push(translateLanguage(val));
    });

    try {
        let tokenIndex = 0;
        while (true) {
            try {
                const cardSVG = await getReposPerLanguageSVGWithThemeName(username, theme, customTheme, excludeArr);
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
        res.send(getErrorMsgCard(err.message, theme));
    }
};
