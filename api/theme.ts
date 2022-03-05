import {ThemeMap} from '../src/const/theme';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export default (_: VercelRequest, response: VercelResponse) => {
    const themes = Array.from(ThemeMap.keys());
    response.send({themes: themes});
};
