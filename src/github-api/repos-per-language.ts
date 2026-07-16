import request, {assertNoGraphQLErrors} from '../utils/request';
import {shouldFetchNextPage} from '../const/pagination';
import {withDataCache} from '../utils/data-cache';

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

// repos per language
export async function getRepoLanguages(
    username: string,
    exclude: Array<string>,
    token: string,
    excludeRepos: Array<string> = []
): Promise<RepoLanguages> {
    // Ordered by stars DESC; pagination is unbounded off Vercel and bounded to
    // VERCEL_MAX_REPO_PAGES on Vercel (see src/const/pagination.ts).
    // The raw node list is cached per username (filters apply after the cache
    // boundary, so exclude lists don't fragment it).
    const repoLanguages = new RepoLanguages();
    const nodes = await withDataCache(`v1:rl:${username.toLowerCase()}`, async () => {
        const collected: {
            name: string;
            nameWithOwner: string;
            primaryLanguage: {name: string; color: string} | null;
        }[] = [];
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
    });

    nodes.forEach(
        (node: {name: string; nameWithOwner: string; primaryLanguage: {name: string; color: string} | null}) => {
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
        }
    );

    return repoLanguages;
}
