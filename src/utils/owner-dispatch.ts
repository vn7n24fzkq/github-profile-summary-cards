import {ThemeColorOverride} from '../const/theme';
import {getProfileDetailsSVGWithThemeName} from '../cards/profile-details-card';
import {getReposPerLanguageSVGWithThemeName} from '../cards/repos-per-language-card';
import {getCommitsLanguageSVGWithThemeName} from '../cards/most-commit-language-card';
import {getStatsSVGWithThemeName} from '../cards/stats-card';
import {getOrganizationProfileDetailsSVGWithThemeName} from '../cards/organization-profile-details-card';
import {getOrganizationReposPerLanguageSVGWithThemeName} from '../cards/organization-repos-per-language-card';
import {getOrganizationCommitsLanguageSVGWithThemeName} from '../cards/organization-most-commit-language-card';
import {getOrganizationStatsSVGWithThemeName} from '../cards/organization-stats-card';

// The card endpoints don't know up front whether a login is a User or an
// Organization. Instead of spending an extra `repositoryOwner` probe query on
// every request — which would double the GitHub API calls for the common
// individual-user case and exhaust the (shared) rate limit faster — we try the
// user pipeline first and only fall back to the organization pipeline when the
// user lookup fails *because the login isn't a user* (the user query returns
// null and the mapping code throws). Auth / rate-limit errors are re-thrown
// untouched so the caller's token-rotation keeps working.
function isAuthOrRateLimit(err: any): boolean {
    const status = err?.response?.status;
    return status === 401 || status === 403;
}

async function dispatch(userRender: () => Promise<string>, orgRender: () => Promise<string>): Promise<string> {
    try {
        return await userRender();
    } catch (err) {
        if (isAuthOrRateLimit(err)) throw err;
        try {
            return await orgRender();
        } catch {
            // Login isn't a user and isn't a resolvable org either — surface the
            // original user-pipeline error (e.g. a mistyped username) instead of
            // the less-relevant "Organization not found".
            throw err;
        }
    }
}

export const dispatchProfileDetailsSVG = function (
    login: string,
    themeName: string,
    token: string,
    override?: ThemeColorOverride,
    displayName?: string
): Promise<string> {
    return dispatch(
        () => getProfileDetailsSVGWithThemeName(login, themeName, token, override, displayName),
        () => getOrganizationProfileDetailsSVGWithThemeName(login, themeName, token, override, displayName)
    );
};

export const dispatchReposPerLanguageSVG = function (
    login: string,
    themeName: string,
    exclude: Array<string>,
    token: string,
    override?: ThemeColorOverride
): Promise<string> {
    return dispatch(
        () => getReposPerLanguageSVGWithThemeName(login, themeName, exclude, token, override),
        () => getOrganizationReposPerLanguageSVGWithThemeName(login, themeName, exclude, token, override)
    );
};

export const dispatchMostCommitLanguageSVG = function (
    login: string,
    themeName: string,
    exclude: Array<string>,
    token: string,
    override?: ThemeColorOverride
): Promise<string> {
    return dispatch(
        () => getCommitsLanguageSVGWithThemeName(login, themeName, exclude, token, override),
        () => getOrganizationCommitsLanguageSVGWithThemeName(login, themeName, exclude, token, override)
    );
};

export const dispatchStatsSVG = function (
    login: string,
    themeName: string,
    token: string,
    override?: ThemeColorOverride
): Promise<string> {
    return dispatch(
        () => getStatsSVGWithThemeName(login, themeName, token, override),
        () => getOrganizationStatsSVGWithThemeName(login, themeName, token, override)
    );
};
