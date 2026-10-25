import {getProductiveTimeSVGWithThemeName} from '../../src/cards/productive-time-card';
import {getOwnerType} from '../../src/github-api/owner-type';
import {normalizeTimeZone} from '../../src/utils/time-zone';
import {getErrorMsgCard} from '../utils/error-card';
import {handleCard} from '../utils/handle-card';
import type {VercelRequest, VercelResponse} from '@vercel/node';

const ORG_NOT_SUPPORTED =
    'The Productive Time card is not available for organization accounts. This card relies on per-user contribution data that GitHub does not expose at the organization level.';

export default (req: VercelRequest, res: VercelResponse) => {
    const {utcOffset: rawOffset = '0', timeZone: rawTimeZone, exclude_repos: rawExcludeRepos = ''} = req.query;

    if (typeof rawExcludeRepos !== 'string') {
        res.status(400).send('exclude_repos must be a string');
        return;
    }
    // Comma-separated repo names to skip (case-insensitive); owner/repo also matches.
    const excludeRepos = rawExcludeRepos
        .split(',')
        .map(val => val.trim().toLowerCase())
        .filter(val => val.length > 0);

    let timeZone: string | undefined;
    if (rawTimeZone !== undefined) {
        if (typeof rawTimeZone !== 'string') {
            res.status(400).send('timeZone must be a string');
            return;
        }
        // Validate here, not in the renderer: handleCard turns thrown errors into
        // an HTTP 200 error card. An invalid zone is a client error and must be 400.
        const normalized = normalizeTimeZone(rawTimeZone);
        if (!normalized) {
            res.status(400).send('timeZone must be a valid IANA time zone (e.g. Europe/Zurich)');
            return;
        }
        timeZone = normalized;
    }

    // A valid time zone takes precedence: ignore utcOffset entirely, including
    // repeated-query arrays that would otherwise fail the legacy type check.
    let utcOffset = 0;
    if (typeof rawOffset === 'string') {
        // Validate + clamp to a real UTC offset range so a non-numeric value can't
        // produce an all-zero chart (NaN index) and a huge value can't grow the
        // 24-hour bucket array out of range (which throws in the template).
        const parsed = Number(rawOffset);
        utcOffset = Number.isFinite(parsed) ? Math.min(14, Math.max(-12, parsed)) : 0;
    } else if (timeZone === undefined) {
        res.status(400).send('utcOffset must be a string');
        return;
    }

    return handleCard(
        req,
        res,
        'productive_time_card',
        async (username, theme, override, token) => {
            const ownerType = await getOwnerType(username, token);
            if (ownerType === 'Organization') {
                return getErrorMsgCard(ORG_NOT_SUPPORTED, theme);
            }
            return getProductiveTimeSVGWithThemeName(
                username,
                theme,
                utcOffset,
                token,
                override,
                timeZone,
                excludeRepos
            );
        },
        // Analytics only. The SVG response is cached by the CDN against the full
        // request URL, so different timeZone/exclude_repos values are already
        // distinct entries. The Redis data key stays per-user because the cached
        // payload is zone-independent and grouped per repo (both the time-zone
        // conversion and the exclude filter run after the cache boundary).
        {utcOffset: String(utcOffset), timeZone: timeZone ?? null, exclude_repos_used: String(excludeRepos.length > 0)}
    );
};
