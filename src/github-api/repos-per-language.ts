import request, {assertNoGraphQLErrors, restRequest} from '../utils/request';
import {shouldFetchNextPage} from '../const/pagination';
import {withDataCache} from '../utils/data-cache';
import {languageColor} from '../const/language-colors';
import {getOwnerType} from './owner-type';

export class RepoLanguageInfo {
    name: string;
    color: string; // hexadecimal color code
    count: number;

    constructor(name: string, color: string | null = '#586e75', count: number) {
        this.name = name;
        // GitHub returns null (not just undefined) for some languages' color.
        this.color = color || '#586e75';
        this.count = count;
    }
}

export class RepoLanguages {
    private languageMap = new Map<string, RepoLanguageInfo>();

    public addLanguage(name: string, color: string | null): void {
        if (this.languageMap.has(name)) {
            const lang = this.languageMap.get(name)!;
            lang.count += 1;
            this.languageMap.set(name, lang);
        } else {
            this.languageMap.set(name, new RepoLanguageInfo(name, color, 1));
        }
    }

    public getLanguageMap(): Map<string, RepoLanguageInfo> {
        return this.languageMap;
    }
}

const fetcher = (token: string, variables: any) => {
    // contain private repo need token permission
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query ReposPerLanguage($login: String!, $endCursor: String) {
        user(login: $login) {
          repositories(isFork: false, first: 100, after: $endCursor, ownerAffiliations: OWNER) {
            nodes {
              name
              nameWithOwner
              primaryLanguage {
                name
                color
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
      `,
            variables
        }
    );
};

interface RepoNode {
    name: string;
    nameWithOwner: string;
    primaryLanguage: {name: string; color: string | null} | null;
}

// GraphQL fetch — used off Vercel (Action/CLI), where the caller's own token
// can see their private repos and the language colors ride along in the query.
async function fetchNodesViaGraphQL(username: string, token: string): Promise<RepoNode[]> {
    const collected: RepoNode[] = [];
    const startedAt = Date.now();
    let cursor: string | null = null;
    let hasNextPage = true;
    let pages = 0;

    while (hasNextPage) {
        const res: any = await fetcher(token, {login: username, endCursor: cursor});
        assertNoGraphQLErrors(res, 'GetRepoLanguage fail');
        const repos = res.data.data.user.repositories;
        collected.push(...repos.nodes);
        cursor = repos.pageInfo?.endCursor ?? null;
        pages += 1;
        hasNextPage = shouldFetchNextPage(!!repos.pageInfo?.hasNextPage, pages, undefined, startedAt);
    }
    return collected;
}

// REST fetch — used on Vercel, where the service's tokens only see public
// repos anyway, so REST returns the same data while spending the (otherwise
// idle) REST quota instead of GraphQL points. Colors come from the bundled
// linguist map since REST reports the language by name only.
async function fetchNodesViaRest(username: string, token: string): Promise<RepoNode[]> {
    // The user/org dispatch relies on the user pipeline REJECTING org logins
    // (GraphQL returns user: null for them). REST /users/{login}/repos happily
    // answers for orgs, so re-create that contract with the (week-cached) type
    // lookup before fetching.
    const ownerType = await getOwnerType(username, token);
    if (ownerType !== 'User') {
        throw Error(`Login is not a user: ${username}`);
    }

    const collected: RepoNode[] = [];
    const startedAt = Date.now();
    let hasNextPage = true;
    let pages = 0;

    while (hasNextPage) {
        const res = await restRequest(token, `/users/${encodeURIComponent(username)}/repos`, {
            per_page: 100,
            page: pages + 1,
            type: 'owner'
        });
        const repos: any[] = Array.isArray(res.data) ? res.data : [];
        for (const repo of repos) {
            if (repo.fork) continue; // GraphQL used isFork: false
            collected.push({
                name: repo.name,
                nameWithOwner: repo.full_name,
                primaryLanguage: repo.language ? {name: repo.language, color: languageColor(repo.language)} : null
            });
        }
        pages += 1;
        hasNextPage = shouldFetchNextPage(repos.length === 100, pages, undefined, startedAt);
    }
    return collected;
}

// repos per language
export async function getRepoLanguages(
    username: string,
    exclude: Array<string>,
    token: string,
    excludeRepos: Array<string> = []
): Promise<RepoLanguages> {
    // Pagination is unbounded off Vercel and bounded to VERCEL_MAX_REPO_PAGES
    // on Vercel (see src/const/pagination.ts).
    // The raw node list is cached per username (filters apply after the cache
    // boundary, so exclude lists don't fragment it). Both fetchers normalize to
    // the same node shape, so the cache payload is transport-agnostic.
    const repoLanguages = new RepoLanguages();
    const nodes = await withDataCache(`v1:rl:${username.toLowerCase()}`, async () => {
        return process.env.VERCEL ? fetchNodesViaRest(username, token) : fetchNodesViaGraphQL(username, token);
    });

    nodes.forEach((node: RepoNode) => {
        if (
            excludeRepos.includes((node.name ?? '').toLowerCase()) ||
            excludeRepos.includes((node.nameWithOwner ?? '').toLowerCase())
        ) {
            return;
        }
        if (node.primaryLanguage) {
            const langName = node.primaryLanguage.name;
            const langColor = node.primaryLanguage.color;
            if (!exclude.includes(langName.toLowerCase())) {
                repoLanguages.addLanguage(langName, langColor);
            }
        }
    });

    return repoLanguages;
}
