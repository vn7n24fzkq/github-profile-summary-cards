import {getOwnerType} from '../github-api/owner-type';
import {getProfileDetailsSVGWithThemeName} from '../cards/profile-details-card';
import {getReposPerLanguageSVGWithThemeName} from '../cards/repos-per-language-card';
import {getCommitsLanguageSVGWithThemeName} from '../cards/most-commit-language-card';
import {getStatsSVGWithThemeName} from '../cards/stats-card';
import {getOrganizationProfileDetailsSVGWithThemeName} from '../cards/organization-profile-details-card';
import {getOrganizationReposPerLanguageSVGWithThemeName} from '../cards/organization-repos-per-language-card';
import {getOrganizationCommitsLanguageSVGWithThemeName} from '../cards/organization-most-commit-language-card';
import {getOrganizationStatsSVGWithThemeName} from '../cards/organization-stats-card';

export const dispatchProfileDetailsSVG = async function (
    login: string,
    themeName: string,
    token: string
): Promise<string> {
    const ownerType = await getOwnerType(login, token);
    if (ownerType === 'Organization') {
        return getOrganizationProfileDetailsSVGWithThemeName(login, themeName, token);
    }
    return getProfileDetailsSVGWithThemeName(login, themeName, token);
};

export const dispatchReposPerLanguageSVG = async function (
    login: string,
    themeName: string,
    exclude: Array<string>,
    token: string
): Promise<string> {
    const ownerType = await getOwnerType(login, token);
    if (ownerType === 'Organization') {
        return getOrganizationReposPerLanguageSVGWithThemeName(login, themeName, exclude, token);
    }
    return getReposPerLanguageSVGWithThemeName(login, themeName, exclude, token);
};

export const dispatchMostCommitLanguageSVG = async function (
    login: string,
    themeName: string,
    exclude: Array<string>,
    token: string
): Promise<string> {
    const ownerType = await getOwnerType(login, token);
    if (ownerType === 'Organization') {
        return getOrganizationCommitsLanguageSVGWithThemeName(login, themeName, exclude, token);
    }
    return getCommitsLanguageSVGWithThemeName(login, themeName, exclude, token);
};

export const dispatchStatsSVG = async function (login: string, themeName: string, token: string): Promise<string> {
    const ownerType = await getOwnerType(login, token);
    if (ownerType === 'Organization') {
        return getOrganizationStatsSVGWithThemeName(login, themeName, token);
    }
    return getStatsSVGWithThemeName(login, themeName, token);
};
